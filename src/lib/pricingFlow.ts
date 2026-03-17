import { ENDPOINTS } from "./endpoints";
import { authedPost } from "./authedFetch";

/**
 * Executa o cálculo de precificação no novo backend (Cloud Functions).
 * O backend deriva o UID/Tenant do token de autorização.
 */
export async function runPricingCalculation(payload: any) {
  // Chama o endpoint de precificação autenticado
  const response = await authedPost(ENDPOINTS.createPricing, payload);
  
  // Garante que o retorno seja um array para manter compatibilidade com a UI existente
  return Array.isArray(response) ? response : [response];
}