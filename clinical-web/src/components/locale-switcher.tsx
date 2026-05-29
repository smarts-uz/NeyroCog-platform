"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

// Barcha mumkin bo'lgan lokallar uchun yorliqlar (routing.locales hozir faqat uz,
// lekin ru/en qo'shilganda avtomatik ishlasin).
const LABEL: Record<string, string> = {
  uz: "O'zbekcha",
  ru: "Русский",
  en: "English",
};

const SHORT: Record<string, string> = {
  uz: "UZ",
  ru: "RU",
  en: "EN",
};

export function LocaleSwitcher() {
  const t = useTranslations("Common");
  const locale = useLocale() as (typeof routing.locales)[number];
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const onChange = (next: (typeof routing.locales)[number]) => {
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  };

  return (
    <div
      className="inline-flex items-center rounded-md border border-border-strong bg-surface p-0.5 text-xs"
      role="group"
      aria-label={t("language")}
    >
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          aria-current={locale === l ? "true" : undefined}
          aria-label={LABEL[l]}
          disabled={pending}
          onClick={() => onChange(l)}
          className={cn(
            // Mobil'da kattaroq touch target (≥36px), desktop'da kompakt segment
            "h-9 sm:h-7 px-3 sm:px-2.5 rounded-[6px] font-medium transition-colors duration-150",
            locale === l ? "bg-primary text-white" : "text-ink-2 hover:bg-surface-2",
          )}
        >
          {SHORT[l]}
        </button>
      ))}
    </div>
  );
}
