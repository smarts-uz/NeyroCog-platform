"use client";

import { ClinicalIcon } from "@/components/clinical-icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useRouter } from "@/i18n/navigation";
import type { TestName, TestSummary, Timepoint } from "@/lib/engines/types";
import type { PatientDetailBundle } from "@/lib/patients/detail";
import { saveTestResult } from "@/lib/tests/actions";
import { TESTS } from "@/lib/tests/meta";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Download, Pencil, Play, Square, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { NewPatientModal } from "../new-patient-modal";
import { CompositePanel } from "./composite-panel";
import { PnbForecastPanel } from "./pnb-forecast";
import { RehabHub } from "./rehab-hub";
import { TestRunner } from "./test-runner";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("uz-UZ", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type ActiveTp = Timepoint | "latest";

const TP_OPTIONS: { id: ActiveTp; label: string; sub: string }[] = [
  { id: "PreOp", label: "PreOp", sub: "Operatsiyagacha" },
  { id: "PostOp", label: "PostOp", sub: "7–10 kun keyin" },
  { id: "PostTx", label: "PostTx", sub: "Davolashdan keyin" },
  { id: "latest", label: "So'nggi", sub: "Eng yangi" },
];

export function PatientDetail({ bundle }: { bundle: PatientDetailBundle }) {
  const t = useTranslations("PatientView");
  const router = useRouter();
  const { patient, results, training } = bundle;
  const [activeTest, setActiveTest] = useState<TestName | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [tp, setTp] = useState<ActiveTp>("latest");
  const [, startTransition] = useTransition();

  // Tanlangan bosqich (timepoint) bo'yicha har test uchun summary.
  // "latest" — har test bo'yicha eng yangi natija (completedAt bo'yicha).
  const summaries = useMemo(() => {
    const map: Partial<Record<TestName, TestSummary>> = {};
    const at: Partial<Record<TestName, string>> = {};
    for (const r of results) {
      if (tp !== "latest" && r.timepoint !== tp) continue;
      const prev = at[r.test];
      if (!prev || new Date(r.completedAt) > new Date(prev)) {
        map[r.test] = r.scored as TestSummary;
        at[r.test] = r.completedAt;
      }
    }
    return map;
  }, [results, tp]);

  // Tanlangan bosqichda bajarilgan testlar
  const completedTests = new Set(Object.keys(summaries) as TestName[]);
  // Qaysi bosqichlarda umuman ma'lumot bor (switcher uchun)
  const tpsWithData = new Set(results.map((r) => r.timepoint));

  const initials = patient.fish
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("");

  // ── Test overlay (to'liq ekran) ────────────────────────────
  if (activeTest) {
    const enginePatient = {
      yosh: patient.yosh,
      jinsi: (patient.jinsi === "Ayol" ? "Ayol" : "Erkak") as "Erkak" | "Ayol",
      premorbid: (patient.premorbid > 0 ? 1 : 0) as 0 | 1,
      davom: patient.davom,
      prep: patient.prep,
    };
    return (
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6">
        <TestRunner
          test={activeTest}
          patient={enginePatient}
          onAbort={() => setActiveTest(null)}
          onFinish={(raw) => {
            startTransition(async () => {
              await saveTestResult({
                patientId: patient.id,
                test: activeTest,
                raw: raw as never,
              });
              setActiveTest(null);
              router.refresh();
            });
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-6">
      <div className="mb-4">
        <Link href="/bemorlar">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("back")}
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
        {/* ── Left: demographics ──────────────────────────── */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-20">
          <Card className="p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-14 w-14 rounded-pill bg-primary-soft text-primary-press grid place-items-center font-bold text-lg">
                {initials}
              </div>
              <div>
                <div className="font-bold text-lg tracking-tight text-ink">{patient.fish}</div>
                <div className="text-[13px] text-ink-3 mt-0.5">
                  {t("registered")} {fmtDate(patient.sana)}
                </div>
              </div>
            </div>

            <div className="h-px bg-divider" />

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 m-0">
              <Field label={t("sex")}>
                <span className="inline-flex items-center gap-1.5 font-medium text-[13px] text-ink">
                  <User className="h-3.5 w-3.5 text-ink-3" />
                  {patient.jinsi}
                </span>
              </Field>
              <Field label={t("age")}>{patient.yosh}</Field>
              <Field label={t("birthDate")}>{fmtDate(patient.tugilgan)}</Field>
              <Field label={t("premorbid")}>
                {patient.premorbid > 0 ? (
                  <Pill tone="warn" dot>
                    {t("premorbidOn")}
                  </Pill>
                ) : (
                  <Pill tone="ok" dot>
                    {t("premorbidOff")}
                  </Pill>
                )}
              </Field>
              <Field label={t("duration")}>
                {patient.davom} {t("durationUnit")}
              </Field>
              <Field label={t("prepCount")} mono>
                {patient.prep}
              </Field>
            </dl>

            {patient.boshlanish || patient.tugash ? (
              <>
                <div className="h-px bg-divider" />
                <div>
                  <div className="eyebrow mb-2">{t("operationTimes")}</div>
                  <div className="flex flex-col gap-1.5">
                    {patient.boshlanish ? (
                      <div className="flex items-center gap-2 text-[13px]">
                        <Play className="h-3.5 w-3.5 text-ok" />
                        <span className="text-ink-3">{t("start")}:</span>
                        <span className="font-mono tabular-nums text-ink">
                          {fmtDateTime(patient.boshlanish)}
                        </span>
                      </div>
                    ) : null}
                    {patient.tugash ? (
                      <div className="flex items-center gap-2 text-[13px]">
                        <Square className="h-3.5 w-3.5 text-err" />
                        <span className="text-ink-3">{t("end")}:</span>
                        <span className="font-mono tabular-nums text-ink">
                          {fmtDateTime(patient.tugash)}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </>
            ) : null}

            <div className="h-px bg-divider" />

            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 justify-center"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
                {t("edit")}
              </Button>
              <Link href={`/bemorlar/${patient.id}/hisobot`} className="flex-1">
                <Button variant="secondary" size="sm" className="w-full justify-center">
                  <Download className="h-3.5 w-3.5" />
                  {t("export")}
                </Button>
              </Link>
            </div>
          </Card>

          <NewPatientModal
            open={editOpen}
            onOpenChange={setEditOpen}
            initial={{
              id: patient.id,
              fish: patient.fish,
              jinsi: patient.jinsi,
              tugilgan: patient.tugilgan,
              premorbid: patient.premorbid,
              prep: patient.prep,
              boshlanish: patient.boshlanish,
              tugash: patient.tugash,
            }}
          />
        </div>

        {/* ── Right: tabs ─────────────────────────────────── */}
        <Tabs defaultValue="tests" className="flex flex-col gap-2">
          <TabsList className="self-start">
            <TabsTrigger value="tests">
              <ClinicalIcon name="clipboard-list" size={15} />
              {t("tabs.diagnostic")}
              <span className="font-mono text-[11px] px-1.5 rounded-pill bg-ink/5 text-ink-3 tabular-nums">
                {completedTests.size} / {TESTS.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="forecast">
              <ClinicalIcon name="trending-up" size={15} />
              {t("tabs.forecast")}
            </TabsTrigger>
            <TabsTrigger value="rehab">
              <ClinicalIcon name="brain" size={15} />
              {t("tabs.rehab")}
              {training.length > 0 ? (
                <span className="font-mono text-[11px] px-1.5 rounded-pill bg-primary-soft text-primary-press tabular-nums">
                  {training.length} {t("sessions")}
                </span>
              ) : null}
            </TabsTrigger>
          </TabsList>

          {/* Diagnostik testlar */}
          <TabsContent value="tests" className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight m-0">{t("diagnosticTitle")}</h2>
                <p className="text-[13px] text-ink-3 mt-1">{t("diagnosticSubtitle")}</p>
              </div>
              <div className="text-[13px] text-ink-3">
                <b className="text-ink">{completedTests.size}</b> / {TESTS.length}{" "}
                {t("completedCount")}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {TESTS.map((test) => (
                <TestCard
                  key={test.id}
                  test={test}
                  done={completedTests.has(test.id)}
                  onStart={() => setActiveTest(test.id)}
                />
              ))}
            </div>

            <div className="mt-2">
              <CompositePanel results={results} patient={patient} />
            </div>
          </TabsContent>

          {/* PNB prognozi */}
          <TabsContent value="forecast">
            <PnbForecastPanel patient={patient} />
          </TabsContent>

          {/* Reabilitatsiya */}
          <TabsContent value="rehab">
            <RehabHub patientId={patient.id} training={training} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  mono = false,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider font-semibold text-ink-3 mb-1">
        {label}
      </dt>
      <dd className={`m-0 text-sm text-ink font-medium ${mono ? "font-mono tabular-nums" : ""}`}>
        {children}
      </dd>
    </div>
  );
}

function TestCard({
  test,
  done,
  onStart,
}: {
  test: (typeof TESTS)[number];
  done: boolean;
  onStart: () => void;
}) {
  const t = useTranslations("PatientView");
  return (
    <button
      type="button"
      onClick={onStart}
      className="text-left bg-surface border border-border rounded-lg p-[18px] flex flex-col gap-3 shadow-xs cursor-pointer transition-[transform,box-shadow,border-color] duration-150 hover:shadow-md hover:border-border-strong hover:-translate-y-0.5"
    >
      <div className="flex items-center justify-between">
        <div
          className="h-12 w-12 rounded-xl grid place-items-center"
          style={{ background: test.soft, color: test.color }}
        >
          <ClinicalIcon name={test.icon} size={24} />
        </div>
        {done ? (
          <Pill tone="ok" dot>
            {t("done")}
          </Pill>
        ) : null}
      </div>
      <div>
        <div className="font-bold text-base text-ink tracking-tight">{test.name}</div>
        <div className="font-mono text-[11px] text-ink-3 mt-0.5 uppercase tracking-wider">
          {test.short} · {test.duration}
        </div>
      </div>
      <p className="text-[13px] leading-relaxed text-ink-2 m-0">{test.desc}</p>
      <div
        className="flex items-center gap-1.5 font-semibold text-[13px] mt-auto pt-1.5"
        style={{ color: test.color }}
      >
        {done ? t("retakeTest") : t("startTest")}
        <ArrowRight className="h-3.5 w-3.5" />
      </div>
    </button>
  );
}
