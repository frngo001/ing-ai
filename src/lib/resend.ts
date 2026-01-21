import { Resend } from 'resend';
import { devLog, devError } from '@/lib/utils/logger';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailProps {
    to: string;
    subject: string;
    react: React.ReactElement;
}

export async function sendEmail({ to, subject, react }: SendEmailProps) {
    if (!process.env.RESEND_API_KEY) {
        devError('[RESEND] Missing RESEND_API_KEY');
        return { success: false, error: 'Missing API key' };
    }

    try {
        devLog(`[RESEND] Sending email to ${to} with subject: "${subject}"`);

        const { data, error } = await resend.emails.send({
            from: 'Ing AI <no-reply@ingai-editor.xyz>',
            to,
            subject,
            react,
        });

        if (error) {
            devError('[RESEND] Error sending email:', error);
            return { success: false, error };
        }

        devLog('[RESEND] Email sent successfully:', data);
        return { success: true, data };
    } catch (error) {
        devError('[RESEND] Unexpected error:', error);
        return { success: false, error };
    }
}
