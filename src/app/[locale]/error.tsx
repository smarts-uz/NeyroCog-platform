"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Errors");

  useEffect(() => {
    // Production'da bu yerga real logger (Sentry va h.k.) ulanadi
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-[70vh] grid place-items-center px-4">
      <div className="max-w-md w-full text-center flex flex-col items-center gap-4">
        <div className="h-16 w-16 rounded-pill bg-err-bg text-err grid place-items-center">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">{t("500.title")}</h1>
          <p className="text-sm text-ink-2 mt-1.5">{t("500.subtitle")}</p>
        </div>
        <Button onClick={reset} className="mt-1">
          <RotateCw className="h-4 w-4" />
          {t("500.retry")}
        </Button>
      </div>
    </main>
  );
}
