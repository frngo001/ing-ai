"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import GithubMark from "@/components/logos/github";
import GoogleLogo from "@/components/logos/google";
import { LoginTransition } from "@/components/login-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type LoginFormProps = React.ComponentProps<"div"> & {
  nextPath?: string;
};

export function LoginForm({ className, nextPath = "/editor", ...props }: LoginFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "github" | null>(null);
  const [showTransition, setShowTransition] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setShowTransition(true);
    } catch (error: any) {
      toast.error("Login fehlgeschlagen", {
        description: error?.message ?? "Bitte Eingaben prüfen.",
      });
      setIsLoading(false);
    }
  };

  const handleTransitionComplete = () => {
    router.replace(nextPath);
    router.refresh();
  };

  const handleOAuth = async (provider: "google" | "github") => {
    setSocialLoading(provider);
    try {
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`
          : undefined;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error("Social Login fehlgeschlagen", {
        description: error?.message ?? "Bitte erneut versuchen.",
      });
      setSocialLoading(null);
    }
  };

  return (
    <>
      <LoginTransition isVisible={showTransition} onComplete={handleTransitionComplete} />
      <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleLogin}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-3 text-center">
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
                  <h1 className="text-2xl font-bold">Bei Ing AI anmelden</h1>
                  <p className="text-muted-foreground text-balance text-sm">
                    Nutze Editor, Projekte und Zitationen mit deinem Team.
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
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Passwort</FieldLabel>
                  <Link
                    href="/auth/reset-password"
                    className="ml-auto text-sm underline-offset-2 hover:underline"
                  >
                    Passwort vergessen?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-2 flex items-center"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
              <Field>
                <Button type="submit" disabled={isLoading || Boolean(socialLoading)} className="w-full">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Einloggen
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Oder weiter mit
              </FieldSeparator>
              <Field className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  type="button"
                  className="w-full justify-center gap-2"
                  onClick={() => handleOAuth("google")}
                  disabled={Boolean(socialLoading) || isLoading}
                >
                  {socialLoading === "google" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <GoogleLogo className="h-4 w-4" />
                  )}
                  Google
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  className="w-full justify-center gap-2"
                  onClick={() => handleOAuth("github")}
                  disabled={Boolean(socialLoading) || isLoading}
                >
                  {socialLoading === "github" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <GithubMark className="h-4 w-4" />
                  )}
                  GitHub
                </Button>
              </Field>
              <FieldDescription className="text-center">
                Noch kein Account?{" "}
                <Link href="/auth/signup" className="underline underline-offset-4">
                  Jetzt registrieren
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className="bg-muted relative hidden md:block">
            <img
              src="/dashboard-dark.png"
              alt="Ing AI Editor"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.3] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        Durch Login stimmst du unseren{" "}
        <Link href="/terms" className="underline underline-offset-4">
          Nutzungsbedingungen
        </Link>{" "}
        und{" "}
        <Link href="/privacy" className="underline underline-offset-4">
          Datenschutz
        </Link>{" "}
        zu.
      </FieldDescription>
    </div>
    </>
  );
}
