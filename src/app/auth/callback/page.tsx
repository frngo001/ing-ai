"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginTransition } from "@/components/login-transition";
import { createClient } from "@/lib/supabase/client";

function CallbackPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showTransition, setShowTransition] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const code = searchParams.get("code");
      const next = searchParams.get("next") ?? "/editor";
      
      if (!code) {
        setError("Kein Authentifizierungscode gefunden");
        setTimeout(() => {
          router.replace("/auth/login?error=oauth");
        }, 2000);
        return;
      }

      try {
        const supabase = createClient();
        
        // Für PKCE: exchangeCodeForSession holt automatisch den Code Verifier aus localStorage
        // Der Code Verifier wird beim signInWithOAuth() automatisch gespeichert
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        
        if (exchangeError) {
          console.error("Exchange error details:", exchangeError);
          
          // Wenn der Code Verifier fehlt, könnte es sein, dass der User von einer anderen Domain kommt
          // In diesem Fall müssen wir den Login-Prozess neu starten
          if (exchangeError.message?.includes("code verifier")) {
            setError("Authentifizierungssitzung abgelaufen. Bitte versuche es erneut.");
            setTimeout(() => {
              router.replace("/auth/login?error=session_expired");
            }, 2000);
            return;
          }
          
          throw exchangeError;
        }

        if (!data.session) {
          throw new Error("Keine Session erhalten");
        }

        // Show transition after successful authentication
        setShowTransition(true);
      } catch (err: any) {
        console.error("OAuth callback error", err);
        setError(err?.message ?? "Authentifizierung fehlgeschlagen");
        setTimeout(() => {
          router.replace("/auth/login?error=oauth");
        }, 2000);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  const handleTransitionComplete = () => {
    const next = searchParams.get("next") ?? "/editor";
    router.replace(next);
    router.refresh();
  };

  if (error) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <p className="text-muted-foreground text-sm">Weiterleitung...</p>
        </div>
      </div>
    );
  }

  return <LoginTransition isVisible={showTransition} onComplete={handleTransitionComplete} />;
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-svh items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground text-sm">Lade...</p>
        </div>
      </div>
    }>
      <CallbackPageContent />
    </Suspense>
  );
}

