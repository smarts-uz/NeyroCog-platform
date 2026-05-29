"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";
import type { DoctorProfile } from "@/lib/doctor/actions";
import { updateDoctorProfile } from "@/lib/doctor/actions";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";

const TITLES = [
  "Mutaxassis",
  "Nevropatolog",
  "Pediatr",
  "Anesteziolog",
  "Tadqiqotchi",
  "Administrator",
] as const;

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

export function DoctorProfileModal({
  open,
  onOpenChange,
  profile,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: DoctorProfile;
}) {
  const t = useTranslations("Profile");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState(profile.fullName);
  const [title, setTitle] = useState(profile.title ?? "Mutaxassis");
  const [clinic, setClinic] = useState(profile.clinic ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");

  useEffect(() => {
    if (!open) return;
    setError(null);
    setFullName(profile.fullName);
    setTitle(profile.title ?? "Mutaxassis");
    setClinic(profile.clinic ?? "");
    setPhone(profile.phone ?? "");
  }, [open]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!fullName.trim()) {
      setError(t("nameRequired"));
      return;
    }
    startTransition(async () => {
      const res = await updateDoctorProfile({ fullName, title, clinic, phone });
      if (!res.ok) {
        setError(tCommon("error"));
        return;
      }
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("subtitle")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-14 w-14 rounded-pill bg-primary text-white grid place-items-center font-bold text-xl shrink-0">
              {initialsOf(fullName)}
            </div>
            <div className="text-[13px] text-ink-3">{t("avatarHint")}</div>
          </div>

          <div>
            <Label htmlFor="dp-name">{t("fullName")}</Label>
            <Input
              id="dp-name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Dr. A. Karimova"
            />
          </div>

          <div>
            <Label htmlFor="dp-title">{t("role")}</Label>
            <select
              id="dp-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 w-full rounded-md border border-border-strong bg-surface px-3 text-sm text-ink"
            >
              {TITLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="dp-clinic">{t("clinic")}</Label>
            <Input
              id="dp-clinic"
              value={clinic}
              onChange={(e) => setClinic(e.target.value)}
              placeholder="Pediatrik diagnostika markazi"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>{t("email")}</Label>
              <div className="h-10 grid place-items-center rounded-md bg-surface-2 border border-border text-ink-3 text-sm px-3 truncate">
                {profile.email}
              </div>
            </div>
            <div>
              <Label htmlFor="dp-phone">{t("phone")}</Label>
              <Input
                id="dp-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
              />
            </div>
          </div>

          {error ? (
            <div
              role="alert"
              className="rounded-md border border-err/30 bg-err-bg text-red-900 px-3 py-2 text-sm"
            >
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-divider">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t("saving") : tCommon("save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
