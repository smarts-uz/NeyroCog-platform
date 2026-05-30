"use client";

import { ClinicalIcon } from "@/components/clinical-icon";
import { TrainingRunner } from "@/components/training/training-runner";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { useRouter } from "@/i18n/navigation";
import type { TrainingRow } from "@/lib/patients/detail";
import { saveTrainingSession } from "@/lib/training/actions";
import {
  DAILY_GOAL,
  adaptExercise,
  computeStreak,
  deriveLevel,
  todayCount,
} from "@/lib/training/adaptive";
import {
  type ExerciseAgg,
  type ExerciseId,
  type ExerciseMeta,
  TRAINING_DOMAINS,
  TRAINING_LIST,
  TRAINING_META,
  aggregateTraining,
} from "@/lib/training/meta";
import { ArrowRight, Brain, ChevronDown, ChevronUp } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

export function RehabHub({ patientId, training }: { patientId: string; training: TrainingRow[] }) {
  const router = useRouter();
  const [active, setActive] = useState<ExerciseMeta | null>(null);
  const [openDomain, setOpenDomain] = useState<string | null>(TRAINING_DOMAINS[0]?.name ?? null);
  const [, startTransition] = useTransition();

  const agg = useMemo(
    () =>
      aggregateTraining(
        training.map((t) => ({
          exerciseId: t.exerciseId,
          score: t.score,
          accuracy: t.accuracy, // 0–100 (foiz)
          duration: t.duration,
          completedAt: t.completedAt,
        })),
      ),
    [training],
  );

  const today = new Date().toISOString().slice(0, 10);
  const doneToday = todayCount(
    training.map((t) => t.completedAt),
    today,
  );
  const streak = computeStreak(training.map((t) => t.completedAt));
  const goalPct = Math.min(100, (doneToday / DAILY_GOAL) * 100);

  const doneEx = TRAINING_LIST.filter((ex) => (agg?.byExercise[ex.id]?.sessions ?? 0) > 0).length;
  const totalEx = TRAINING_LIST.length;

  const launch = (exr: ExerciseMeta) => {
    const history = training
      .filter((t) => t.exerciseId === exr.id)
      .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
      .map((t) => t.accuracy / 100);
    const level = deriveLevel(history);
    setActive(adaptExercise(exr, level));
  };

  if (active) {
    return (
      <TrainingRunner
        exercise={active}
        patient={{ yosh: 0, premorbid: 0, davom: 0, prep: 0 }}
        onAbort={() => setActive(null)}
        onFinish={(result) => {
          startTransition(async () => {
            await saveTrainingSession({
              patientId,
              exerciseId: active.id as ExerciseId,
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
        className="p-5"
        style={{
          background:
            "linear-gradient(135deg, var(--color-primary-soft-2) 0%, var(--color-surface) 100%)",
        }}
      >
        <div className="flex items-start gap-4 flex-wrap">
          <div className="h-12 w-12 rounded-xl bg-primary text-white grid place-items-center shrink-0">
            <Brain className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="eyebrow">2-Dastur · Raqamli kognitiv trening</div>
            <h3 className="font-bold text-lg tracking-tight text-ink mt-1.5">
              Operatsiyadan keyingi kognitiv reabilitatsiya
            </h3>
            <p className="text-[13px] leading-relaxed text-ink-2 mt-1.5">
              4 hafta · haftasiga 5–6 marta · har seans 15–20 daqiqa.{" "}
              <b className="text-ink">
                {TRAINING_DOMAINS.length} domen · {totalEx} ta mashq.
              </b>
            </p>
          </div>
          <div className="px-3.5 py-2.5 rounded-[10px] bg-surface border border-border flex gap-[18px]">
            <MiniStat label="Mashqlar" value={`${doneEx}/${totalEx}`} />
            <MiniStat label="Seanslar" value={agg?.totalSessions ?? 0} />
            <MiniStat label="Daqiqa" value={agg?.totalMinutes ?? 0} />
            <MiniStat label="Streak" value={streak} />
          </div>
        </div>

        {/* Daily goal */}
        <div className="mt-3.5">
          <div className="flex justify-between mb-1.5">
            <span className="text-[13px] font-semibold text-ink-2">Bugungi maqsad</span>
            <span
              className="text-[13px] font-bold tabular-nums"
              style={{ color: doneToday >= DAILY_GOAL ? "var(--color-ok)" : "var(--color-ink)" }}
            >
              {doneToday} / {DAILY_GOAL} mashq {doneToday >= DAILY_GOAL ? "✓" : ""}
            </span>
          </div>
          <div className="h-2 rounded-pill bg-surface-2 overflow-hidden">
            <div
              className="h-full transition-[width]"
              style={{
                width: `${goalPct}%`,
                background: doneToday >= DAILY_GOAL ? "var(--color-ok)" : "var(--color-primary)",
              }}
            />
          </div>
        </div>
      </Card>

      {/* Domain cards — responsive multi-column grid; ochilgani to'liq enga yoyiladi */}
      <div
        className="grid gap-3.5 items-start"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}
      >
        {TRAINING_DOMAINS.map((dom) => {
          const list = TRAINING_LIST.filter((ex) => ex.domain === dom.name);
          const domDone = list.filter((ex) => (agg?.byExercise[ex.id]?.sessions ?? 0) > 0).length;
          const open = openDomain === dom.name;
          const complete = domDone === list.length && list.length > 0;
          return (
            <Card
              key={dom.name}
              className="overflow-hidden p-0 transition-colors"
              style={{
                gridColumn: open ? "1 / -1" : "auto",
                borderColor: open ? `${dom.color}55` : undefined,
              }}
            >
              <button
                type="button"
                onClick={() => setOpenDomain(open ? null : dom.name)}
                className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left cursor-pointer"
              >
                <div
                  className="h-[42px] w-[42px] rounded-[11px] grid place-items-center shrink-0"
                  style={{ background: dom.soft, color: dom.color }}
                >
                  <ClinicalIcon name={dom.icon} size={21} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[14.5px] text-ink leading-tight">{dom.name}</div>
                  <div className="text-xs text-ink-3">{list.length} ta mashq</div>
                </div>
                <span
                  className="font-bold text-[12.5px] tabular-nums px-2.5 py-0.5 rounded-pill shrink-0"
                  style={{
                    background: complete ? "var(--color-ok-bg)" : "var(--color-surface-2)",
                    color: complete ? "var(--color-ok)" : "var(--color-ink-3)",
                  }}
                >
                  {domDone}/{list.length}
                </span>
                {open ? (
                  <ChevronUp className="h-[18px] w-[18px] text-ink-3 shrink-0" />
                ) : (
                  <ChevronDown className="h-[18px] w-[18px] text-ink-3 shrink-0" />
                )}
              </button>

              {/* Mini progress bar — yopiq holatdagi ko'rsatkich */}
              {!open ? (
                <div className="h-1 bg-surface-2 mx-4 mb-3.5 rounded-pill overflow-hidden">
                  <div
                    className="h-full transition-[width] duration-300"
                    style={{
                      width: `${list.length ? (domDone / list.length) * 100 : 0}%`,
                      background: complete ? "var(--color-ok)" : dom.color,
                    }}
                  />
                </div>
              ) : null}

              {open ? (
                <div
                  className="grid gap-3 px-4 pb-4"
                  style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}
                >
                  {list.map((ex) => (
                    <ExerciseCard
                      key={ex.id}
                      exercise={ex}
                      stat={agg?.byExercise[ex.id]}
                      onStart={() => launch(ex)}
                    />
                  ))}
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>

      {/* Recent sessions log */}
      {training.length > 0 ? (
        <Card className="p-0 overflow-hidden">
          <div className="px-4 py-3.5 border-b border-divider">
            <div className="eyebrow">Oxirgi seanslar</div>
          </div>
          <div>
            {training.slice(0, 6).map((s, i) => {
              const ex = TRAINING_META[s.exerciseId as keyof typeof TRAINING_META];
              if (!ex) return null;
              return (
                <div
                  key={s.id}
                  className={`grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3.5 px-4 py-3 ${
                    i === 0 ? "" : "border-t border-divider"
                  }`}
                >
                  <div
                    className="h-8 w-8 rounded-lg grid place-items-center"
                    style={{ background: ex.soft, color: ex.color }}
                  >
                    <ClinicalIcon name={ex.icon} size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-ink">{ex.name}</div>
                    <div className="text-xs text-ink-3">{ex.domain}</div>
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

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-bold text-lg text-ink tabular-nums">{value}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-3">{label}</span>
    </div>
  );
}

function ExerciseCard({
  exercise,
  stat,
  onStart,
}: {
  exercise: ExerciseMeta;
  stat?: ExerciseAgg;
  onStart: () => void;
}) {
  const sessions = stat?.sessions ?? 0;
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
      {stat ? (
        <div className="flex gap-3 py-2 border-t border-divider mt-0.5 font-mono text-[11px] text-ink-3 tabular-nums">
          <span>
            Aniqlik: <b className="text-ink">{Math.round(stat.avgAccuracy)}%</b>
          </span>
          <span>·</span>
          <span>
            O'rt ball: <b className="text-ink">{Math.round(stat.totalScore / stat.sessions)}</b>
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
