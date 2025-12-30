"use client";

import { useMemo } from "react"
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import GithubMark from "@/components/logos/github";
import GoogleLogo from "@/components/logos/google";
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

type SignupFormProps = React.ComponentProps<"div"> & {
  nextPath?: string;
};

export function SignupForm({ className, nextPath = "/dashboard", ...props }: SignupFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "github" | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;

      toast.success(t('auth.signup.accountCreated'), {
        description: data.session
          ? t('auth.signup.signedIn')
          : t('auth.signup.confirmEmail'),
      });

      if (data.session) {
        router.replace(nextPath);
        router.refresh();
      } else {
        router.push("/auth/login");
      }
    } catch (error: any) {
      toast.error(t('auth.signup.signupFailed'), {
        description: error?.message ?? t('auth.signup.checkInputs'),
      });
    } finally {
      setIsLoading(false);
    }
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
      toast.error(t('auth.signup.socialSignupFailed'), {
        description: error?.message ?? t('auth.signup.tryAgain'),
      });
      setSocialLoading(null);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSignup}>
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
                  <h1 className="text-2xl font-bold">{t('auth.signup.title')}</h1>
                  <p className="text-muted-foreground text-sm text-balance">
                    {t('auth.signup.description')}
                  </p>
                </div>
              </div>
              <Field>
                <FieldLabel htmlFor="fullName">{t('auth.signup.fullName')}</FieldLabel>
                <Input
                  id="fullName"
                  placeholder={t('auth.signup.fullNamePlaceholder')}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">{t('auth.signup.email')}</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('auth.signup.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <FieldLabel htmlFor="password">{t('auth.signup.password')}</FieldLabel>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? t('auth.signup.hidePassword') : t('auth.signup.showPassword')}
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-2 flex items-center"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <FieldLabel htmlFor="confirm-password">{t('auth.signup.confirmPassword')}</FieldLabel>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        aria-label={showConfirm ? t('auth.signup.hidePassword') : t('auth.signup.showPassword')}
                        onClick={() => setShowConfirm((prev) => !prev)}
                        className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-2 flex items-center"
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <FieldDescription>{t('auth.signup.passwordHint')}</FieldDescription>
              </Field>
              <Field>
                <Button type="submit" disabled={isLoading || Boolean(socialLoading)} className="w-full">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('auth.signup.submit')}
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                {t('auth.signup.orContinueWith')}
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
                {t('auth.signup.alreadyRegistered')}{" "}
                <Link href="/auth/login" className="underline underline-offset-4">
                  {t('auth.signup.goToLogin')}
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
        {t('auth.signup.termsAgreement')}{" "}
        <Link href="/terms" className="underline underline-offset-4">
          {t('auth.signup.terms')}
        </Link>{" "}
        {t('auth.signup.and')}{" "}
        <Link href="/privacy" className="underline underline-offset-4">
          {t('auth.signup.privacy')}
        </Link>{" "}
        zu.
      </FieldDescription>
    </div>
  );
}
