"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { signupDoctor } from "@/lib/auth/actions";
import { signIn } from "@/lib/auth/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  fullName: z.string().trim().min(2),
  clinic: z.string().trim().optional(),
  email: z.string().email(),
  password: z.string().min(8),
});
type FormValues = z.infer<typeof schema>;

export function SignupForm() {
  const t = useTranslations("Signup");
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
    const result = await signupDoctor(values);
    if (!result.ok) {
      if (result.error === "EMAIL_EXISTS") setServerError(t("errors.emailExists"));
      else if (result.error === "WEAK_PASSWORD") setServerError(t("errors.weakPassword"));
      else setServerError(t("errors.unknown"));
      return;
    }
    // Hisob yaratildi — darhol kiritamiz
    try {
      await signIn.email({ email: values.email, password: values.password });
      router.replace("/bemorlar", { locale });
      router.refresh();
    } catch {
      router.replace("/login", { locale });
    }
  });

  return (
    <Card className="w-full max-w-[440px] shadow-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="fullName">{t("fullName")}</Label>
            <Input
              id="fullName"
              autoComplete="name"
              placeholder={t("fullNamePlaceholder")}
              aria-invalid={Boolean(errors.fullName)}
              {...register("fullName")}
            />
          </div>

          <div>
            <Label htmlFor="clinic">{t("clinic")}</Label>
            <Input
              id="clinic"
              autoComplete="organization"
              placeholder={t("clinicPlaceholder")}
              {...register("clinic")}
            />
          </div>

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
              autoComplete="new-password"
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
            <UserPlus className="h-4 w-4" />
            {isSubmitting ? t("submitting") : t("submit")}
          </Button>

          <p className="text-center text-sm text-ink-3">
            {t("haveAccount")}{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              {t("loginCta")}
            </Link>
          </p>
        </form>

        <p className="mt-6 text-center text-[11px] text-ink-4">{tCommon("appName")} · v0.1</p>
      </CardContent>
    </Card>
  );
}
