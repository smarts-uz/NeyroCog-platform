import type { Locale } from "@/i18n/routing";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LandingClient } from "./landing-client";

export const metadata: Metadata = {
  title: "NeyroCog — Bolalarda operatsiyadan keyingi kognitiv buzilishni baholash tizimi",
  description:
    "NeyroCog — maktab yoshidagi bolalarda perioperativ neyrokognitiv buzilishni (PNB) erta diagnostika qilish, xavfni bashorat qilish va raqamli reabilitatsiya qilish uchun klinik platforma.",
};

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LandingClient />;
}
