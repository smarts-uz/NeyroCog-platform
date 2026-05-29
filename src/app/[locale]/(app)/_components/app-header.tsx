"use client";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { signOut } from "@/lib/auth/client";
import { Brain, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";

export function AppHeader({ user }: { user: { name?: string; email: string } }) {
  const t = useTranslations("Common");
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur border-b border-border print:hidden">
      <div className="max-w-[1280px] mx-auto h-14 sm:h-16 px-4 sm:px-6 flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <span className="grid place-items-center h-8 w-8 rounded-md bg-primary text-white">
            <Brain className="h-4 w-4" />
          </span>
          <span className="font-bold tracking-tight text-ink hidden sm:inline">{t("appName")}</span>
        </div>

        <div className="flex-1" />

        <div className="hidden md:flex items-center gap-2 text-xs text-ink-3">
          <span>{user.name ?? user.email}</span>
        </div>

        <ThemeToggle />
        <LocaleSwitcher />

        <Button variant="ghost" size="sm" onClick={handleSignOut} aria-label="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
