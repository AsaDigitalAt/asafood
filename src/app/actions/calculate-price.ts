'use server';

/**
 * @fileOverview Mantém as definições de tipo para compatibilidade.
 * A lógica de execução foi movida para o cliente (pricingFlow) seguindo a nova arquitetura.
 */

// Shared type for an ingredient
export interface Ingredient {
  id: number;
  name: string;
  totalCost: number;
  totalWeight: number;
  plateWeight: number;
}

// Type for the data sent to the webhook
export interface CalculationPayload {
  productName: string;
  ingredients: Ingredient[];
  profitMargin: number;
  taxes: number;
  deliveryType: 'propria' | 'ifood';
}

// Type for the data returned by the webhook on success
export interface CalculationResult {
    [key: string]: any;
}

// Type for the state returned by the server action
export type PriceCalculationState = {
  data: CalculationResult[] | null;
  error: string | null;
};

// Esta função foi desativada em favor da nova arquitetura de pricingFlow autenticada no cliente.
export async function calculateNewPrice(payload: CalculationPayload): Promise<PriceCalculationState> {
  return {
      data: null,
      error: "Este endpoint foi desativado em favor da nova arquitetura de pricingFlow autenticada."
  };
}