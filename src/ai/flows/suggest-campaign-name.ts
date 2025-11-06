'use server';

/**
 * @fileOverview Suggests a marketing campaign name.
 *
 * - suggestCampaignName - A function that suggests a campaign name.
 * - SuggestCampaignNameInput - The input type for the suggestCampaignName function.
 * - SuggestCampaignNameOutput - The return type for the suggestCampaignName function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestCampaignNameInputSchema = z.object({
  category: z.string().describe('The product category for the campaign.'),
  products: z.array(z.string()).describe('A list of product names included in the campaign.'),
});
export type SuggestCampaignNameInput = z.infer<typeof SuggestCampaignNameInputSchema>;

const SuggestCampaignNameOutputSchema = z.object({
  campaignName: z.string().describe('A creative and catchy name for the marketing campaign.'),
  reasoning: z.string().describe('A brief explanation of why the name is a good fit.'),
});
export type SuggestCampaignNameOutput = z.infer<typeof SuggestCampaignNameOutputSchema>;

export async function suggestCampaignName(input: SuggestCampaignNameInput): Promise<SuggestCampaignNameOutput> {
  return suggestCampaignNameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCampaignNamePrompt',
  input: {schema: SuggestCampaignNameInputSchema},
  output: {schema: SuggestCampaignNameOutputSchema},
  prompt: `You are an expert marketing assistant for a supermarket. Your task is to generate a creative and catchy campaign name.

  The campaign is for the "{{category}}" category and includes the following products:
  {{#each products}}
  - {{{this}}}
  {{/each}}

  Generate a short, memorable campaign name that is relevant to the products and category. Also, provide a brief reasoning for your suggestion.
  `,
});

const suggestCampaignNameFlow = ai.defineFlow(
  {
    name: 'suggestCampaignNameFlow',
    inputSchema: SuggestCampaignNameInputSchema,
    outputSchema: SuggestCampaignNameOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
