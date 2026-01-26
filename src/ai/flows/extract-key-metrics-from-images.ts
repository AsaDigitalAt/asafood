// src/ai/flows/extract-key-metrics-from-images.ts
'use server';

/**
 * @fileOverview Extracts key performance metrics from uploaded images of the iFood partner portal.
 *
 * - extractKeyMetricsFromImages - A function that extracts key metrics from images.
 * - ExtractKeyMetricsFromImagesInput - The input type for the extractKeyMetricsFromImages function.
 * - ExtractKeyMetricsFromImagesOutput - The return type for the extractKeyMetricsFromImages function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractKeyMetricsFromImagesInputSchema = z.object({
  funnelImage: z
    .string()
    .describe(
      "A screenshot of the iFood partner portal's sales funnel, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  productImage: z
    .string()
    .describe(
      "A photo of the best-selling product, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractKeyMetricsFromImagesInput = z.infer<typeof ExtractKeyMetricsFromImagesInputSchema>;

const ExtractKeyMetricsFromImagesOutputSchema = z.object({
  visits: z.number().describe('Number of visits to the iFood page.'),
  visualizations: z.number().describe('Number of product visualizations.'),
  orders: z.number().describe('Number of orders placed.'),
  revenue: z.number().describe('Total revenue generated.'),
  productName: z.string().describe('Name of the best-selling product.'),
});
export type ExtractKeyMetricsFromImagesOutput = z.infer<typeof ExtractKeyMetricsFromImagesOutputSchema>;

export async function extractKeyMetricsFromImages(input: ExtractKeyMetricsFromImagesInput): Promise<ExtractKeyMetricsFromImagesOutput> {
  return extractKeyMetricsFromImagesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractKeyMetricsFromImagesPrompt',
  input: {schema: ExtractKeyMetricsFromImagesInputSchema},
  output: {schema: ExtractKeyMetricsFromImagesOutputSchema},
  prompt: `You are an expert in extracting data from images related to iFood partner portals.

You will receive two images:
1.  A screenshot of the sales funnel from the iFood partner portal.
2.  A photo of the restaurant's best-selling product.

Extract the following information from the images:
*   Number of visits to the iFood page
*   Number of product visualizations
*   Number of orders placed
*   Total revenue generated
*   Name of the best-selling product

Sales Funnel Image: {{media url=funnelImage}}
Product Image: {{media url=productImage}}

Output the extracted information in JSON format:
{
  "visits": number,
  "visualizations": number,
  "orders": number,
  "revenue": number,
  "productName": string
}
`,
});

const extractKeyMetricsFromImagesFlow = ai.defineFlow(
  {
    name: 'extractKeyMetricsFromImagesFlow',
    inputSchema: ExtractKeyMetricsFromImagesInputSchema,
    outputSchema: ExtractKeyMetricsFromImagesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
