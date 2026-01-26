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
  aiGeneratedPlan: string | null;
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

    const resultData: FormState = await response.json();
    
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
