import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getSession } from "@/lib/auth/session";
import { setRequestLocale } from "next-intl/server";
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

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader user={session.user} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
