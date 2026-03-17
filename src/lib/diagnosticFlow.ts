import { ENDPOINTS } from "./endpoints";
import { authedPost } from "./authedFetch";

/**
 * Orquestra o fluxo completo de diagnóstico chamando as Cloud Functions 2nd Gen.
 * O backend deriva o UID/Tenant do token de autorização.
 */
export async function runFullDiagnostic(input: {
  restaurantName: string;
  foodCategory: string;
  deliveryType: string;
  currentMonthRevenue: number;
  currentMonthDiscounts: number;
  previousMonthRevenue: number;
  previousMonthDiscounts: number;
  email: string;
  storagePath: string;
  imageContentType: string;
  imageOriginalName: string;
}) {
  // 1. Criar o documento do diagnóstico (Status: queued)
  const createResponse = await authedPost(ENDPOINTS.createDiagnostic, {
    restaurantName: input.restaurantName,
    nicho: input.foodCategory,
    tipoEntrega: input.deliveryType,
    fatAtual: input.currentMonthRevenue,
    descAtual: input.currentMonthDiscounts,
    fatAnterior: input.previousMonthRevenue,
    descAnterior: input.previousMonthDiscounts,
    email: input.email,
    image: {
      storagePath: input.storagePath,
      contentType: input.imageContentType,
      originalName: input.imageOriginalName,
    },
  });

  const diagnosticId = createResponse.diagnosticId;
  if (!diagnosticId) throw new Error("Falha ao iniciar diagnóstico: ID não retornado.");

  // 2. Processar a imagem (OCR / Extração de Métricas)
  await authedPost(ENDPOINTS.processDiagnostic, { diagnosticId });

  // 3. Gerar o Plano de Ação (IA)
  const finalResponse = await authedPost(ENDPOINTS.generatePlan, { diagnosticId });

  // O backend retorna o objeto 'final' consolidado
  return finalResponse;
}
