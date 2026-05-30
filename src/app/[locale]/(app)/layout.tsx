import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getSession } from "@/lib/auth/session";
import { getDoctorProfile } from "@/lib/doctor/actions";
import { setRequestLocale } from "next-intl/server";
import { AppFooter } from "./_components/app-footer";
import { AppHeader } from "./_components/app-header";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session) {
    redirect({ href: "/login", locale });
    return null;
  }

  const profile = (await getDoctorProfile()) ?? {
    fullName: session.user.name,
    email: session.user.email,
    title: null,
    clinic: null,
    phone: null,
    role: "doctor",
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader profile={profile} />
      <main className="flex-1">{children}</main>
      <AppFooter />
    </div>
  );
}
