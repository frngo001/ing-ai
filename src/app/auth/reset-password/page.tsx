"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
      toast.success("OTP gesendet", {
        description: "Prüfe dein Postfach und gib den Code im nächsten Schritt ein.",
      });
      router.push(`/auth/otp?email=${encodeURIComponent(email)}`);
    } catch (error: any) {
      toast.error("Senden fehlgeschlagen", {
        description: error?.message ?? "Bitte E-Mail prüfen und erneut versuchen.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <Card className="overflow-hidden p-0">
          <CardContent className="grid p-0 md:grid-cols-2">
            <form className={cn("flex flex-col gap-5 p-6 md:p-8")} onSubmit={handleSendOtp}>
              <FieldGroup>
                <div className="flex items-center justify-center gap-2 rounded-md border border-dashed border-border/60 bg-card/70 px-3 py-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 text-primary" />
                  <span>OTP anfordern und Passwort zurücksetzen</span>
                </div>
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="relative h-28 w-28">
                    <Image
                      src="/logos/logosApp/ing_AI.png"
                      alt="Ing AI"
                      fill
                      sizes="112px"
                      className="object-contain"
                      priority
                    />
                  </div>
                  <div className="space-y-1">
                    <h1 className="text-2xl font-bold">Passwort vergessen?</h1>
                    <p className="text-muted-foreground text-sm text-balance">
                      Wir senden dir einen einmaligen Code, um dein Passwort zu setzen.
                    </p>
                  </div>
                </div>
                <Field>
                  <FieldLabel htmlFor="email">E-Mail</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    OTP senden
                  </Button>
                </Field>
                <FieldDescription className="text-center">
                  <Link href="/auth/login" className="underline underline-offset-4">
                    Zurück zum Login
                  </Link>
                </FieldDescription>
              </FieldGroup>
            </form>

            <div className="bg-muted relative hidden md:block">
              <Image
                src="/dashboard-dark.png"
                alt="Ing AI Editor"
                fill
                sizes="480px"
                className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.35] dark:grayscale"
                priority
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

