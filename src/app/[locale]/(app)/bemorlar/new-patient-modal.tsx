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
import { createPatient, updatePatient } from "@/lib/patients/actions";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, useTransition } from "react";

export interface PatientInitial {
  id: string;
  fish: string;
  jinsi: string;
  tugilgan: string; // ISO
  premorbid: number;
  prep: number;
  boshlanish: string | null; // ISO
  tugash: string | null; // ISO
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Mavjud bo'lsa — tahrirlash rejimi */
  initial?: PatientInitial;
}

// ISO → datetime-local input qiymati (mahalliy vaqt)
function toLocalDateTime(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function toDateInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function NewPatientModal({ open, onOpenChange, initial }: Props) {
  const t = useTranslations("Patients.modal");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(initial);

  const [fish, setFish] = useState("");
  const [prep, setPrep] = useState("3");
  const [jinsi, setJinsi] = useState<"Erkak" | "Ayol">("Erkak");
  const [premorbid, setPremorbid] = useState<0 | 1>(0);
  const [tugilgan, setTugilgan] = useState("");
  const [boshlanish, setBoshlanish] = useState("");
  const [tugash, setTugash] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  // Modal ochilganda boshlang'ich qiymatlarni sinxronlash
  // biome-ignore lint/correctness/useExhaustiveDependencies: faqat `open` o'zgarganda reset
  useEffect(() => {
    if (!open) return;
    setServerError(null);
    if (initial) {
      setFish(initial.fish);
      setPrep(String(initial.prep));
      setJinsi(initial.jinsi === "Ayol" ? "Ayol" : "Erkak");
      setPremorbid(initial.premorbid > 0 ? 1 : 0);
      setTugilgan(toDateInput(initial.tugilgan));
      setBoshlanish(toLocalDateTime(initial.boshlanish));
      setTugash(toLocalDateTime(initial.tugash));
    } else {
      setFish("");
      setPrep("3");
      setJinsi("Erkak");
      setPremorbid(0);
      setTugilgan("");
      setBoshlanish("");
      setTugash("");
    }
  }, [open]);

  const age = useMemo(() => {
    if (!tugilgan) return null;
    const d = new Date(tugilgan);
    if (Number.isNaN(d.getTime())) return null;
    const now = new Date();
    let a = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
    return Math.max(0, a);
  }, [tugilgan]);

  const durationLabel = useMemo(() => {
    if (!boshlanish || !tugash) return { text: t("durationEmpty"), valid: false };
    const s = new Date(boshlanish);
    const e = new Date(tugash);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
      return { text: t("durationInvalid"), valid: false };
    }
    const minutes = Math.round((e.getTime() - s.getTime()) / 60000);
    if (minutes <= 0) return { text: t("durationInvalid"), valid: false };
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return { text: h > 0 ? `${minutes} daq (${h}s ${m}daq)` : `${minutes} daq`, valid: true };
  }, [boshlanish, tugash, t]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("jinsi", jinsi);
    formData.set("premorbid", String(premorbid));

    startTransition(async () => {
      const result = initial
        ? await updatePatient(initial.id, formData)
        : await createPatient(formData);
      if (!result.ok) {
        setServerError(tCommon("error"));
        return;
      }
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[832px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Bemorni tahrirlash" : t("title")}</DialogTitle>
          <DialogDescription>—</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* F.I.Sh. */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-[1fr_240px] gap-4">
            <div>
              <Label htmlFor="fish">{t("fish")}</Label>
              <Input
                id="fish"
                name="fish"
                required
                autoComplete="off"
                placeholder={t("fishPlaceholder")}
                value={fish}
                onChange={(e) => setFish(e.target.value)}
              />
            </div>
            <div>
              <Label>{t("jinsi")}</Label>
              <div
                role="radiogroup"
                aria-label={t("jinsi")}
                className="inline-flex h-10 w-full rounded-md border border-border-strong overflow-hidden"
              >
                <SegmentedOption
                  active={jinsi === "Erkak"}
                  onClick={() => setJinsi("Erkak")}
                  label={t("male")}
                />
                <div className="w-px bg-border" />
                <SegmentedOption
                  active={jinsi === "Ayol"}
                  onClick={() => setJinsi("Ayol")}
                  label={t("female")}
                />
              </div>
            </div>
          </div>

          {/* Tug'ilgan + yoshi */}
          <div>
            <Label htmlFor="tugilgan">{t("birthDate")}</Label>
            <Input
              id="tugilgan"
              name="tugilgan"
              type="date"
              required
              value={tugilgan}
              onChange={(e) => setTugilgan(e.target.value)}
            />
          </div>
          <div>
            <Label>{t("age")}</Label>
            <div className="h-10 grid place-items-center rounded-md bg-primary-soft-2 text-primary font-mono font-semibold tabular-nums border border-primary/20">
              {age != null ? `${age} yosh` : t("ageAuto")}
            </div>
          </div>

          {/* Premorbid + preparat */}
          <div>
            <Label>{t("premorbid")}</Label>
            <button
              type="button"
              role="switch"
              aria-checked={premorbid === 1}
              onClick={() => setPremorbid(premorbid === 1 ? 0 : 1)}
              className={`h-10 w-full rounded-md border flex items-center justify-between px-3 transition-colors ${
                premorbid === 1
                  ? "bg-warn-bg border-warn/30 text-amber-900"
                  : "bg-surface-2 border-border-strong text-ink-2"
              }`}
            >
              <span className="text-sm">
                {premorbid === 1 ? t("premorbidOn") : t("premorbidOff")}
              </span>
              <span
                className={`relative h-5 w-9 rounded-pill transition-colors ${
                  premorbid === 1 ? "bg-primary" : "bg-ink-4"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-pill bg-white transition-[left] duration-150 ${
                    premorbid === 1 ? "left-[18px]" : "left-0.5"
                  }`}
                />
              </span>
            </button>
          </div>
          <div>
            <Label htmlFor="prep">{t("prep")}</Label>
            <Input
              id="prep"
              name="prep"
              type="number"
              min={0}
              max={20}
              required
              value={prep}
              onChange={(e) => setPrep(e.target.value)}
            />
          </div>

          {/* Operatsiya vaqtlari */}
          <div className="md:col-span-2">
            <Label>{t("operationTimes")}</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-ink-3">
                  {t("startTime")}
                </span>
                <Input
                  type="datetime-local"
                  name="boshlanish"
                  required
                  value={boshlanish}
                  onChange={(e) => setBoshlanish(e.target.value)}
                />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-ink-3">
                  {t("endTime")}
                </span>
                <Input
                  type="datetime-local"
                  name="tugash"
                  required
                  value={tugash}
                  onChange={(e) => setTugash(e.target.value)}
                />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-ink-3">
                  {t("duration")}
                </span>
                <div
                  className={`h-10 grid place-items-center rounded-md border font-mono tabular-nums text-sm ${
                    durationLabel.valid
                      ? "bg-primary-soft-2 border-primary/20 text-primary"
                      : "bg-surface-2 border-border-strong text-ink-3"
                  }`}
                >
                  {durationLabel.text}
                </div>
              </div>
            </div>
          </div>

          {serverError ? (
            <div
              role="alert"
              className="md:col-span-2 rounded-md border border-err/30 bg-err-bg text-red-900 px-3 py-2 text-sm"
            >
              {serverError}
            </div>
          ) : null}

          <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2 border-t border-divider">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={isPending || !durationLabel.valid}>
              {isPending ? t("saving") : t("save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SegmentedOption({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`flex-1 text-sm font-medium transition-colors ${
        active ? "bg-primary text-white" : "bg-surface text-ink hover:bg-surface-2"
      }`}
    >
      {label}
    </button>
  );
}
