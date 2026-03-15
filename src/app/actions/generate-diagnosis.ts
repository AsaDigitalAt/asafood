
'use server';

import { z } from 'zod';
import { adminDb, getAdminApp } from '@/lib/firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import { FieldValue } from 'firebase-admin/firestore';

export type FormState = {
  nome: string;
  statusGeral: string;
  conversions: any;
  discounts: any;
  problems: any[];
  actions: any[];
  priorities: string[];
  aiGeneratedPlan: string | null;
  error?: string;
};

const diagnosisSchema = z.object({
  restaurantName: z.string().min(1),
  foodCategory: z.string().min(1),
  deliveryType: z.enum(['propria', 'ifood']),
  currentMonthRevenue: z.coerce.number(),
  currentMonthDiscounts: z.coerce.number(),
  previousMonthRevenue: z.coerce.number(),
  previousMonthDiscounts: z.coerce.number(),
  funnelImage: z.any(),
  email: z.string().email(),
  uid: z.string().min(1),
});

/**
 * Salva imagem no Storage e processa diagnóstico via Webhook.
 */
export async function generateDiagnosis(formData: FormData): Promise<FormState> {
  const rawFormData = Object.fromEntries(formData.entries());
  const validatedFields = diagnosisSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.error("Validação falhou:", validatedFields.error.format());
    return { error: "Campos inválidos no formulário.", nome: '', statusGeral: '', conversions: {}, discounts: {}, problems: [], actions: [], priorities: [], aiGeneratedPlan: null };
  }

  const { uid, funnelImage, restaurantName } = validatedFields.data;

  try {
    const adminApp = getAdminApp();
    const storage = getStorage(adminApp).bucket();
    
    // 1. Processamento da Imagem
    let imageUrl = "";
    let fileName = "";
    
    if (funnelImage && funnelImage instanceof File) {
        const buffer = Buffer.from(await funnelImage.arrayBuffer());
        fileName = `diagnostics/${uid}/${Date.now()}-${funnelImage.name}`;
        const file = storage.file(fileName);

        await file.save(buffer, {
          metadata: { contentType: funnelImage.type },
        });

        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: '03-01-2500',
        });
        imageUrl = url;
    }

    // 2. Chamada ao Webhook
    const webhookUrl = 'https://unreleasible-pocked-azucena.ngrok-free.dev/webhook/asafood';
    
    const webhookFormData = new FormData();
    Object.entries(validatedFields.data).forEach(([key, value]) => {
      if (key !== 'funnelImage') webhookFormData.append(key, String(value));
    });
    
    if (funnelImage instanceof File) {
        webhookFormData.append('funnelImage', funnelImage);
    }
    webhookFormData.append('imageUrl', imageUrl);

    const response = await fetch(webhookUrl, {
        method: 'POST',
        body: webhookFormData,
        headers: {
          'ngrok-skip-browser-warning': 'true',
        }
    });

    if (!response.ok) {
        throw new Error(`Serviço de análise indisponível (Status ${response.status})`);
    }
    
    const rawResultData = await response.json();
    const result = processWebhookData(rawResultData);

    // 3. Persistência e Controle de Cota
    if (!result.error) {
      const userRef = adminDb.collection('users').doc(uid);
      
      await adminDb.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) throw new Error("Usuário não encontrado no banco de dados.");

        const currentUsage = userDoc.data()?.usage?.reportsThisCycle || 0;
        
        const reportRef = userRef.collection('diagnosisReports').doc();
        transaction.set(reportRef, {
          ...result,
          userId: uid,
          storagePath: fileName,
          imageUrl: imageUrl,
          createdAt: FieldValue.serverTimestamp(),
        });

        transaction.update(userRef, {
          'usage.reportsThisCycle': currentUsage + 1,
          'updatedAt': FieldValue.serverTimestamp(),
        });
      });
    }

    return result;

  } catch (e: any) {
    console.error("Erro crítico em generateDiagnosis:", e);
    return { 
      error: e.message || "Erro interno ao processar o diagnóstico.", 
      nome: '', 
      statusGeral: '', 
      conversions: {}, 
      discounts: {}, 
      problems: [], 
      actions: [], 
      priorities: [], 
      aiGeneratedPlan: null 
    };
  }
}

function processWebhookData(jsonResponse: any): FormState {
    // Se a resposta for um array, pegamos o primeiro item
    const data = Array.isArray(jsonResponse) ? jsonResponse[0] : jsonResponse;
    if (!data) return { error: "Resposta vazia do serviço.", nome: '', statusGeral: '', conversions: {}, discounts: {}, problems: [], actions: [], priorities: [], aiGeneratedPlan: null };

    const htmlReport = data.Relatório || "";
    const output = data.output || {};

    const statusGeralMatch = htmlReport.match(/Status geral do funil:<\/b>\s*([^<]+)/i);
    const statusGeral = statusGeralMatch ? statusGeralMatch[1].trim() : "Em Análise";

    return {
        nome: data.Nome || "Restaurante",
        statusGeral: statusGeral,
        conversions: output.conversoes || {},
        discounts: output.analise_descontos || {},
        problems: (output.principais_problemas || []).filter((p: any) => p !== null),
        actions: (output.acoes_imediatas || []).filter((a: any) => a !== null),
        priorities: output.prioridades_hoje || [],
        aiGeneratedPlan: output.plano_de_acao_ia || null,
        error: data.error
    };
}
