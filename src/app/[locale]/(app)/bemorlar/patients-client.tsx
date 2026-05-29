"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pill } from "@/components/ui/pill";
import { useRouter } from "@/i18n/navigation";
import { forecast } from "@/lib/engines/prediction";
import type { PatientListItem } from "@/lib/patients/queries";
import { Plus, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { NewPatientModal } from "./new-patient-modal";

interface Props {
  initialPatients: SerializablePatient[];
}

// Drizzle Date'ni server'dan kliyentga uzatish — string'lashtirilgan
export type SerializablePatient = Omit<
  PatientListItem,
  "tugilgan" | "boshlanish" | "tugash" | "sana"
> & {
  tugilgan: string;
  boshlanish: string | null;
  tugash: string | null;
  sana: string;
};

export function PatientsClient({ initialPatients }: Props) {
  const t = useTranslations("Patients");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return initialPatients;
    return initialPatients.filter((p) => p.fish.toLowerCase().includes(q));
  }, [initialPatients, query]);

  const stats = useMemo(() => {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    return {
      total: initialPatients.length,
      tested: initialPatients.filter((p) => p.testCount > 0).length,
      inRehab: initialPatients.filter((p) => p.trainingCount > 0).length,
      newThisWeek: initialPatients.filter((p) => new Date(p.sana).getTime() >= weekAgo).length,
    };
  }, [initialPatients]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label={t("stats.total")} value={stats.total} />
        <StatCard label={t("stats.testsCompleted")} value={stats.tested} />
        <StatCard label={t("stats.inRehab")} value={stats.inRehab} />
        <StatCard label={t("stats.newThisWeek")} value={stats.newThisWeek} />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative w-full sm:flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-4" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tCommon("search")}
            className="pl-9"
          />
        </div>
        <div className="hidden sm:block sm:flex-1" />
        <Button onClick={() => setModalOpen(true)} className="w-full sm:w-auto justify-center">
          <Plus className="h-4 w-4" />
          {t("newPatient")}
        </Button>
      </div>

      {/* Mobil: Card ro'yxati (mobile-first mandate — jadval o'rniga) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filtered.length === 0 ? (
          <Card className="p-8 text-center text-ink-3">{t("empty")}</Card>
        ) : (
          filtered.map((p, idx) => {
            const fc = forecast({
              yosh: p.yosh,
              premorbid: (p.premorbid > 0 ? 1 : 0) as 0 | 1,
              davom: p.davom,
              prep: p.prep,
            });
            const riskPct = Math.round(fc.composite.risk.prob * 100);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => router.push(`/bemorlar/${p.id}`)}
                className="text-left w-full"
              >
                <Card className="p-4 active:bg-surface-2 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-ink truncate">
                        {idx + 1}. {p.fish}
                      </div>
                      <div className="text-xs text-ink-3 mt-0.5">
                        {p.yosh} yosh · {p.davom} daq · {p.prep} prep
                      </div>
                    </div>
                    <span
                      className="shrink-0 font-mono tabular-nums font-semibold text-lg"
                      style={{ color: fc.composite.category.color }}
                    >
                      {riskPct}%
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {p.premorbid > 0 ? (
                      <Pill tone="warn" dot>
                        {t("modal.premorbidOn")}
                      </Pill>
                    ) : (
                      <Pill tone="ok" dot>
                        {t("modal.premorbidOff")}
                      </Pill>
                    )}
                    {p.testCount > 0 ? (
                      <Pill tone="ok">
                        {t("columns.diagnosis")}: {p.testCount}
                      </Pill>
                    ) : null}
                    {p.trainingCount > 0 ? (
                      <Pill tone="primary">
                        {t("columns.treatment")}: {p.trainingCount}
                      </Pill>
                    ) : null}
                  </div>
                </Card>
              </button>
            );
          })
        )}
      </div>

      {/* Desktop: to'liq DataTable */}
      <Card className="overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-ink-3 text-[11px] uppercase tracking-wider">
              <tr>
                <Th className="w-10 text-center">{t("columns.number")}</Th>
                <Th>{t("columns.fish")}</Th>
                <Th className="w-16 text-center">{t("columns.age")}</Th>
                <Th className="w-32">{t("columns.premorbid")}</Th>
                <Th className="w-28 text-right">{t("columns.duration")}</Th>
                <Th className="w-20 text-center">{t("columns.prep")}</Th>
                <Th className="w-24 text-center">{t("columns.diagnosis")}</Th>
                <Th className="w-28 text-center">{t("columns.treatment")}</Th>
                <Th className="w-28 text-right">{t("columns.forecast")}</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-ink-3">
                    {t("empty")}
                  </td>
                </tr>
              ) : (
                filtered.map((p, idx) => {
                  const fc = forecast({
                    yosh: p.yosh,
                    premorbid: (p.premorbid > 0 ? 1 : 0) as 0 | 1,
                    davom: p.davom,
                    prep: p.prep,
                  });
                  const riskPct = Math.round(fc.composite.risk.prob * 100);
                  return (
                    <tr
                      key={p.id}
                      onClick={() => router.push(`/bemorlar/${p.id}`)}
                      className="border-t border-divider hover:bg-surface-2 transition-colors cursor-pointer"
                    >
                      <Td className="text-center text-ink-3">{idx + 1}</Td>
                      <Td className="font-medium">{p.fish}</Td>
                      <Td className="text-center font-mono tabular-nums">{p.yosh}</Td>
                      <Td>
                        {p.premorbid > 0 ? (
                          <Pill tone="warn" dot>
                            {t("modal.premorbidOn")}
                          </Pill>
                        ) : (
                          <Pill tone="ok" dot>
                            {t("modal.premorbidOff")}
                          </Pill>
                        )}
                      </Td>
                      <Td className="text-right font-mono tabular-nums">{p.davom} daq</Td>
                      <Td className="text-center font-mono tabular-nums">{p.prep}</Td>
                      <Td className="text-center">
                        {p.testCount > 0 ? (
                          <Pill tone="ok">{p.testCount}</Pill>
                        ) : (
                          <span className="text-ink-4">—</span>
                        )}
                      </Td>
                      <Td className="text-center">
                        {p.trainingCount > 0 ? (
                          <Pill tone="primary">{p.trainingCount}</Pill>
                        ) : (
                          <span className="text-ink-4">—</span>
                        )}
                      </Td>
                      <Td className="text-right">
                        <span
                          className="inline-block font-mono tabular-nums font-semibold"
                          style={{ color: fc.composite.category.color }}
                        >
                          {riskPct}%
                        </span>
                      </Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <NewPatientModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <div className="text-[11px] uppercase tracking-wider text-ink-3">{label}</div>
      <div className="text-2xl font-bold font-mono tabular-nums mt-1">{value}</div>
    </Card>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-3 py-2.5 text-left font-semibold ${className ?? ""}`} scope="col">
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 ${className ?? ""}`}>{children}</td>;
}
