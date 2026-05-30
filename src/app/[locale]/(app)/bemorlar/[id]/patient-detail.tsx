"use client";

import { ClinicalIcon } from "@/components/clinical-icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { Link, useRouter } from "@/i18n/navigation";
import { forecast } from "@/lib/engines/prediction";
import type { TestName, TestSummary, Timepoint } from "@/lib/engines/types";
import type { PatientDetailBundle } from "@/lib/patients/detail";
import { saveTestResult } from "@/lib/tests/actions";
import { TESTS } from "@/lib/tests/meta";
import { TRAINING_DOMAINS, TRAINING_META } from "@/lib/training/meta";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Download,
  Pencil,
  Play,
  Square,
  TrendingUp,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { NewPatientModal } from "../new-patient-modal";
import { CompositePanel } from "./composite-panel";
import { PnbForecastPanel } from "./pnb-forecast";
import { RehabHub } from "./rehab-hub";
import { TestRunner } from "./test-runner";

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}
function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("uz-UZ", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type View = "hub" | "tests" | "forecast" | "rehab";

const TP_META: { id: Timepoint; label: string; sub: string; color: string }[] = [
  { id: "PreOp", label: "PreOp", sub: "Operatsiyagacha", color: "#0F766E" },
  { id: "PostOp", label: "PostOp", sub: "7–10 kun keyin", color: "#2563EB" },
  { id: "PostTx", label: "PostTx", sub: "Davolashdan keyin", color: "#9333EA" },
];
const TP_TESTS: Record<Timepoint, TestName[]> = {
  PreOp: ["TMT", "Stroop", "DST", "LMWT", "NS"],
  PostOp: ["TMT", "Stroop", "DST", "LMWT", "NS", "Audio", "EEG"],
  PostTx: ["TMT", "Stroop", "DST", "LMWT", "NS", "Audio", "EEG"],
};
const CORE: TestName[] = ["Stroop", "TMT", "DST", "LMWT"];

function zChip(done: boolean, z: number | null | undefined) {
  if (!done) return { bg: "var(--color-surface-3)", fg: "var(--color-ink-4)", dashed: true };
  if (z == null || Number.isNaN(z))
    return { bg: "var(--color-surface-3)", fg: "var(--color-ink-3)", dashed: false };
  if (z <= -1.96) return { bg: "var(--color-err-bg)", fg: "var(--color-err)", dashed: false };
  if (z < -1.0) return { bg: "var(--color-warn-bg)", fg: "var(--color-warn)", dashed: false };
  return { bg: "var(--color-ok-bg)", fg: "var(--color-ok)", dashed: false };
}

export function PatientDetail({ bundle }: { bundle: PatientDetailBundle }) {
  const t = useTranslations("PatientView");
  const router = useRouter();
  const { patient, results, training } = bundle;
  const [activeTest, setActiveTest] = useState<TestName | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [view, setView] = useState<View>("hub");
  const [tp, setTp] = useState<Timepoint>("PreOp");
  const [, startTransition] = useTransition();

  // test|tp → eng yangi summary
  const byTpTest = useMemo(() => {
    const map = new Map<string, { summary: TestSummary; at: string }>();
    for (const r of results) {
      const key = `${r.test}|${r.timepoint}`;
      const prev = map.get(key);
      if (!prev || new Date(r.completedAt) > new Date(prev.at)) {
        map.set(key, { summary: r.scored as TestSummary, at: r.completedAt });
      }
    }
    return map;
  }, [results]);

  const summaryFor = (test: TestName, timepoint: Timepoint) =>
    byTpTest.get(`${test}|${timepoint}`)?.summary;
  const tpCount = (timepoint: Timepoint) =>
    TP_TESTS[timepoint].filter((id) => byTpTest.has(`${id}|${timepoint}`)).length;
  const tpIspcd = (timepoint: Timepoint) => {
    const below = CORE.filter((id) => {
      const z = summaryFor(id, timepoint)?.zScore;
      return typeof z === "number" && z <= -1.96;
    }).length;
    return below >= 2;
  };

  // tanlangan bosqich uchun summaries (CompositePanel + test grid)
  const tpSummaries = useMemo(() => {
    const m: Partial<Record<TestName, TestSummary>> = {};
    for (const id of TP_TESTS[tp]) {
      const s = summaryFor(id, tp);
      if (s) m[id] = s;
    }
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [byTpTest, tp]);

  const totalTests = TP_META.reduce((a, m) => a + TP_TESTS[m.id].length, 0);
  const doneTests = TP_META.reduce((a, m) => a + tpCount(m.id), 0);
  const overallPct = totalTests ? Math.round((doneTests / totalTests) * 100) : 0;

  const fc = useMemo(
    () =>
      patient.davom > 0
        ? forecast({
            yosh: patient.yosh,
            premorbid: (patient.premorbid > 0 ? 1 : 0) as 0 | 1,
            davom: patient.davom,
            prep: patient.prep,
          })
        : null,
    [patient],
  );

  const rehab = useMemo(() => {
    const doneIds = new Set(training.map((s) => s.exerciseId));
    const totalEx = Object.keys(TRAINING_META).length;
    const domains = TRAINING_DOMAINS.map((d) => {
      const exs = Object.values(TRAINING_META).filter((e) => e.domain === d.name);
      return {
        name: d.name,
        color: d.color,
        done: exs.filter((e) => doneIds.has(e.id)).length,
        total: exs.length,
      };
    });
    const doneEx = doneIds.size;
    const totalMin = Math.round(training.reduce((a, s) => a + (s.duration || 0), 0) / 60);
    return { doneEx, totalEx, pct: Math.round((doneEx / totalEx) * 100), domains, totalMin };
  }, [training]);

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
              await saveTestResult({ patientId: patient.id, test: activeTest, raw: raw as never });
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => (view === "hub" ? router.push("/bemorlar") : setView("hub"))}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {view === "hub" ? t("back") : t("backToModules")}
        </Button>
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

        {/* ── Right: hub / sub-views ──────────────────────── */}
        <div className="flex flex-col gap-3.5">
          {view === "hub" ? (
            <>
              {/* Diagnostik testlar card */}
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <span className="h-11 w-11 rounded-xl grid place-items-center bg-primary-soft text-primary shrink-0">
                    <ClinicalIcon name="clipboard-list" size={22} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-lg tracking-tight text-ink">
                      {t("diagnosticTitle")}
                    </div>
                    <div className="text-[13px] text-ink-3">{t("hubTestsSub")}</div>
                  </div>
                  <ProgressRing pct={overallPct} done={doneTests} total={totalTests} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {TP_META.map((m) => (
                    <TimepointEntryCard
                      key={m.id}
                      meta={m}
                      count={tpCount(m.id)}
                      total={TP_TESTS[m.id].length}
                      ispcd={tpIspcd(m.id)}
                      statuses={TP_TESTS[m.id].map((id) => {
                        const s = summaryFor(id, m.id);
                        const meta = TESTS.find((x) => x.id === id);
                        return {
                          id,
                          short: meta?.short ?? id,
                          done: !!s,
                          z: s?.zScore,
                          score: s?.cogScore,
                        };
                      })}
                      onClick={() => {
                        setTp(m.id);
                        setView("tests");
                      }}
                      labelStart={t("beginStage")}
                      labelContinue={t("continue")}
                    />
                  ))}
                </div>
              </Card>

              {/* PNB + Rehab module cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={() => setView("forecast")}
                  className="text-left rounded-lg p-5 flex flex-col gap-3 shadow-xs cursor-pointer transition-[transform,box-shadow] hover:shadow-md hover:-translate-y-0.5"
                  style={(() => {
                    // Bashorat ehtimoliga ko'ra tint: <51 default · 51–80 warn · 81+ err
                    const p = fc ? Math.round(fc.composite.risk.prob * 100) : null;
                    const tone = p == null ? null : p >= 81 ? "err" : p >= 51 ? "warn" : null;
                    return {
                      background:
                        tone === "err"
                          ? "var(--color-err-bg)"
                          : tone === "warn"
                            ? "var(--color-warn-bg)"
                            : "var(--color-surface)",
                      border: `1px solid ${
                        tone === "err"
                          ? "var(--color-err)"
                          : tone === "warn"
                            ? "var(--color-warn)"
                            : "var(--color-border)"
                      }`,
                    };
                  })()}
                >
                  <div className="flex items-center gap-3">
                    <span className="h-12 w-12 rounded-[13px] grid place-items-center bg-accent-soft text-accent shrink-0">
                      <TrendingUp className="h-6 w-6" />
                    </span>
                    <div className="font-bold text-[17px] tracking-tight text-ink">
                      {t("pnbTitle")}
                    </div>
                  </div>
                  {fc ? (
                    <div className="grid grid-cols-2 gap-2.5 border-t border-divider pt-3.5">
                      <MiniMetric
                        label={t("pnbProbLabel")}
                        value={`${Math.round(fc.composite.risk.prob * 100)}%`}
                        sub="LR"
                        color={
                          fc.composite.risk.prob >= 0.7
                            ? "var(--color-err)"
                            : fc.composite.risk.prob >= 0.45
                              ? "var(--color-warn)"
                              : "var(--color-ok)"
                        }
                      />
                      <MiniMetric
                        label={t("pnbCogLabel")}
                        value={`${Math.round(fc.composite.severity.score)}`}
                        sub="MLR · /100"
                        color="var(--color-accent)"
                      />
                    </div>
                  ) : (
                    <p className="text-[13px] leading-relaxed text-ink-2 m-0 border-t border-divider pt-3">
                      {t("pnbEmpty")}
                    </p>
                  )}
                  <div className="inline-flex items-center gap-1.5 font-bold text-[13px] text-accent mt-auto pt-1">
                    {t("fullAnalysis")} <ArrowRight className="h-4 w-4" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setView("rehab")}
                  className="text-left bg-surface border border-border rounded-lg p-5 flex flex-col gap-3 shadow-xs cursor-pointer transition-[transform,box-shadow] hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-3.5">
                    <span
                      className="h-[52px] w-[52px] rounded-[14px] grid place-items-center shrink-0"
                      style={{ background: "#EDE9FE", color: "#7C3AED" }}
                    >
                      <ClinicalIcon name="brain" size={26} />
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-[17px] tracking-tight text-ink">
                        {t("rehabModuleTitle")}
                      </div>
                      <p className="text-[13px] leading-snug text-ink-2 m-0 mt-0.5">
                        {t("rehabModuleDesc")}
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-divider pt-2.5 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[12.5px] font-bold text-ink tabular-nums">
                        {rehab.doneEx}/{rehab.totalEx} · {rehab.pct}%
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-ink-3 tabular-nums">
                        <Clock className="h-3.5 w-3.5" /> {rehab.totalMin} daq
                      </span>
                    </div>
                    <div className="h-1.5 rounded-pill bg-surface-2 overflow-hidden">
                      <div
                        className="h-full transition-[width]"
                        style={{ width: `${rehab.pct}%`, background: "#7C3AED" }}
                      />
                    </div>
                  </div>
                  <div
                    className="inline-flex items-center gap-1.5 font-bold text-[13px] mt-auto pt-1"
                    style={{ color: "#7C3AED" }}
                  >
                    {t("continueCta")} <ArrowRight className="h-4 w-4" />
                  </div>
                </button>
              </div>
            </>
          ) : null}

          {view === "tests" ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-baseline justify-between">
                <h2 className="text-xl font-bold tracking-tight m-0">
                  {TP_META.find((m) => m.id === tp)?.label}{" "}
                  <span className="text-ink-3 font-medium text-base">{t("stage")}</span>
                </h2>
                <div className="text-[13px] text-ink-3">
                  <b className="text-ink">{tpCount(tp)}</b> / {TP_TESTS[tp].length}{" "}
                  {t("completedCount")}
                </div>
              </div>

              {/* timepoint switcher */}
              <div className="flex gap-1.5">
                {TP_META.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setTp(m.id)}
                    className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold border transition-colors ${
                      tp === m.id
                        ? "bg-primary text-white border-primary"
                        : "bg-surface text-ink-2 border-border hover:bg-surface-2"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {TP_TESTS[tp].map((id) => {
                  const test = TESTS.find((x) => x.id === id);
                  if (!test) return null;
                  return (
                    <TestCard
                      key={id}
                      test={test}
                      summary={summaryFor(id, tp)}
                      onStart={() => setActiveTest(id)}
                    />
                  );
                })}
              </div>

              <div className="mt-2">
                <CompositePanel summaries={tpSummaries} timepoint={tp} />
              </div>
            </div>
          ) : null}

          {view === "forecast" ? <PnbForecastPanel patient={patient} /> : null}
          {view === "rehab" ? <RehabHub patientId={patient.id} training={training} /> : null}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────

function ProgressRing({ pct, done, total }: { pct: number; done: number; total: number }) {
  const R = 18;
  const C = 2 * Math.PI * R;
  return (
    <div className="flex items-center gap-2.5 shrink-0">
      <div className="flex flex-col items-end leading-none">
        <span className="font-extrabold text-xl text-primary tracking-tight tabular-nums">
          {pct}%
        </span>
        <span className="font-mono text-[11px] font-semibold text-ink-3 tabular-nums mt-0.5">
          {done}/{total}
        </span>
      </div>
      <svg
        width="44"
        height="44"
        viewBox="0 0 44 44"
        className="shrink-0"
        role="img"
        aria-label={`${pct}%`}
      >
        <title>{`${pct}%`}</title>
        <circle cx="22" cy="22" r={R} fill="none" stroke="var(--color-surface-3)" strokeWidth="5" />
        <circle
          cx="22"
          cy="22"
          r={R}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - pct / 100)}
          transform="rotate(-90 22 22)"
        />
      </svg>
    </div>
  );
}

interface TpStatus {
  id: TestName;
  short: string;
  done: boolean;
  z?: number | null;
  score?: number | null;
}

function TimepointEntryCard({
  meta,
  count,
  total,
  ispcd,
  statuses,
  onClick,
  labelStart,
  labelContinue,
}: {
  meta: { id: Timepoint; label: string; sub: string; color: string };
  count: number;
  total: number;
  ispcd: boolean;
  statuses: TpStatus[];
  onClick: () => void;
  labelStart: string;
  labelContinue: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-xl p-4 flex flex-col gap-2.5 cursor-pointer transition-shadow hover:shadow-sm"
      style={{
        background: ispcd ? "var(--color-err-bg)" : "var(--color-surface-2)",
        border: `1px solid ${ispcd ? "var(--color-err)" : `${meta.color}33`}`,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-pill"
            style={{ background: ispcd ? "var(--color-err)" : meta.color }}
          />
          <span className="font-bold text-[15px] text-ink">{meta.label}</span>
        </span>
        {count > 0 ? (
          ispcd ? (
            <span className="px-2 py-0.5 rounded-pill bg-err text-white text-[11px] font-bold">
              {count}/{total} · PNB+
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-pill bg-ok-bg text-ok text-[11px] font-bold tabular-nums">
              {count}/{total}
            </span>
          )
        ) : null}
      </div>
      <div className="text-[12.5px] text-ink-3 leading-snug">{meta.sub}</div>
      <div className="flex flex-wrap gap-1">
        {statuses.map((s) => {
          const c = zChip(s.done, s.z);
          return (
            <span
              key={s.id}
              title={
                s.done
                  ? `${s.short}: ${s.score != null ? Math.round(s.score) : "—"} · Z ${s.z != null ? s.z.toFixed(2) : "—"}`
                  : `${s.short}`
              }
              className="inline-flex items-center font-mono font-bold text-[10.5px] px-1.5 py-0.5 rounded-md"
              style={{
                background: c.bg,
                color: c.fg,
                border: c.dashed ? "1px dashed var(--color-border-strong)" : "0",
              }}
            >
              {s.short}
              {s.done && s.score != null ? ` ${Math.round(s.score)}` : ""}
            </span>
          );
        })}
      </div>
      <div
        className="inline-flex items-center gap-1.5 font-bold text-[13px] mt-auto pt-0.5"
        style={{ color: ispcd ? "var(--color-err)" : meta.color }}
      >
        {count > 0 ? labelContinue : labelStart} <ArrowRight className="h-3.5 w-3.5" />
      </div>
    </button>
  );
}

function MiniMetric({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="bg-surface-2 rounded-[10px] px-3.5 py-3 flex flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-3">{label}</span>
      <span className="font-extrabold text-[17px] leading-none tabular-nums" style={{ color }}>
        {value}
      </span>
      <span className="text-[10.5px] text-ink-4">{sub}</span>
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
  summary,
  onStart,
}: {
  test: (typeof TESTS)[number];
  summary?: TestSummary;
  onStart: () => void;
}) {
  const t = useTranslations("PatientView");
  const done = !!summary;
  const toneBg = summary?.ispcd
    ? "var(--color-err-bg)"
    : summary?.tone === "warn"
      ? "var(--color-warn-bg)"
      : summary?.tone === "bad"
        ? "var(--color-err-bg)"
        : "var(--color-ok-bg)";
  const toneFg =
    summary?.ispcd || summary?.tone === "bad"
      ? "var(--color-err)"
      : summary?.tone === "warn"
        ? "var(--color-warn)"
        : "#166534";
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
        ) : (
          <Pill tone="neutral" dot>
            {t("notDone")}
          </Pill>
        )}
      </div>
      <div>
        <div className="font-bold text-base text-ink tracking-tight">{test.name}</div>
        <div className="font-mono text-[11px] text-ink-3 mt-0.5 uppercase tracking-wider">
          {test.short} · {test.duration}
        </div>
      </div>
      {summary ? (
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-[10px]"
          style={{ background: toneBg }}
        >
          <div className="flex flex-col">
            <span
              className="text-[10px] font-bold uppercase tracking-wider opacity-80"
              style={{ color: toneFg }}
            >
              CogScore
            </span>
            <span
              className="font-extrabold text-2xl leading-none tabular-nums"
              style={{ color: toneFg }}
            >
              {summary.cogScore != null ? Math.round(summary.cogScore) : "—"}
            </span>
          </div>
          <div className="w-px self-stretch" style={{ background: `${toneFg}22` }} />
          <div className="min-w-0">
            <div className="font-bold text-[13px]" style={{ color: toneFg }}>
              {summary.cognitiveHealth}
            </div>
            <div className="font-mono text-[11px] opacity-85" style={{ color: toneFg }}>
              Z = {summary.zScore != null ? summary.zScore.toFixed(2) : "—"}
              {summary.ispcd ? " · ISPOCD" : ""}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-[13px] leading-relaxed text-ink-2 m-0">{test.desc}</p>
      )}
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
