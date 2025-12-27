'use server';

/**
 * @fileOverview Generates and sends a One-Time Password (OTP) for 2FA.
 *
 * - sendOtpEmail - A function that generates an OTP and emails it to a user.
 * - SendOtpEmailInput - The input type for the function.
 * - SendOtpEmailOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { Resend } from 'resend';

const SendOtpEmailInputSchema = z.object({
  email: z.string().email().describe("The user's email address."),
  name: z.string().describe("The user's name."),
});
export type SendOtpEmailInput = z.infer<typeof SendOtpEmailInputSchema>;

const SendOtpEmailOutputSchema = z.object({
  success: z.boolean(),
  otp: z.string().describe("The 6-digit OTP code that was sent."),
  message: z.string().optional(),
});
export type SendOtpEmailOutput = z.infer<typeof SendOtpEmailOutputSchema>;


export async function sendOtpEmail(input: SendOtpEmailInput): Promise<SendOtpEmailOutput> {
  return sendOtpEmailFlow(input);
}

const sendOtpEmailFlow = ai.defineFlow(
  {
    name: 'sendOtpEmailFlow',
    inputSchema: SendOtpEmailInputSchema,
    outputSchema: SendOtpEmailOutputSchema,
  },
  async (input) => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'pratikk5143772@gmail.com';
    
    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      const { data, error } = await resend.emails.send({
        from: `InvenQrise Security <${fromEmail}>`,
        to: [input.email],
        subject: 'Your InvenQrise Verification Code',
        html: `
          <div style="font-family: sans-serif; text-align: center; padding: 20px;">
            <h2>Hi ${input.name},</h2>
            <p>Your One-Time Password (OTP) for InvenQrise is:</p>
            <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px; border: 1px solid #ccc; padding: 10px; display: inline-block;">${otp}</p>
            <p>This code will expire in 10 minutes. If you did not request this, please secure your account.</p>
          </div>
        `,
      });

      if (error) {
        console.error('Resend API Error (OTP):', error);
        return {
            success: false,
            otp: '',
            message: `Failed to send OTP email: ${error.message}`,
        };
      }

      return {
        success: true,
        otp: otp, // In a real app, you'd hash this or handle it more securely
      };
    } catch (e: any) {
      console.error('Resend API Error:', e);
      return {
        success: false,
        otp: '',
        message: `Failed to send OTP email: ${e.message}`,
      };
    }
  }
);
