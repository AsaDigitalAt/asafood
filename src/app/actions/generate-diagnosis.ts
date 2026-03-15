
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
 * A inicialização do Admin App garante que o Bucket do Storage esteja acessível.
 */
export async function generateDiagnosis(formData: FormData): Promise<FormState> {
  const rawFormData = Object.fromEntries(formData.entries());
  const validatedFields = diagnosisSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return { error: "Campos inválidos", nome: '', statusGeral: '', conversions: {}, discounts: {}, problems: [], actions: [], priorities: [], aiGeneratedPlan: null };
  }

  const { uid, funnelImage, restaurantName } = validatedFields.data;

  try {
    // 1. Inicializa App Admin e Bucket do Storage
    const adminApp = getAdminApp();
    const storage = getStorage(adminApp).bucket();
    
    // Processamento do buffer da imagem
    const buffer = Buffer.from(await funnelImage.arrayBuffer());
    const fileName = `diagnostics/${uid}/${Date.now()}-${funnelImage.name}`;
    const file = storage.file(fileName);

    // Salva a imagem no bucket
    await file.save(buffer, {
      metadata: { contentType: funnelImage.type },
    });

    // Gera URL assinada para que o Webhook possa ler a imagem
    const [imageUrl] = await file.getSignedUrl({
      action: 'read',
      expires: '03-01-2500',
    });

    // 2. Chamada ao Webhook do n8n/Produção
    const webhookUrl = 'https://unreleasible-pocked-azucena.ngrok-free.dev/webhook/asafood';
    
    // Prepara os dados para o webhook (multipart/form-data)
    const webhookFormData = new FormData();
    Object.entries(validatedFields.data).forEach(([key, value]) => {
      if (key !== 'funnelImage') webhookFormData.append(key, String(value));
    });
    // Adiciona o arquivo original e a URL de acesso direto
    webhookFormData.append('funnelImage', funnelImage);
    webhookFormData.append('imageUrl', imageUrl);

    const response = await fetch(webhookUrl, {
        method: 'POST',
        body: webhookFormData,
        headers: {
          'ngrok-skip-browser-warning': 'true', // Pula tela de aviso do ngrok se necessário
        }
    });

    if (!response.ok) {
        throw new Error(`Erro na conexão com o serviço de análise (${response.status})`);
    }
    
    const rawResultData = await response.json();
    const result = processWebhookData(rawResultData);

    // 3. Persistência dos resultados no Firestore com controle de cota
    if (!result.error) {
      const userRef = adminDb.collection('users').doc(uid);
      
      await adminDb.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) throw new Error("Usuário não encontrado.");

        const currentUsage = userDoc.data()?.usage?.reportsThisCycle || 0;
        
        // Salva o relatório na subcoleção do usuário
        const reportRef = userRef.collection('diagnosisReports').doc();
        transaction.set(reportRef, {
          ...result,
          userId: uid,
          storagePath: fileName,
          imageUrl: imageUrl,
          createdAt: FieldValue.serverTimestamp(),
        });

        // Atualiza contador de uso global do usuário
        transaction.update(userRef, {
          'usage.reportsThisCycle': currentUsage + 1,
          'updatedAt': FieldValue.serverTimestamp(),
        });
      });
    }

    return result;

  } catch (e: any) {
    console.error("Erro em generateDiagnosis:", e);
    return { 
      error: e.message || "Ocorreu um erro interno ao processar sua imagem.", 
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

/**
 * Normaliza os dados vindos do webhook para o formato esperado pelo Dashboard.
 */
function processWebhookData(jsonResponse: any[]): FormState {
    const data = jsonResponse[0] || {};
    const htmlReport = data.Relatório || "";
    const output = data.output || {};

    // Extração do status geral via regex simples para o cabeçalho
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
