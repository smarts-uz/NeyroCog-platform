import { outfit } from "@/app/fonts";
import { Providers } from "@/components/providers";
import { ThemeScript } from "@/components/theme-toggle";
import { type Locale, routing } from "@/i18n/routing";
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import "@/app/globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Mobile-first / to'liq adaptiv — Research Plan talabi (CLAUDE.md).
// width=device-width bo'lmasa mobil brauzer desktop kenglikda render qiladi
// va responsive CSS umuman ishlamaydi.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0f766e",
  viewportFit: "cover",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Common" });
  return {
    title: t("appName"),
    description: t("appName"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!(routing.locales as readonly string[]).includes(locale)) notFound();
  const typedLocale = locale as Locale;

  // Enable static rendering for this locale
  setRequestLocale(typedLocale);

  const messages = await getMessages();

  return (
    <html lang={typedLocale} className={outfit.variable} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-screen bg-bg text-ink antialiased overflow-x-hidden">
        <NextIntlClientProvider locale={typedLocale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
