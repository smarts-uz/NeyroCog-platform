"use client";

import { ClinicalIcon } from "@/components/clinical-icon";
import { TrainingRunner } from "@/components/training/training-runner";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { useRouter } from "@/i18n/navigation";
import type { TrainingRow } from "@/lib/patients/detail";
import { saveTrainingSession } from "@/lib/training/actions";
import {
  type ExerciseId,
  type ExerciseMeta,
  TRAINING_LIST,
  TRAINING_META,
  aggregateTraining,
} from "@/lib/training/meta";
import { ArrowRight, Brain } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

const TARGET_PER_EXERCISE = 12; // 4 hafta × 3/hafta

export function RehabHub({ patientId, training }: { patientId: string; training: TrainingRow[] }) {
  const router = useRouter();
  const [active, setActive] = useState<ExerciseId | null>(null);
  const [, startTransition] = useTransition();

  const agg = useMemo(
    () =>
      aggregateTraining(
        training.map((t) => ({
          exerciseId: t.exerciseId,
          score: t.score,
          accuracy: t.accuracy, // 0–100 (foiz) — avgAccuracy ham foizda chiqadi
          duration: t.duration,
          completedAt: t.completedAt,
        })),
      ),
    [training],
  );

  if (active) {
    return (
      <TrainingRunner
        exerciseId={active}
        patient={{ yosh: 0, premorbid: 0, davom: 0, prep: 0 }}
        onAbort={() => setActive(null)}
        onFinish={(result) => {
          startTransition(async () => {
            await saveTrainingSession({
              patientId,
              exerciseId: active,
              score: result.score,
              accuracy: result.accuracy,
              duration: result.duration,
              level: result.level,
              raw: result.raw,
            });
            setActive(null);
            router.refresh();
          });
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Protocol banner */}
      <Card
        className="p-5 border-primary/40"
        style={{ boxShadow: "0 0 0 4px rgba(15,118,110,0.06)" }}
      >
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary text-white grid place-items-center shrink-0">
            <Brain className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="eyebrow">2-Dastur · Raqamli kognitiv trening</div>
            <h3 className="font-bold text-lg tracking-tight text-ink mt-1.5">
              Operatsiyadan keyingi kognitiv reabilitatsiya
            </h3>
            <p className="text-[13px] leading-relaxed text-ink-2 mt-1.5">
              4 hafta · haftasiga 5–6 marta · har seans 15–20 daqiqa. Quyidagi 5 ta mashqdan birini
              tanlang.
            </p>
          </div>
          {agg ? (
            <div className="px-3.5 py-2.5 rounded-[10px] bg-surface border border-border flex flex-col items-end gap-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-3">
                Jami
              </span>
              <span className="font-bold text-xl text-ink tabular-nums">
                {agg.totalSessions}
                <span className="text-xs font-medium text-ink-3"> seans</span>
              </span>
              <span className="font-mono text-[11px] text-ink-3">{agg.totalMinutes} daq</span>
            </div>
          ) : null}
        </div>
      </Card>

      {/* Domain progress */}
      <Card className="p-5">
        <div className="eyebrow mb-3.5">Domenlar bo'yicha rivojlanish</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5">
          {TRAINING_LIST.map((exr) => {
            const done = agg?.byExercise[exr.id]?.sessions ?? 0;
            const pct = Math.min(100, (done / TARGET_PER_EXERCISE) * 100);
            return (
              <div key={exr.id}>
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className="h-6 w-6 rounded-md grid place-items-center shrink-0"
                    style={{ background: exr.soft, color: exr.color }}
                  >
                    <ClinicalIcon name={exr.icon} size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs text-ink leading-tight">{exr.name}</div>
                    <div className="text-[11px] text-ink-3 leading-tight">{exr.domain}</div>
                  </div>
                  <span className="font-mono text-[11px] text-ink-2 tabular-nums font-semibold shrink-0">
                    {done}/{TARGET_PER_EXERCISE}
                  </span>
                </div>
                <div className="h-[5px] rounded-pill bg-surface-2 overflow-hidden">
                  <div
                    className="h-full transition-[width]"
                    style={{ width: `${pct}%`, background: exr.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Exercise launcher */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {TRAINING_LIST.map((exr) => (
          <ExerciseCard
            key={exr.id}
            exercise={exr}
            sessions={agg?.byExercise[exr.id]?.sessions ?? 0}
            avgAccuracy={agg?.byExercise[exr.id]?.avgAccuracy ?? 0}
            avgScore={
              agg?.byExercise[exr.id]
                ? Math.round(
                    (agg.byExercise[exr.id]?.totalScore ?? 0) /
                      (agg.byExercise[exr.id]?.sessions ?? 1),
                  )
                : 0
            }
            onStart={() => setActive(exr.id)}
          />
        ))}
      </div>

      {/* Recent log */}
      {training.length > 0 ? (
        <Card className="p-0 overflow-hidden">
          <div className="px-4 py-3.5 border-b border-divider">
            <div className="eyebrow">Oxirgi seanslar</div>
          </div>
          <div>
            {training.slice(0, 6).map((s, i) => {
              const exr = TRAINING_META[s.exerciseId as ExerciseId];
              if (!exr) return null;
              return (
                <div
                  key={s.id}
                  className={`grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3.5 px-4 py-3 ${
                    i === 0 ? "" : "border-t border-divider"
                  }`}
                >
                  <div
                    className="h-8 w-8 rounded-lg grid place-items-center"
                    style={{ background: exr.soft, color: exr.color }}
                  >
                    <ClinicalIcon name={exr.icon} size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-ink">{exr.name}</div>
                    <div className="text-xs text-ink-3">{exr.domain}</div>
                  </div>
                  <div className="font-mono text-xs text-ink-3 tabular-nums">
                    {new Date(s.completedAt).toLocaleString("uz-UZ", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <Pill tone="ok" dot>
                    {s.accuracy}%
                  </Pill>
                  <span className="font-mono font-bold text-sm text-ink tabular-nums min-w-[60px] text-right">
                    {s.score} ball
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function ExerciseCard({
  exercise,
  sessions,
  avgAccuracy,
  avgScore,
  onStart,
}: {
  exercise: ExerciseMeta;
  sessions: number;
  avgAccuracy: number;
  avgScore: number;
  onStart: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onStart}
      className="text-left bg-surface border border-border rounded-lg p-[18px] flex flex-col gap-3 shadow-xs cursor-pointer transition-[transform,box-shadow,border-color] duration-150 hover:shadow-md hover:border-border-strong hover:-translate-y-0.5"
    >
      <div className="flex items-center justify-between">
        <div
          className="h-12 w-12 rounded-xl grid place-items-center"
          style={{ background: exercise.soft, color: exercise.color }}
        >
          <ClinicalIcon name={exercise.icon} size={24} />
        </div>
        {sessions > 0 ? (
          <Pill tone="ok" dot>
            {sessions}× bajarilgan
          </Pill>
        ) : null}
      </div>
      <div>
        <div
          className="font-mono text-[10px] uppercase tracking-wider font-semibold mb-0.5"
          style={{ color: exercise.color }}
        >
          {exercise.domain}
        </div>
        <div className="font-bold text-base text-ink tracking-tight">{exercise.name}</div>
        <div className="font-mono text-[11px] text-ink-3 mt-0.5">
          {exercise.short} · {exercise.duration}
        </div>
      </div>
      <p className="text-[13px] leading-relaxed text-ink-2 m-0">{exercise.description}</p>
      {sessions > 0 ? (
        <div className="flex gap-3 py-2 border-t border-divider mt-0.5 font-mono text-[11px] text-ink-3 tabular-nums">
          <span>
            Aniqlik: <b className="text-ink">{Math.round(avgAccuracy)}%</b>
          </span>
          <span>·</span>
          <span>
            O'rt ball: <b className="text-ink">{avgScore}</b>
          </span>
        </div>
      ) : null}
      <div
        className="flex items-center gap-1.5 font-semibold text-[13px] mt-auto pt-1"
        style={{ color: exercise.color }}
      >
        {sessions > 0 ? "Yangi seans boshlash" : "Boshlash"}
        <ArrowRight className="h-3.5 w-3.5" />
      </div>
    </button>
  );
}
