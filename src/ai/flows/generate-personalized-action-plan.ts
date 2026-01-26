// src/ai/flows/generate-personalized-action-plan.ts
'use server';
/**
 * @fileOverview Generates a personalized action plan for restaurant owners based on their iFood performance data.
 *
 * - generatePersonalizedActionPlan - A function that generates the personalized action plan.
 * - PersonalizedActionPlanInput - The input type for the generatePersonalizedActionPlan function.
 * - PersonalizedActionPlanOutput - The return type for the generatePersonalizedActionPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedActionPlanInputSchema = z.object({
  restaurantName: z.string().describe('The name of the restaurant.'),
  foodCategory: z.string().describe('The category of food the restaurant serves (e.g., Hamburgers, Sushi).'),
  deliveryType: z.enum(['propria', 'ifood']).describe('The type of delivery service used: propria (own delivery) or ifood (iFood delivery).'),
  currentMonthRevenue: z.number().describe('The gross revenue for the current month.'),
  currentMonthDiscounts: z.number().describe('The total discounts given in the current month.'),
  previousMonthRevenue: z.number().describe('The gross revenue for the previous month.'),
  previousMonthDiscounts: z.number().describe('The total discounts given in the previous month.'),
  funnelImage: z
    .string()
    .describe(
      "A screenshot of the sales funnel data from iFood's partner portal, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  topProductImage: z
    .string()
    .describe(
      "A photo of the restaurant's best-selling product, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});

export type PersonalizedActionPlanInput = z.infer<typeof PersonalizedActionPlanInputSchema>;

const PersonalizedActionPlanOutputSchema = z.object({
  actionPlan: z.string().describe('A personalized action plan with actionable steps to improve the restaurant performance.'),
});

export type PersonalizedActionPlanOutput = z.infer<typeof PersonalizedActionPlanOutputSchema>;

export async function generatePersonalizedActionPlan(
  input: PersonalizedActionPlanInput
): Promise<PersonalizedActionPlanOutput> {
  return generatePersonalizedActionPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedActionPlanPrompt',
  input: {schema: PersonalizedActionPlanInputSchema},
  output: {schema: PersonalizedActionPlanOutputSchema},
  prompt: `You are an expert restaurant consultant specializing in iFood performance optimization.

  Based on the provided restaurant data, create a personalized action plan with specific, actionable steps to improve the restaurant's performance.

  Restaurant Name: {{{restaurantName}}}
  Food Category: {{{foodCategory}}}
  Delivery Type: {{{deliveryType}}}
  Current Month Revenue: {{{currentMonthRevenue}}}
  Current Month Discounts: {{{currentMonthDiscounts}}}
  Previous Month Revenue: {{{previousMonthRevenue}}}
  Previous Month Discounts: {{{previousMonthDiscounts}}}
  Funnel Image: {{media url=funnelImage}}
  Top Product Image: {{media url=topProductImage}}
  `,
});

const generatePersonalizedActionPlanFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedActionPlanFlow',
    inputSchema: PersonalizedActionPlanInputSchema,
    outputSchema: PersonalizedActionPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
