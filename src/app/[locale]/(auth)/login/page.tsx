import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getSession } from "@/lib/auth/session";
import { setRequestLocale } from "next-intl/server";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Allaqachon login bo'lgan — bemorlarga yo'naltir
  const session = await getSession();
  if (session) {
    redirect({ href: "/bemorlar", locale });
  }

  return (
    <main className="min-h-screen grid place-items-center px-4 py-10 relative">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <ThemeToggle />
        <LocaleSwitcher />
      </div>
      <LoginForm />
    </main>
  );
}
