
'use server';

import { z } from 'zod';
import { adminDb } from '@/lib/firebase-admin';
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
    return { error: "Campos inválidos", nome: '', statusGeral: '', conversions: {}, discounts: {}, problems: [], actions: [], priorities: [], aiGeneratedPlan: null };
  }

  const { uid, funnelImage, restaurantName } = validatedFields.data;

  try {
    // 1. Upload da Imagem para o Storage
    const storage = getStorage().bucket();
    const buffer = Buffer.from(await funnelImage.arrayBuffer());
    const fileName = `diagnostics/${uid}/${Date.now()}-${funnelImage.name}`;
    const file = storage.file(fileName);

    await file.save(buffer, {
      metadata: { contentType: funnelImage.type },
    });

    // Torna o arquivo acessível (opcional, dependendo de como o webhook lê)
    const [imageUrl] = await file.getSignedUrl({
      action: 'read',
      expires: '03-01-2500',
    });

    // 2. Chamada ao Webhook (Mantendo a estrutura de comunicação externa)
    const webhookUrl = 'https://unreleasible-pocked-azucena.ngrok-free.dev/webhook/asafood';
    const webhookFormData = new FormData();
    Object.entries(validatedFields.data).forEach(([key, value]) => {
      if (key !== 'funnelImage') webhookFormData.append(key, String(value));
    });
    webhookFormData.append('funnelImage', funnelImage); // Envia o arquivo original
    webhookFormData.append('imageUrl', imageUrl);      // Envia também a URL do Storage

    const response = await fetch(webhookUrl, {
        method: 'POST',
        body: webhookFormData,
    });

    if (!response.ok) throw new Error(`Webhook Error: ${response.status}`);
    
    const rawResultData = await response.json();
    const result = processWebhookData(rawResultData);

    // 3. Persistência no Firestore
    if (!result.error) {
      const userRef = adminDb.collection('users').doc(uid);
      
      await adminDb.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) throw new Error("Usuário não encontrado.");

        const currentUsage = userDoc.data()?.usage?.reportsThisCycle || 0;
        
        // Salva o relatório
        const reportRef = userRef.collection('diagnosisReports').doc();
        transaction.set(reportRef, {
          ...result,
          userId: uid,
          storagePath: fileName,
          imageUrl: imageUrl,
          createdAt: FieldValue.serverTimestamp(),
        });

        // Incrementa uso
        transaction.update(userRef, {
          'usage.reportsThisCycle': currentUsage + 1,
          'updatedAt': FieldValue.serverTimestamp(),
        });
      });
    }

    return result;

  } catch (e: any) {
    console.error("Erro em generateDiagnosis:", e);
    return { error: e.message, nome: '', statusGeral: '', conversions: {}, discounts: {}, problems: [], actions: [], priorities: [], aiGeneratedPlan: null };
  }
}

function processWebhookData(jsonResponse: any[]): FormState {
    const data = jsonResponse[0] || {};
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
