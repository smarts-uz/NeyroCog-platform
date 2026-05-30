"use client";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { signOut } from "@/lib/auth/client";
import type { DoctorProfile } from "@/lib/doctor/actions";
import { Brain, Globe, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { DoctorProfileModal } from "./doctor-profile-modal";

function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

export function AppHeader({ profile }: { profile: DoctorProfile }) {
  const t = useTranslations("Common");
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur border-b border-border print:hidden">
      <div className="max-w-[1280px] mx-auto h-14 sm:h-16 px-4 sm:px-6 flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => router.push("/bemorlar")}
          className="flex items-center gap-2 cursor-pointer"
          aria-label={t("appName")}
        >
          <span className="grid place-items-center h-8 w-8 rounded-md bg-primary text-white">
            <Brain className="h-4 w-4" />
          </span>
          <span className="font-bold tracking-tight text-ink hidden sm:inline">{t("appName")}</span>
        </button>

        <div className="flex-1" />

        {/* Tanishtiruv (landing) sahifasi */}
        <Link
          href="/sayt"
          title="Tanishtiruv sahifasi"
          className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-md text-sm font-semibold text-ink-2 hover:bg-surface-2 transition-colors"
        >
          <Globe className="h-[15px] w-[15px]" />
          <span className="hidden sm:inline">Sayt</span>
        </Link>

        {/* Doctor chip — opens profile editor */}
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="flex items-center gap-2 rounded-pill p-1 sm:pr-3 hover:bg-surface-2 transition-colors cursor-pointer"
          aria-label={t("editProfile")}
        >
          <span className="grid place-items-center h-8 w-8 rounded-pill bg-primary text-white text-xs font-bold shrink-0">
            {initialsOf(profile.fullName)}
          </span>
          <span className="hidden md:flex flex-col items-start leading-tight">
            <span className="text-xs font-semibold text-ink">{profile.fullName}</span>
            {profile.title ? <span className="text-[11px] text-ink-3">{profile.title}</span> : null}
          </span>
        </button>

        <ThemeToggle />
        <LocaleSwitcher />

        <Button variant="ghost" size="sm" onClick={handleSignOut} aria-label="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      <DoctorProfileModal open={editOpen} onOpenChange={setEditOpen} profile={profile} />
    </header>
  );
}
