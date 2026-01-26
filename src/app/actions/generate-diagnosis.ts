'use server';

import { generatePersonalizedActionPlan } from '@/ai/flows/generate-personalized-action-plan';
import { z } from 'zod';

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

const fileToDataURI = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return `data:${file.type};base64,${buffer.toString('base64')}`;
};

export async function generateDiagnosis(formData: FormData): Promise<FormState> {
  const rawFormData = Object.fromEntries(formData.entries());

  const validatedFields = diagnosisSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      error: 'Formulário inválido. Verifique os campos e tente novamente.',
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

    // Call the AI flow as required
    const aiResult = await generatePersonalizedActionPlan({
      restaurantName,
      foodCategory,
      deliveryType,
      currentMonthRevenue,
      currentMonthDiscounts,
      previousMonthRevenue,
      previousMonthDiscounts,
      funnelImage: funnelImageURI,
      topProductImage: productImageURI,
    });
    
    // To build the rich UI from the user's proposal, we use the mock data structure.
    // In a real application, the AI flow would be updated to return this structured JSON.
    const mockData = {
        nome: restaurantName || "Seu Restaurante",
        statusGeral: "ATENÇÃO",
        conversions: {
            view: { percentual: 60.13, referencia_minima: 65, status: "bom", comentario: "Sua taxa de visualização de itens está saudável, indicando que os visitantes iniciais estão curiosos." },
            cart: { percentual: 18.29, referencia_minima: 20, status: "atencao", comentario: "Um pouco abaixo da meta. Pode haver um problema de preço, fotos ou descrição nos seus itens." },
            review: { percentual: 17.46, referencia_minima: 17, status: "bom", comentario: "Os clientes estão avançando para a revisão, o que mostra um bom fluxo inicial no carrinho." },
            done: { percentual: 8.35, referencia_minima: 10, status: "atencao", comentario: "Sua taxa de conversão final está abaixo do ideal. Clientes estão desistindo na última etapa." }
        },
        discounts: {
            mes_atual: { percentual_descontos: currentMonthRevenue > 0 ? Math.round((currentMonthDiscounts / currentMonthRevenue) * 100) : 0, classificacao: "RISCO" },
            mes_anterior: { percentual_descontos: previousMonthRevenue > 0 ? Math.round((previousMonthDiscounts / previousMonthRevenue) * 100) : 0, classificacao: "IDEAL" },
            comparativo: { tendencia: "piora", analise: "Houve um aumento forte na dependência de descontos este mês, o que pode estar corroendo sua margem de lucro." }
        },
        problems: [
            { etapa: "Conversão Final", descricao: "A perda de clientes entre a revisão do pedido e a conclusão é o ponto mais crítico do seu funil. Isso geralmente está ligado a frete caro, tempo de entrega longo ou falta de opções de pagamento.", impacto: "alto" },
            { etapa: "Dependência de Descontos", descricao: "Seu restaurante está usando uma porcentagem de descontos perigosa em relação ao faturamento, indicando uma possível 'compra' de clientes que não são leais à marca.", impacto: "médio" }
        ],
        actions: [
            { descricao: "Revise e otimize as fotos de todos os itens do cardápio para torná-las mais profissionais e apetitosas.", categoria: "fotos", prioridade: 1 },
            { descricao: "Crie combos inteligentes com 2-3 produtos que façam sentido juntos, oferecendo um pequeno desconto no combo em vez de cupons gerais.", categoria: "cardapio", prioridade: 1 },
            { descricao: "Analise a competitividade da sua taxa de entrega. Se for entrega própria, considere oferecer frete grátis acima de um valor mínimo de pedido.", categoria: "logistica", prioridade: 2 },
            { descricao: "Verifique todos os meios de pagamento ativados no iFood. Oferecer mais opções como PIX, VR e Sodexo pode aumentar a conversão.", categoria: "pagamento", prioridade: 3 },
            { descricao: "Inicie uma campanha de 'Prato do Dia' com um item de alta margem e preço atrativo para aumentar o tráfego e vendas.", categoria: "marketing", prioridade: 2 },
        ],
        prioridades: [
            "Reduzir cupons de desconto agressivos e focar em promoções de item.",
            "Otimizar cardápio e fotos para aumentar a conversão para a sacola.",
            "Ajustar opções de frete e meios de pagamento para reduzir o abandono de carrinho."
        ],
        aiGeneratedPlan: aiResult.actionPlan, // Include the actual AI output
    };
    
    return mockData;

  } catch (e) {
    console.error(e);
    return {
      error: 'Ocorreu um erro ao contatar a IA. Tente novamente mais tarde.',
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
