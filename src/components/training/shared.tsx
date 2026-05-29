"use client";

import { ClinicalIcon } from "@/components/clinical-icon";
import type { MetricSpec } from "@/components/tests/shared";
import { TestMetric } from "@/components/tests/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { EnginePatient } from "@/lib/engines/types";
import type { ExerciseMeta } from "@/lib/training/meta";
import { cn } from "@/lib/utils";
import { CheckCircle2, Play, RotateCw, X } from "lucide-react";
import type { ReactNode } from "react";

export type TrainingPatient = EnginePatient & { fish?: string; id?: string };
export type TrainingPhase = "intro" | "running" | "done";

export interface TrainingResult {
  exerciseId: string;
  score: number;
  accuracy: number; // 0–1
  duration: number; // ms
  level?: number;
  raw?: Record<string, unknown>;
}

export interface TrainingComponentProps {
  patient: TrainingPatient;
  onAbort: () => void;
  onFinish: (result: TrainingResult) => void | Promise<void>;
}

/** Config bilan boshqariladigan dvigatel komponentlari uchun props. */
export interface EngineComponentProps extends TrainingComponentProps {
  exercise: ExerciseMeta;
}

export function TrainingShell({
  exercise,
  patient,
  phase,
  onAbort,
  intro,
  body,
  done,
  hint,
  metrics,
}: {
  exercise: ExerciseMeta;
  patient: TrainingPatient;
  phase: TrainingPhase;
  onAbort: () => void;
  intro: ReactNode;
  body: ReactNode;
  done: ReactNode;
  hint?: ReactNode;
  metrics?: MetricSpec[];
}) {
  return (
    <Card className="overflow-hidden flex flex-col min-h-[70vh]">
      <header className="min-h-14 sm:h-16 px-4 sm:px-6 py-2.5 sm:py-0 bg-surface border-b border-border flex items-center flex-wrap gap-x-4 gap-y-2">
        <div
          className="h-9 w-9 rounded-[10px] grid place-items-center"
          style={{ background: exercise.soft, color: exercise.color }}
        >
          <ClinicalIcon name={exercise.icon} size={18} />
        </div>
        <div>
          <div className="font-bold text-[15px] text-ink tracking-tight">{exercise.name}</div>
          <div className="text-xs text-ink-3">
            Kognitiv trening{patient.fish ? ` · ${patient.fish}` : ""}
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
        <Button variant="secondary" size="sm" onClick={onAbort} className="ml-auto sm:ml-0">
          <X className="h-3.5 w-3.5" />
          Chiqish
        </Button>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-auto">
        {phase === "intro" ? intro : phase === "done" ? done : body}
      </div>

      {hint && phase === "running" ? (
        <div className="px-4 sm:px-6 py-3 bg-surface border-t border-border flex items-center justify-center gap-4 text-sm text-ink-2 text-center">
          {hint}
        </div>
      ) : null}
    </Card>
  );
}

export function TrainingIntro({
  exercise,
  description,
  instructions,
  duration,
  onStart,
}: {
  exercise: ExerciseMeta;
  description: string;
  instructions: string[];
  duration: string;
  onStart: () => void;
}) {
  return (
    <div className="bg-surface border border-border rounded-lg shadow-md max-w-[580px] w-full p-6 sm:p-9 flex flex-col gap-4">
      <div className="flex items-center gap-3.5">
        <div
          className="h-16 w-16 rounded-[16px] grid place-items-center"
          style={{ background: exercise.soft, color: exercise.color }}
        >
          <ClinicalIcon name={exercise.icon} size={32} />
        </div>
        <div>
          <div className="eyebrow">Kognitiv trening · {exercise.domain}</div>
          <h2 className="font-bold text-2xl tracking-tight text-ink mt-1">{exercise.name}</h2>
        </div>
      </div>
      <p className="text-[15px] leading-relaxed text-ink-2 m-0">{description}</p>
      <ul className="list-none p-0 m-0 flex flex-col gap-2">
        {instructions.map((s, i) => (
          <li key={s} className="flex items-start gap-2.5">
            <span
              className="shrink-0 h-[22px] w-[22px] rounded-pill inline-flex items-center justify-center font-bold text-xs mt-px"
              style={{ background: exercise.soft, color: exercise.color }}
            >
              {i + 1}
            </span>
            <span className="text-sm leading-relaxed text-ink-2">{s}</span>
          </li>
        ))}
      </ul>
      <div className="px-3 py-2.5 rounded-[10px] bg-primary-soft-2 text-primary-press text-[13px] flex items-center gap-2">
        <ClinicalIcon name="clock" size={14} />
        Seans davomiyligi taxminan <b>{duration}</b>
      </div>
      <Button size="lg" onClick={onStart} className="justify-center mt-1.5">
        <Play className="h-4 w-4" />
        Mashqni boshlash
      </Button>
    </div>
  );
}

export function TrainingDone({
  score,
  accuracy,
  duration,
  level,
  onAgain,
  onBack,
  saving = false,
}: {
  score: number;
  accuracy: number | null;
  duration: number;
  level?: number;
  onAgain: () => void;
  onBack: () => void;
  saving?: boolean;
}) {
  return (
    <div className="bg-surface border border-border rounded-lg shadow-md max-w-[520px] w-full p-6 sm:p-9 flex flex-col gap-4 items-center text-center">
      <div className="h-[88px] w-[88px] rounded-pill bg-ok-bg text-green-900 grid place-items-center">
        <CheckCircle2 className="h-12 w-12" />
      </div>
      <div>
        <div className="eyebrow">Seans yakunlandi</div>
        <div className="font-bold text-2xl tracking-tight text-ink mt-1.5">Yaxshi ish!</div>
      </div>
      <div className="grid grid-cols-3 gap-2.5 w-full">
        <Stat label="Ball" value={score} />
        <Stat label="Aniqlik" value={accuracy != null ? `${Math.round(accuracy * 100)}%` : "—"} />
        <Stat label="Vaqt" value={`${Math.round(duration / 1000)} s`} />
      </div>
      {level != null ? (
        <div className="text-[13px] text-ink-3">
          Erishilgan daraja: <b className="text-ink">{level}</b>
        </div>
      ) : null}
      <div className="flex gap-2.5 w-full">
        <Button
          variant="secondary"
          className="flex-1 justify-center"
          onClick={onAgain}
          disabled={saving}
        >
          <RotateCw className="h-4 w-4" />
          Yana bir bor
        </Button>
        <Button className="flex-1 justify-center" onClick={onBack} disabled={saving}>
          {saving ? "Saqlanmoqda…" : "Saqlash va chiqish"}
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className={cn("p-3 bg-surface-2 border border-border rounded-[10px]")}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-3">{label}</div>
      <div className="font-bold text-[22px] tabular-nums text-ink mt-0.5">{value}</div>
    </div>
  );
}
