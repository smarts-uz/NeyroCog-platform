import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getCohort } from "@/lib/analytics/cohort";
import { getSession } from "@/lib/auth/session";
import { setRequestLocale } from "next-intl/server";
import { AnalyticsClient } from "./analytics-client";

const TABS = ["dashboard", "roc", "treatment", "reports"] as const;
type TabId = (typeof TABS)[number];

export default async function AnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale } = await params;
  const { tab } = await searchParams;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) {
    redirect({ href: "/login", locale });
    return null;
  }

  const initialTab: TabId = (TABS as readonly string[]).includes(tab ?? "")
    ? (tab as TabId)
    : "dashboard";

  const cohort = await getCohort(session.user.id);
  return <AnalyticsClient cohort={cohort} initialTab={initialTab} />;
}
