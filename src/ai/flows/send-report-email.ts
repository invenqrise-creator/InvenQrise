
'use server';

/**
 * @fileOverview Prepares a sales report and sends it via email using Resend.
 *
 * - sendReportEmail - A function that handles preparing and sending the email.
 * - SendReportEmailInput - The input type for the function.
 * - SendReportEmailOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Resend } from 'resend';
import {format} from 'date-fns';

const SendReportEmailInputSchema = z.object({
  recipientEmail: z.string().email().describe("The email address to send the report to."),
  salesData: z.array(z.any()).describe("The array of sales data objects."),
  dateRange: z.object({
    from: z.string().describe("The start date of the report."),
    to: z.string().describe("The end date of the report."),
  }).describe("The date range for the sales report."),
});
export type SendReportEmailInput = z.infer<typeof SendReportEmailInputSchema>;

const SendReportEmailOutputSchema = z.object({
  success: z.boolean().describe("Whether the email was sent successfully."),
  message: z.string().describe("A message indicating the result of the operation."),
});
export type SendReportEmailOutput = z.infer<typeof SendReportEmailOutputSchema>;


export async function sendReportEmail(input: SendReportEmailInput): Promise<SendReportEmailOutput> {
  return sendReportEmailFlow(input);
}

const sendReportEmailFlow = ai.defineFlow(
  {
    name: 'sendReportEmailFlow',
    inputSchema: SendReportEmailInputSchema,
    outputSchema: SendReportEmailOutputSchema,
  },
  async (input) => {
    
    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    try {
        // 1. Generate CSV content from sales data
        const headers = ["SaleID", "Date", "CustomerName", "CustomerEmail", "Store", "TotalAmount", "Items"];
        const csvRows = [headers.join(",")];
        for (const sale of input.salesData) {
            const values = [
                sale.id,
                format(new Date(sale.date), "yyyy-MM-dd HH:mm:ss"),
                `"${sale.customer.name}"`,
                sale.customer.email,
                sale.storeId || "N/A",
                sale.amount,
                `"${sale.items.map((i: any) => `${i.quantity}x ${i.name}`).join("; ")}"`
            ].join(',');
            csvRows.push(values);
        }
        const csvContent = csvRows.join("\n");
        const csvBuffer = Buffer.from(csvContent, 'utf-8');

        // 2. Send email with Resend
        const { data, error } = await resend.emails.send({
            from: `InvenQrise Reports <${fromEmail}>`, // Use the configured from email
            to: [input.recipientEmail],
            subject: `Your Sales Report: ${input.dateRange.from} to ${input.dateRange.to}`,
            html: `
                <h1>InvenQrise Sales Report</h1>
                <p>Hi there,</p>
                <p>Attached is the sales report you requested for the period of <strong>${input.dateRange.from}</strong> to <strong>${input.dateRange.to}</strong>.</p>
                <p>Number of sales records: ${input.salesData.length}</p>
                <p>Thank you for using InvenQrise.</p>
            `,
            attachments: [
                {
                    filename: `sales-report-${input.dateRange.from}-to-${input.dateRange.to}.csv`,
                    content: csvBuffer,
                }
            ]
        });

        if (error) {
            console.error("Resend API Error:", error);
            // Return the specific error from Resend to the user
            return {
                success: false,
                message: `Failed to send email: ${error.message}`,
            };
        }

        return {
            success: true,
            message: `An email report has been successfully sent to ${input.recipientEmail}.`,
        };

    } catch (e: any) {
        console.error("Error in sendReportEmailFlow: ", e);
        return {
            success: false,
            message: `An unexpected error occurred: ${e.message}`,
        }
    }
  }
);
