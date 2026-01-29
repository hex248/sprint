import { render } from "@react-email/render";
import type React from "react";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || "Sprint <noreply@sprint.app>";

export interface SendEmailOptions {
    to: string;
    subject: string;
    template: React.ReactElement;
    from?: string;
}

export async function sendEmail({ to, subject, template, from }: SendEmailOptions) {
    const html = await render(template);

    const { data, error } = await resend.emails.send({
        from: from || FROM_EMAIL,
        to,
        subject,
        html,
    });

    if (error) {
        console.error("Failed to send email:", error);
        throw new Error(`Email send failed: ${error.message}`);
    }

    return data;
}

export async function sendEmailWithRetry(
    options: SendEmailOptions,
    maxRetries = 3,
): Promise<ReturnType<typeof sendEmail>> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await sendEmail(options);
        } catch (error) {
            lastError = error as Error;
            console.warn(`Email send attempt ${attempt} failed:`, error);

            if (attempt < maxRetries) {
                await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** (attempt - 1)));
            }
        }
    }

    throw lastError || new Error("Email send failed after all retries");
}
