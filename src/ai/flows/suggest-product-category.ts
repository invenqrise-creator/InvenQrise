'use server';

/**
 * @fileOverview Suggests the most relevant product category for a new product based on its description.
 *
 * - suggestProductCategory - A function that suggests the most relevant product category for a given product description.
 * - SuggestProductCategoryInput - The input type for the suggestProductCategory function.
 * - SuggestProductCategoryOutput - The return type for the suggestProductCategory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestProductCategoryInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  productDescription: z.string().describe('A detailed description of the product, including its features and benefits.'),
  existingCategories: z.array(z.string()).describe('A list of existing product categories.'),
});
export type SuggestProductCategoryInput = z.infer<typeof SuggestProductCategoryInputSchema>;

const SuggestProductCategoryOutputSchema = z.object({
  suggestedCategory: z.string().describe('The most relevant product category for the given product.'),
  reasoning: z.string().describe('The reasoning behind the category suggestion, based on customer insights.'),
});
export type SuggestProductCategoryOutput = z.infer<typeof SuggestProductCategoryOutputSchema>;

export async function suggestProductCategory(input: SuggestProductCategoryInput): Promise<SuggestProductCategoryOutput> {
  return suggestProductCategoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestProductCategoryPrompt',
  input: {schema: SuggestProductCategoryInputSchema},
  output: {schema: SuggestProductCategoryOutputSchema},
  prompt: `You are an AI assistant helping inventory managers categorize new products in a supermarket.
  Given the product name and description, and a list of existing categories, suggest the most relevant category for the product.
  Also, provide a brief reasoning for your suggestion, based on customer insights and preferences.

  Product Name: {{{productName}}}
  Product Description: {{{productDescription}}}
  Existing Categories: {{#each existingCategories}}{{{this}}}, {{/each}}

  Your suggested category should be one of the existing categories provided.
  Format your output as a JSON object with "suggestedCategory" and "reasoning" fields.
  `,
});

const suggestProductCategoryFlow = ai.defineFlow(
  {
    name: 'suggestProductCategoryFlow',
    inputSchema: SuggestProductCategoryInputSchema,
    outputSchema: SuggestProductCategoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
