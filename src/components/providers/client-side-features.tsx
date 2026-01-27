"use client";

import { Toaster } from '@/components/ui/sonner';
import { CookieConsent } from '@/components/cookie-consent';
import { AnalyticsProvider } from '@/components/analytics-provider';

export function ClientSideFeatures() {
    return (
        <>
            <Toaster />
            <AnalyticsProvider />
            <CookieConsent />
        </>
    );
}
