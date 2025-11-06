
'use server';

/**
 * @fileOverview Generates a sales projection report based on historical data.
 *
 * - generateSalesProjection - A function that creates a sales forecast.
 * - GenerateSalesProjectionInput - The input type for the sales projection function.
 * - GenerateSalesProjectionOutput - The return type for the sales projection function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SaleSchema = z.object({
    date: z.string().describe("The ISO 8601 date of the sale."),
    amount: z.number().describe("The total amount of the sale."),
});

const GenerateSalesProjectionInputSchema = z.object({
  historicalSales: z.array(SaleSchema).describe("An array of past sales records."),
});
export type GenerateSalesProjectionInput = z.infer<typeof GenerateSalesProjectionInputSchema>;

const GenerateSalesProjectionOutputSchema = z.object({
  projectedRevenue: z.number().describe("The total projected revenue for the next 30 days."),
  projectedSalesCount: z.number().describe("The projected number of individual sales for the next 30 days."),
  summary: z.string().describe("A brief, insightful summary of the sales projection, including trends and key factors."),
});
export type GenerateSalesProjectionOutput = z.infer<typeof GenerateSalesProjectionOutputSchema>;

export async function generateSalesProjection(input: GenerateSalesProjectionInput): Promise<GenerateSalesProjectionOutput> {
  return generateSalesProjectionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSalesProjectionPrompt',
  input: {schema: GenerateSalesProjectionInputSchema},
  output: {schema: GenerateSalesProjectionOutputSchema},
  prompt: `You are a data analyst for a supermarket chain. Your task is to generate a sales projection for the next 30 days based on the provided historical sales data.

  Analyze the following historical sales data to identify trends, seasonality, and growth patterns.
  
  Historical Sales Data (JSON format):
  {{{historicalSales}}}

  Based on your analysis, provide a realistic projection for the next 30 days. Your output must be a JSON object containing:
  1.  'projectedRevenue': A numerical forecast of the total revenue.
  2.  'projectedSalesCount': A numerical forecast of the total number of sales transactions.
  3.  'summary': A concise, professional summary explaining the projection. Highlight any notable trends (e.g., "upward trend in weekend sales," "seasonal dip expected," "steady growth observed").
  `,
});


const generateSalesProjectionFlow = ai.defineFlow(
  {
    name: 'generateSalesProjectionFlow',
    inputSchema: GenerateSalesProjectionInputSchema,
    outputSchema: GenerateSalesProjectionOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
