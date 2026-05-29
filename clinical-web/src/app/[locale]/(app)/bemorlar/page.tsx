import { Button } from "@/components/ui/button";
import { Link, redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getSession } from "@/lib/auth/session";
import { type PatientListItem, listPatients } from "@/lib/patients/queries";
import { BarChart3 } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PatientsClient, type SerializablePatient } from "./patients-client";

export default async function PatientsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) {
    redirect({ href: "/login", locale });
    // never reached — `redirect` throws
    return null;
  }

  const t = await getTranslations("Patients");
  const patients = await listPatients({ doctorId: session.user.id });

  // Serialize Date → ISO strings for the client component boundary
  const serialized: SerializablePatient[] = patients.map((p: PatientListItem) => ({
    ...p,
    tugilgan: p.tugilgan.toISOString(),
    boshlanish: p.boshlanish ? p.boshlanish.toISOString() : null,
    tugash: p.tugash ? p.tugash.toISOString() : null,
    sana: p.sana.toISOString(),
  }));

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6">
      <header className="mb-6 flex items-end justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <Link href="/tahlil">
          <Button variant="secondary" size="sm">
            <BarChart3 className="h-4 w-4" />
            Tahlil markazi
          </Button>
        </Link>
      </header>

      <PatientsClient initialPatients={serialized} />
    </div>
  );
}
