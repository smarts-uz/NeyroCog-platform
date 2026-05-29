import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getCohort } from "@/lib/analytics/cohort";
import { getSession } from "@/lib/auth/session";
import { setRequestLocale } from "next-intl/server";
import { AnalyticsClient } from "./analytics-client";

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) {
    redirect({ href: "/login", locale });
    return null;
  }

  const cohort = await getCohort(session.user.id);
  return <AnalyticsClient cohort={cohort} />;
}
