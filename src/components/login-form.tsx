"use client";

import { useMemo } from "react"
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
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
import { useLanguage } from "@/lib/i18n/use-language";

type LoginFormProps = React.ComponentProps<"div"> & {
  nextPath?: string;
};

export function LoginForm({ className, nextPath = "/editor", ...props }: LoginFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const { t } = useLanguage();
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
      toast.error(t('auth.login.failed'), {
        description: error?.message ?? t('auth.login.checkInputs'),
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
      const baseUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      
      const redirectTo = `${baseUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { 
          redirectTo,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(t('auth.login.socialFailed'), {
        description: error?.message ?? t('auth.login.tryAgain'),
      });
      setSocialLoading(null);
    }
  };

  return (
    <>
      <LoginTransition isVisible={showTransition} onComplete={handleTransitionComplete} />
      <motion.div
        className={cn("flex flex-col gap-6", className)}
        initial={{ opacity: 1, scale: 1 }}
        animate={{ 
          opacity: showTransition ? 0 : 1,
          scale: showTransition ? 0.95 : 1,
        }}
        transition={{ 
          duration: 0.4,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleLogin}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-3 text-center">
                <Link href="/" className="relative h-28 w-28">
                  <Image
                    src="/logos/logosApp/ing_AI.png"
                    alt="Ing AI"
                    fill
                    sizes="112px"
                    className="object-contain"
                    priority
                  />
                </Link>
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold">{t('auth.login.title')}</h1>
                  <p className="text-muted-foreground text-balance text-sm">
                    {t('auth.login.description')}
                  </p>
                </div>
              </div>
              <Field>
                <FieldLabel htmlFor="email">{t('auth.login.email')}</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('auth.login.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">{t('auth.login.password')}</FieldLabel>
                  <Link
                    href="/auth/reset-password"
                    className="ml-auto text-sm underline-offset-2 hover:underline"
                  >
                    {t('auth.login.forgotPassword')}
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
                    aria-label={showPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')}
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
                  {t('auth.login.submit')}
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                {t('auth.login.orContinueWith')}
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
                {t('auth.login.noAccount')}{" "}
                <Link href="/auth/signup" className="underline underline-offset-4">
                  {t('auth.login.signUp')}
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
        {t('auth.login.termsAgreement')}{" "}
        <Link href="/terms" className="underline underline-offset-4">
          {t('auth.login.terms')}
        </Link>{" "}
        {t('auth.login.and')}{" "}
        <Link href="/privacy" className="underline underline-offset-4">
          {t('auth.login.privacy')}
        </Link>{" "}
        zu.
      </FieldDescription>
      </motion.div>
    </>
  );
}
