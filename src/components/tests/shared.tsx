"use client";

import { ClinicalIcon } from "@/components/clinical-icon";
import { ConfirmExitButton } from "@/components/confirm-exit-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { EnginePatient, TestName } from "@/lib/engines/types";
import { TEST_BY_ID } from "@/lib/tests/meta";
import { cn } from "@/lib/utils";
import { Info, Play } from "lucide-react";
import { type ReactNode, isValidElement } from "react";

export type TestPatient = EnginePatient & { fish?: string; id?: string };

export type TestPhase = "intro" | "running" | "done";

export interface TestComponentProps {
  patient: TestPatient;
  onAbort: () => void;
  onFinish: (raw: Record<string, unknown>) => void | Promise<void>;
}

// ─── Metric chip ──────────────────────────────────────────────
export interface MetricSpec {
  label: string;
  value: ReactNode;
  icon?: string;
  tone?: "neutral" | "err" | "ok" | "primary";
  mono?: boolean;
}

const METRIC_TONE: Record<NonNullable<MetricSpec["tone"]>, string> = {
  neutral: "bg-surface-2 text-ink-2",
  err: "bg-err-bg text-err",
  ok: "bg-ok-bg text-green-700",
  primary: "bg-primary-soft text-primary-press",
};

export function TestMetric({ label, value, icon, tone = "neutral", mono }: MetricSpec) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border",
        METRIC_TONE[tone],
      )}
    >
      {icon ? <ClinicalIcon name={icon} size={14} /> : null}
      <div className="flex flex-col leading-tight">
        <span className="font-semibold text-[9px] uppercase tracking-wider text-ink-3">
          {label}
        </span>
        <span className={cn("font-semibold text-sm text-ink tabular-nums", mono && "font-mono")}>
          {value}
        </span>
      </div>
    </div>
  );
}

// ─── Test shell (sub-header + body + hint) ────────────────────
export function TestShell({
  test,
  patient,
  phase,
  onAbort,
  intro,
  body,
  done,
  hint,
  metrics,
}: {
  test: TestName;
  patient: TestPatient;
  phase: TestPhase;
  onAbort: () => void;
  intro: ReactNode;
  body: ReactNode;
  done: ReactNode;
  hint?: ReactNode;
  metrics?: MetricSpec[];
}) {
  const meta = TEST_BY_ID[test];
  return (
    <Card className="overflow-hidden flex flex-col min-h-[70vh]">
      <header className="min-h-14 sm:h-16 px-4 sm:px-6 py-2.5 sm:py-0 bg-surface border-b border-border flex items-center flex-wrap gap-x-4 gap-y-2">
        <div
          className="h-9 w-9 rounded-[10px] grid place-items-center"
          style={{ background: meta.soft, color: meta.color }}
        >
          <ClinicalIcon name={meta.icon} size={18} />
        </div>
        <div>
          <div className="font-bold text-[15px] text-ink tracking-tight">{meta.name}</div>
          <div className="text-xs text-ink-3">
            {patient.fish ? `${patient.fish} · ` : ""}
            {patient.yosh} yosh
          </div>
        </div>
        <div className="hidden sm:block sm:flex-1" />
        {metrics?.length ? (
          <div className="order-last w-full sm:order-none sm:w-auto flex gap-2 overflow-x-auto sm:overflow-visible">
            {metrics.map((m) => (
              <TestMetric key={m.label} {...m} />
            ))}
          </div>
        ) : null}
        <ConfirmExitButton
          onConfirm={onAbort}
          confirm={phase === "running"}
          className="ml-auto sm:ml-0"
        />
      </header>

      {phase === "running" ? (
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          <TestGuide intro={intro} />
          <div className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-auto min-w-0">
            {body}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-auto">
          {phase === "intro" ? intro : done}
        </div>
      )}

      {hint && phase === "running" ? (
        <div className="px-4 sm:px-6 py-3 bg-surface border-t border-border flex items-center justify-center gap-4 text-sm text-ink-2 text-center">
          {hint}
        </div>
      ) : null}
    </Card>
  );
}

// ─── Guide rail (shown beside the test body while running) ────
function TestGuide({ intro }: { intro: ReactNode }) {
  const p = isValidElement(intro)
    ? (intro.props as { title?: string; description?: string; steps?: string[]; note?: string })
    : {};
  const steps = p.steps ?? [];
  if (!steps.length && !p.description) return null;
  return (
    <aside className="hidden md:block w-[290px] shrink-0 border-r border-border bg-surface-2 p-5 overflow-auto">
      <div className="eyebrow mb-2 flex items-center gap-1.5">
        <Info className="h-3.5 w-3.5" /> Yo'riqnoma
      </div>
      {p.title ? (
        <div className="font-bold text-[15px] text-ink tracking-tight mb-2">{p.title}</div>
      ) : null}
      {p.description ? (
        <p className="text-[13px] leading-relaxed text-ink-2 m-0 mb-3">{p.description}</p>
      ) : null}
      {steps.length ? (
        <ol className="list-none p-0 m-0 flex flex-col gap-2">
          {steps.map((s, i) => (
            <li key={s} className="flex items-start gap-2.5">
              <span className="shrink-0 h-5 w-5 rounded-pill bg-primary-soft text-primary-press inline-flex items-center justify-center font-bold text-[11px] mt-px">
                {i + 1}
              </span>
              <span className="text-[12.5px] leading-snug text-ink-2">{s}</span>
            </li>
          ))}
        </ol>
      ) : null}
      {p.note ? (
        <div className="mt-3 px-2.5 py-2 rounded-lg bg-warn-bg text-amber-900 text-xs flex gap-1.5">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          {p.note}
        </div>
      ) : null}
    </aside>
  );
}

// ─── Intro panel ──────────────────────────────────────────────
export function TestIntro({
  test,
  title,
  description,
  steps,
  note,
  onStart,
  ctaLabel = "Testni boshlash",
}: {
  test: TestName;
  title: string;
  description?: string;
  steps?: string[];
  note?: string;
  onStart: () => void;
  ctaLabel?: string;
}) {
  const meta = TEST_BY_ID[test];
  return (
    <div className="bg-surface border border-border rounded-lg shadow-md max-w-[620px] w-full p-6 sm:p-9 flex flex-col gap-4">
      <div className="flex items-center gap-3.5">
        <div
          className="h-14 w-14 rounded-[14px] grid place-items-center"
          style={{ background: meta.soft, color: meta.color }}
        >
          <ClinicalIcon name={meta.icon} size={28} />
        </div>
        <div>
          <div className="eyebrow">Diagnostik test</div>
          <h2 className="font-bold text-2xl tracking-tight text-ink mt-1">{title}</h2>
        </div>
      </div>

      {description ? (
        <p className="text-[15px] leading-relaxed text-ink-2 m-0">{description}</p>
      ) : null}

      {steps?.length ? (
        <ul className="list-none p-0 m-0 flex flex-col gap-2">
          {steps.map((s, i) => (
            <li key={s} className="flex items-start gap-2.5">
              <span className="shrink-0 h-[22px] w-[22px] rounded-pill bg-primary-soft text-primary-press inline-flex items-center justify-center font-bold text-xs mt-px">
                {i + 1}
              </span>
              <span className="text-sm leading-relaxed text-ink-2">{s}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {note ? (
        <div className="px-3 py-2.5 rounded-[10px] bg-warn-bg text-amber-900 text-[13px] flex items-center gap-2">
          <ClinicalIcon name="activity" size={14} />
          {note}
        </div>
      ) : null}

      <Button size="lg" onClick={onStart} className="justify-center mt-1.5">
        <Play className="h-4 w-4" />
        {ctaLabel}
      </Button>
    </div>
  );
}

// ─── Done panel ───────────────────────────────────────────────
export function TestDone({
  title = "Test yakunlandi",
  children,
  onSave,
  onRetry,
  saving = false,
}: {
  title?: string;
  children: ReactNode;
  onSave: () => void;
  onRetry?: () => void;
  saving?: boolean;
}) {
  return (
    <div className="bg-surface border border-border rounded-lg shadow-md max-w-[560px] w-full p-6 sm:p-9 flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-ok-bg text-ok grid place-items-center">
          <ClinicalIcon name="activity" size={24} />
        </div>
        <h2 className="font-bold text-2xl tracking-tight text-ink">{title}</h2>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
      <div className="flex gap-2 pt-2 border-t border-divider">
        {onRetry ? (
          <Button variant="secondary" onClick={onRetry} disabled={saving} className="flex-1">
            Qaytadan
          </Button>
        ) : null}
        <Button onClick={onSave} disabled={saving} className="flex-1 justify-center">
          {saving ? "Saqlanmoqda…" : "Natijani saqlash"}
        </Button>
      </div>
    </div>
  );
}
