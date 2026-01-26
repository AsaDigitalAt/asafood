'use server';

import { z } from 'zod';

// This is FormState. It's used as return type, and also for DashboardView props.
// The webhook must return this structure.
export type FormState = {
  nome: string;
  statusGeral: string;
  conversions: any;
  discounts: any;
  problems: any[];
  actions: any[];
  priorities: string[];
  aiGeneratedPlan: string | null; // Kept for compatibility, but populated by webhook logic
  error?: string;
};

const diagnosisSchema = z.object({
  restaurantName: z.string().min(1, 'O nome do restaurante é obrigatório.'),
  foodCategory: z.string().min(1, 'O nicho de comida é obrigatório.'),
  deliveryType: z.enum(['propria', 'ifood']),
  currentMonthRevenue: z.coerce.number(),
  currentMonthDiscounts: z.coerce.number(),
  previousMonthRevenue: z.coerce.number(),
  previousMonthDiscounts: z.coerce.number(),
  funnelImage: z.instanceof(File),
  productImage: z.instanceof(File),
});

const fileToDataURI = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return `data:${file.type};base64,${buffer.toString('base64')}`;
};

function processWebhookData(jsonResponse: any[]): FormState {
    const data = jsonResponse[0] || {};
    const htmlReport = data.Relatório || "";
    const output = data.output || {};

    const statusGeralMatch = htmlReport.match(/Status geral do funil:<\/b>\s*([^<]+)/i);
    const statusGeral = statusGeralMatch ? statusGeralMatch[1].trim() : "Em Análise";

    const conversoes = output.conversoes || {};
    const analiseDescontos = output.analise_descontos || {};
    const problemas = output.principais_problemas || [];
    const acoes = output.acoes_imediatas || [];
    const prioridades = output.prioridades_hoje || [];
    const aiGeneratedPlan = output.plano_de_acao_ia || null;

    return {
        nome: data.Nome || "Restaurante",
        statusGeral: statusGeral,
        conversions: {
            view: conversoes.visitas_para_visualizacoes || { percentual: 0, status: 'neutro', comentario: '' },
            cart: conversoes.visitas_para_sacola || { percentual: 0, status: 'neutro', comentario: '' },
            review: conversoes.visitas_para_revisao || { percentual: 0, status: 'neutro', comentario: '' },
            done: conversoes.visitas_para_concluidos || { percentual: 0, status: 'neutro', comentario: '' }
        },
        discounts: analiseDescontos,
        problems: problemas.filter((p: any) => p !== null),
        actions: acoes.filter((a: any) => a !== null),
        priorities: prioridades,
        aiGeneratedPlan: aiGeneratedPlan,
        error: data.error
    };
}


export async function generateDiagnosis(formData: FormData): Promise<FormState> {
  const rawFormData = Object.fromEntries(formData.entries());

  const validatedFields = diagnosisSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.issues.map(issue => issue.message).join(', ');
    return {
      error: `Formulário inválido: ${errorMessages}`,
      nome: '',
      statusGeral: '',
      conversions: {},
      discounts: {},
      problems: [],
      actions: [],
      priorities: [],
      aiGeneratedPlan: null,
    };
  }

  const {
    restaurantName,
    foodCategory,
    deliveryType,
    currentMonthRevenue,
    currentMonthDiscounts,
    previousMonthRevenue,
    previousMonthDiscounts,
    funnelImage,
    productImage,
  } = validatedFields.data;

  try {
    const funnelImageURI = await fileToDataURI(funnelImage);
    const productImageURI = await fileToDataURI(productImage);

    const webhookPayload = {
      restaurantName,
      foodCategory,
      deliveryType,
      currentMonthRevenue,
      currentMonthDiscounts,
      previousMonthRevenue,
      previousMonthDiscounts,
      funnelImage: funnelImageURI,
      productImage: productImageURI,
    };

    const webhookUrl = 'https://unreleasible-pocked-azucena.ngrok-free.dev/webhook/asafood';

    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Webhook error:', errorText);
        throw new Error(`Ocorreu um erro ao comunicar com o webhook: ${response.statusText}`);
    }

    const rawResultData = await response.json();
    const resultData = processWebhookData(rawResultData);
    
    return resultData;

  } catch (e: any) {
    console.error(e);
    return {
      error: e.message || 'Ocorreu um erro ao processar o diagnóstico. Tente novamente mais tarde.',
      nome: '',
      statusGeral: '',
      conversions: {},
      discounts: {},
      problems: [],
      actions: [],
      priorities: [],
      aiGeneratedPlan: null,
    };
  }
}
