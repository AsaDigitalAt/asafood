import { ENDPOINTS } from "./endpoints";
import { authedPost } from "./authedFetch";
import type { Ingredient } from "@/app/actions/calculate-price";

/**
 * Executa o cálculo de precificação no backend (Cloud Functions).
 * O uid é derivado do token de autorização — não precisa ser enviado no body.
 * Aceita os campos no formato do PriceCalculatorView e mapeia para o backend.
 */
export async function runPricingCalculation(payload: {
  productName: string;
  ingredients: Ingredient[];
  profitMargin: number;
  taxes: number;
  deliveryType: "propria" | "ifood";
}) {
  const backendPayload = {
    nomeProduto: payload.productName,
    insumos: payload.ingredients,
    margemPercentual: payload.profitMargin,
    impostoPercentual: payload.taxes,
    tipoEntrega: payload.deliveryType === "ifood" ? "parceira" : "propria",
  };

  const response = await authedPost(ENDPOINTS.createPricing, backendPayload);

  // O backend retorna { ok, pricingResult, usage }.
  // A UI acessa data[0].output, então mapeamos pricingResult → output.
  const normalized = { output: response.pricingResult };
  return [normalized];
}