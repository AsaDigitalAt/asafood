'use server';

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
  ingredients: Ingredient[];
  profitMargin: number;
  taxes: number;
}

// Type for the data returned by the webhook on success
export interface CalculationResult {
    totalIngredientCost: number;
    suggestedPrice: number;
}

// Type for the state returned by the server action
export type PriceCalculationState = {
  data: CalculationResult | null;
  error: string | null;
};


export async function calculateNewPrice(payload: CalculationPayload): Promise<PriceCalculationState> {
  const webhookUrl = 'https://unreleasible-pocked-azucena.ngrok-free.dev/webhook-test/preconovo';

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Throwing an error here will be caught by the try/catch block
      throw new Error(`Erro no Webhook (${response.status}): ${errorText || response.statusText}`);
    }

    const data: CalculationResult = await response.json();
    return { data, error: null };

  } catch (error: any) {
    console.error("Erro na Server Action 'calculateNewPrice':", error);
    return {
      data: null,
      error: error.message || "Não foi possível conectar ao serviço de cálculo de preços.",
    };
  }
}
