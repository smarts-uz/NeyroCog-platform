"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { signIn } from "@/lib/auth/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const t = useTranslations("Login");
  const tCommon = useTranslations("Common");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const result = await signIn.email({
        email: values.email,
        password: values.password,
      });
      if (result.error) {
        const code = result.error.code ?? result.error.status;
        if (code === "INVALID_EMAIL_OR_PASSWORD" || code === 401) {
          setServerError(t("errors.invalidCredentials"));
        } else if (code === "TOO_MANY_REQUESTS" || code === 429) {
          setServerError(t("errors.tooManyAttempts"));
        } else {
          setServerError(t("errors.unknown"));
        }
        return;
      }
      router.replace("/bemorlar", { locale });
      router.refresh();
    } catch {
      setServerError(t("errors.network"));
    }
  });

  return (
    <Card className="w-full max-w-[420px] shadow-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={t("emailPlaceholder")}
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
          </div>

          <div>
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder={t("passwordPlaceholder")}
              aria-invalid={Boolean(errors.password)}
              {...register("password")}
            />
          </div>

          {serverError ? (
            <div
              role="alert"
              className="rounded-md border border-err/30 bg-err-bg text-red-900 px-3 py-2 text-sm"
            >
              {serverError}
            </div>
          ) : null}

          <Button type="submit" disabled={isSubmitting} size="lg" className="w-full">
            <LogIn className="h-4 w-4" />
            {isSubmitting ? t("submitting") : t("submit")}
          </Button>

          <p className="text-center text-xs text-ink-3">
            <button type="button" className="hover:text-primary">
              {t("forgotPassword")}
            </button>
          </p>

          <p className="text-center text-sm text-ink-3 pt-2 border-t border-divider">
            {t("noAccount")}{" "}
            <Link href="/signup" className="text-primary font-medium hover:underline">
              {t("signupCta")}
            </Link>
          </p>
        </form>

        <p className="mt-6 text-center text-[11px] text-ink-4">{tCommon("appName")} · v0.1</p>
      </CardContent>
    </Card>
  );
}
