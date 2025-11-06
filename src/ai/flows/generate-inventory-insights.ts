
'use server';

/**
 * @fileOverview Generates predictive inventory analysis based on sales and stock data.
 *
 * - generateInventoryInsights - A function that creates inventory suggestions.
 */

import { ai } from '@/ai/genkit';
import { GenerateInventoryInsightsInputSchema, GenerateInventoryInsightsOutputSchema, GenerateInventoryInsightsInput, GenerateInventoryInsightsOutput } from './generate-inventory-insights.types';


export async function generateInventoryInsights(input: GenerateInventoryInsightsInput): Promise<GenerateInventoryInsightsOutput> {
  return generateInventoryInsightsFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateInventoryInsightsPrompt',
  input: { schema: GenerateInventoryInsightsInputSchema },
  output: { schema: GenerateInventoryInsightsOutputSchema },
  prompt: `You are a supermarket inventory analyst. Your goal is to provide actionable insights based on the provided data.

Analyze the last 30 days of sales data and the current product stock levels.

Sales Data:
{{{salesData}}}

Current Product Stock:
{{{productsData}}}

Based on this data, perform the following tasks:
1.  **Identify Best and Worst Sellers**: Calculate the total units sold for each product over the last 30 days. List the top 5 best-selling and top 5 worst-selling products.
2.  **Generate Purchase Suggestions**: For the top 10 best-selling products, analyze their sales velocity vs. current stock.
    -   'currentStock' is the sum of front-of-house and back-of-house stock.
    -   'predictedSales' for the next 30 days can be estimated as last month's sales volume.
    -   'suggestedPurchaseQuantity' should be calculated to ensure there is enough stock for the next 30 days plus a 25% safety buffer, rounded up to the nearest whole number. The formula is: (predictedSales * 1.25) - currentStock. Only suggest a purchase if the calculated quantity is greater than 0.
3.  **Provide a Summary**: Write a brief, high-level summary of the situation. Mention the top-performing category and suggest a potential action for the worst-sellers (e.g., consider a discount campaign).

Return your analysis in the specified JSON format.
`,
});

const generateInventoryInsightsFlow = ai.defineFlow(
  {
    name: 'generateInventoryInsightsFlow',
    inputSchema: GenerateInventoryInsightsInputSchema,
    outputSchema: GenerateInventoryInsightsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
