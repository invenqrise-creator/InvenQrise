'use server';

/**
 * @fileOverview Sends a low stock warning email for a specific product.
 *
 * - sendLowStockEmail - A function that sends a low stock notification.
 * - SendLowStockEmailInput - The input type for the function.
 * - SendLowStockEmailOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { Resend } from 'resend';

const SendLowStockEmailInputSchema = z.object({
  productName: z.string().describe("The name of the product that is low on stock."),
  currentStock: z.number().describe("The current total stock level of the product."),
  storeId: z.string().describe("The store where the product is located."),
  recipientEmail: z.string().email().describe("The email address to send the warning to."),
});
export type SendLowStockEmailInput = z.infer<typeof SendLowStockEmailInputSchema>;

const SendLowStockEmailOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type SendLowStockEmailOutput = z.infer<typeof SendLowStockEmailOutputSchema>;


export async function sendLowStockEmail(input: SendLowStockEmailInput): Promise<SendLowStockEmailOutput> {
  return sendLowStockEmailFlow(input);
}

const sendLowStockEmailFlow = ai.defineFlow(
  {
    name: 'sendLowStockEmailFlow',
    inputSchema: SendLowStockEmailInputSchema,
    outputSchema: SendLowStockEmailOutputSchema,
  },
  async (input) => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    
    try {
      const { data, error } = await resend.emails.send({
        from: `InvenQrise Alerts <${fromEmail}>`,
        to: [input.recipientEmail],
        subject: `Low Stock Warning: ${input.productName}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2 style="color: #d9534f;">Low Stock Warning</h2>
            <p>This is an automated alert to inform you that a product is running low on stock.</p>
            <ul>
              <li><strong>Product:</strong> ${input.productName}</li>
              <li><strong>Store:</strong> ${input.storeId}</li>
              <li><strong>Remaining Stock:</strong> ${input.currentStock}</li>
            </ul>
            <p>Please consider reordering soon to avoid a stockout.</p>
            <p>Thank you,<br/>InvenQrise System</p>
          </div>
        `,
      });

      if (error) {
        console.error('Resend API Error (Low Stock Email):', error);
        return {
            success: false,
            message: `Failed to send low stock email: ${error.message}`,
        };
      }

      return {
        success: true,
        message: `Low stock email sent successfully for ${input.productName}.`,
      };
    } catch (e: any) {
      console.error('Resend API Error (Low Stock Email):', e);
      return {
        success: false,
        message: `Failed to send low stock email: ${e.message}`,
      };
    }
  }
);
