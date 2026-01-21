'use server';

import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/resend';
import { WelcomeEmail } from '@/components/emails/WelcomeEmail';

export async function sendWelcomeEmailAction(email: string, fullName: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const { success, error } = await sendEmail({
            to: email,
            subject: 'Welcome to Ing AI',
            react: WelcomeEmail({ userName: fullName }),
        });

        if (!success) {
            console.error('Failed to send welcome email:', error);
            return { success: false, error };
        }

        return { success: true };
    } catch (error) {
        console.error('Error in sendWelcomeEmailAction:', error);
        return { success: false, error };
    }
}
