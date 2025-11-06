'use server';

/**
 * @fileOverview Prepares a customer bill and sends it via email using Resend.
 *
 * - sendBillingEmail - A function that handles preparing and sending the billing email.
 * - SendBillingEmailInput - The input type for the function.
 * - SendBillingEmailOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { Resend } from 'resend';
import {format} from 'date-fns';

const SaleItemSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  price: z.number(),
});

const SendBillingEmailInputSchema = z.object({
  recipientEmail: z.string().email().describe("The customer's email address."),
  recipientName: z.string().describe("The customer's name."),
  saleId: z.string().describe("The unique ID of the sale."),
  saleDate: z.string().describe("The ISO 8601 date of the sale."),
  items: z.array(SaleItemSchema).describe("The items included in the sale."),
  totalAmount: z.number().describe("The total amount of the sale."),
  storeId: z.string().describe("The store where the sale occurred."),
});
export type SendBillingEmailInput = z.infer<typeof SendBillingEmailInputSchema>;

const SendBillingEmailOutputSchema = z.object({
  success: z.boolean().describe("Whether the email was sent successfully."),
  message: z.string().describe("A message indicating the result of the operation."),
});
export type SendBillingEmailOutput = z.infer<typeof SendBillingEmailOutputSchema>;


export async function sendBillingEmail(input: SendBillingEmailInput): Promise<SendBillingEmailOutput> {
  return sendBillingEmailFlow(input);
}

const sendBillingEmailFlow = ai.defineFlow(
  {
    name: 'sendBillingEmailFlow',
    inputSchema: SendBillingEmailInputSchema,
    outputSchema: SendBillingEmailOutputSchema,
  },
  async (input) => {
    
    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    
    // TEMPORARY FIX for Resend sandbox: Send all emails to a verified address.
    // Replace this with `input.recipientEmail` once a domain is verified.
    const testRecipientEmail = 'invenqrise@gmail.com';


    try {
        const itemsHtml = input.items.map(item => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toFixed(2)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.quantity * item.price).toFixed(2)}</td>
            </tr>
        `).join('');

        const emailHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
                <div style="background-color: #f8d7da; color: #721c24; padding: 10px; border-radius: 5px; margin-bottom: 15px; text-align: center;">
                    <strong>TEST EMAIL:</strong> This email was sent to the admin for testing. The original recipient would have been ${input.recipientEmail}.
                </div>
                <h1 style="color: #333; text-align: center;">Thank you for your purchase!</h1>
                <p>Hi ${input.recipientName},</p>
                <p>Here is your receipt from InvenQrise (${input.storeId}).</p>
                <hr style="border: none; border-top: 1px solid #eee;" />
                <p>
                    <strong>Sale ID:</strong> ${input.saleId}<br>
                    <strong>Date:</strong> ${format(new Date(input.saleDate), "PPP p")}
                </p>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: left;">Item</th>
                            <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: center;">Qty</th>
                            <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: right;">Price</th>
                            <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" style="padding: 10px 8px; text-align: right; font-weight: bold;">Grand Total</td>
                            <td style="padding: 10px 8px; text-align: right; font-weight: bold; border-top: 2px solid #ddd;">₹${input.totalAmount.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
                <p style="text-align: center; margin-top: 20px; font-size: 12px; color: #888;">
                    Powered by InvenQrise - Smart Inventory Management
                </p>
            </div>
        `;


        const { data, error } = await resend.emails.send({
            from: `InvenQrise Billing <${fromEmail}>`,
            to: [testRecipientEmail], // Using the test recipient
            subject: `TEST: Receipt for ${input.recipientName} (Sale #${input.saleId.substring(0,7)})`, // Updated subject
            html: emailHtml,
        });

        if (error) {
            console.error("Resend API Error (Billing):", error);
            return {
                success: false,
                message: `Failed to send billing email: ${error.message}`,
            };
        }

        return {
            success: true,
            message: `A test receipt for ${input.recipientName} has been successfully sent to ${testRecipientEmail}.`,
        };

    } catch (e: any) {
        console.error("Error in sendBillingEmailFlow: ", e);
        return {
            success: false,
            message: `An unexpected error occurred: ${e.message}`,
        }
    }
  }
);
