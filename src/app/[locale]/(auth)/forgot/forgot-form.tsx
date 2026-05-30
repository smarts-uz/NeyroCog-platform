"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });
type FormValues = z.infer<typeof schema>;

export function ForgotForm() {
  const t = useTranslations("Forgot");
  const tCommon = useTranslations("Common");
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  // Email yuborish hali sozlanmagan — anti-enumeration uchun har doim
  // neytral muvaffaqiyat xabari ko'rsatiladi (akkaunt bor-yo'qligi oshkor etilmaydi).
  const onSubmit = handleSubmit(async () => {
    await new Promise((r) => setTimeout(r, 500));
    setSent(true);
  });

  return (
    <Card className="w-full max-w-[420px] shadow-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="flex flex-col items-center text-center gap-3 py-2">
            <span className="grid place-items-center h-12 w-12 rounded-full bg-ok-bg text-ok">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <h3 className="font-bold text-lg text-ink">{t("sentTitle")}</h3>
            <p className="text-sm text-ink-3 leading-relaxed">{t("sentBody")}</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline mt-1"
            >
              <ArrowLeft className="h-4 w-4" /> {t("back")}
            </Link>
          </div>
        ) : (
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
              {errors.email ? <p className="mt-1 text-xs text-err">{t("invalidEmail")}</p> : null}
            </div>

            <Button type="submit" disabled={isSubmitting} size="lg" className="w-full">
              <Send className="h-4 w-4" />
              {isSubmitting ? t("submitting") : t("submit")}
            </Button>

            <p className="text-center text-sm text-ink-3 pt-2 border-t border-divider">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-primary font-medium hover:underline"
              >
                <ArrowLeft className="h-4 w-4" /> {t("back")}
              </Link>
            </p>
          </form>
        )}

        <p className="mt-6 text-center text-[11px] text-ink-4">{tCommon("appName")} · v1.0</p>
      </CardContent>
    </Card>
  );
}
