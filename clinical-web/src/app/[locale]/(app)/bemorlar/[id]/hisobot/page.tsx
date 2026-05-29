import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getSession } from "@/lib/auth/session";
import { getPatientDetail } from "@/lib/patients/detail";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { PatientReport } from "./patient-report";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) {
    redirect({ href: "/login", locale });
    return null;
  }

  const bundle = await getPatientDetail({ patientId: id, doctorId: session.user.id });
  if (!bundle) notFound();

  return <PatientReport bundle={bundle} doctorName={session.user.name ?? session.user.email} />;
}
