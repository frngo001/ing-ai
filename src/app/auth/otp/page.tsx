"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { OTPForm } from "@/components/otp-form";
import { createClient } from "@/lib/supabase/client";

function OTPPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();

  const email = useMemo(() => params.get("email") ?? "", [params]);

  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleResend = async () => {
    if (!email) {
      toast.error("E-Mail fehlt", { description: "Bitte kehre zurück und gib deine E-Mail ein." });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
      toast.success("OTP erneut gesendet");
    } catch (error: any) {
      toast.error("Senden fehlgeschlagen", {
        description: error?.message ?? "Bitte erneut versuchen.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });
      if (verifyError) throw verifyError;

      toast.success("OTP bestätigt", {
        description: "Du bist nun angemeldet.",
      });
      router.replace("/editor");
      router.refresh();
    } catch (error: any) {
      toast.error("Verifizierung fehlgeschlagen", {
        description: error?.message ?? "Bitte Code prüfen.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl space-y-4">
        <OTPForm
          code={otp}
          onCodeChange={(val) => setOtp(val)}
          onSubmit={handleSubmit}
          onResend={handleResend}
          isLoading={isLoading}
        />

        <div className="text-center text-sm text-muted-foreground">
          <Link href="/auth/login" className="underline underline-offset-4">
            Zurück zum Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OTPPage() {
  return (
    <Suspense fallback={
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm md:max-w-4xl space-y-4">
          <div className="text-center">Lade...</div>
        </div>
      </div>
    }>
      <OTPPageContent />
    </Suspense>
  );
}

