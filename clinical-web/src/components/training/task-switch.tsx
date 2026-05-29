"use client";

import { TRAINING_META } from "@/lib/training/meta";
import { Repeat } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { TrainingComponentProps, TrainingResult } from "./shared";
import { TrainingDone, TrainingIntro, TrainingShell } from "./shared";

const TS_TRIALS = 24;
const TS_TIMEOUT = 4500;
const ex = TRAINING_META.taskSwitch;

type Rule = "parity" | "magnitude";
interface TSTrial {
  rule: Rule;
  num: number;
  answer: string;
  isSwitch: boolean;
}

function genTrials(): TSTrial[] {
  const trials: TSTrial[] = [];
  let lastRule: Rule = "parity";
  for (let i = 0; i < TS_TRIALS; i++) {
    const rule: Rule =
      i === 0 || Math.random() < 0.5 ? (lastRule === "parity" ? "magnitude" : "parity") : lastRule;
    const num = Math.floor(Math.random() * 9) + 1;
    const finalNum = num === 5 ? (Math.random() < 0.5 ? 4 : 6) : num;
    const answer =
      rule === "parity" ? (finalNum % 2 === 0 ? "even" : "odd") : finalNum < 5 ? "low" : "high";
    trials.push({ rule, num: finalNum, answer, isSwitch: i > 0 && rule !== lastRule });
    lastRule = rule;
  }
  return trials;
}

export function TaskSwitchTraining({ patient, onAbort, onFinish }: TrainingComponentProps) {
  const [phase, setPhase] = useState<"intro" | "running" | "done">("intro");
  const [trials, setTrials] = useState<TSTrial[]>([]);
  const [idx, setIdx] = useState(0);
  const [feedback, setFeedback] = useState<"ok" | "err" | "timeout" | null>(null);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [errors, setErrors] = useState(0);
  const [saving, setSaving] = useState(false);
  const sessionStartRef = useRef(0);
  const trialStartRef = useRef(0);
  const stateRef = useRef({ idx: 0, score: 0, correct: 0, errors: 0 });
  stateRef.current = { idx, score, correct, errors };
  const resultRef = useRef<TrainingResult | null>(null);

  const advance = () => {
    setFeedback(null);
    const s = stateRef.current;
    const next = s.idx + 1;
    if (next >= TS_TRIALS) {
      const duration = Date.now() - sessionStartRef.current;
      resultRef.current = {
        exerciseId: "taskSwitch",
        score: s.score,
        accuracy: s.correct / (s.correct + s.errors || 1),
        duration,
        level: 1,
      };
      setPhase("done");
    } else {
      setIdx(next);
      trialStartRef.current = Date.now();
    }
  };

  useEffect(() => {
    if (phase !== "running" || feedback) return;
    const t = setTimeout(() => {
      setErrors((e) => e + 1);
      setFeedback("timeout");
      setTimeout(advance, 500);
    }, TS_TIMEOUT);
    return () => clearTimeout(t);
  }, [phase, idx, feedback]);

  const start = () => {
    setTrials(genTrials());
    setIdx(0);
    setScore(0);
    setCorrect(0);
    setErrors(0);
    sessionStartRef.current = Date.now();
    trialStartRef.current = Date.now();
    setFeedback(null);
    setPhase("running");
  };

  const trial = trials[idx];

  const onAnswer = (ans: string) => {
    if (feedback || !trial) return;
    const rt = Date.now() - trialStartRef.current;
    if (ans === trial.answer) {
      setCorrect((c) => c + 1);
      const speedBonus = Math.max(0, Math.round((TS_TIMEOUT - rt) / 30));
      const switchBonus = trial.isSwitch ? 30 : 10;
      setScore((s) => s + 30 + speedBonus + switchBonus);
      setFeedback("ok");
    } else {
      setErrors((e) => e + 1);
      setScore((s) => Math.max(0, s - 20));
      setFeedback("err");
    }
    setTimeout(advance, 450);
  };

  const cfg =
    trial && trial.rule === "parity"
      ? {
          bg: "#FEF3C7",
          fg: "#92400E",
          border: "#FCD34D",
          title: "JUFT yoki TOQ?",
          a: { label: "JUFT", val: "even" },
          b: { label: "TOQ", val: "odd" },
        }
      : {
          bg: "#DBEAFE",
          fg: "#1E3A8A",
          border: "#93C5FD",
          title: "5 dan KICHIK yoki KATTA?",
          a: { label: "< 5", val: "low" },
          b: { label: "> 5", val: "high" },
        };

  const save = async () => {
    if (!resultRef.current) return onAbort();
    setSaving(true);
    await onFinish(resultRef.current);
  };

  return (
    <TrainingShell
      exercise={ex}
      patient={patient}
      phase={phase}
      onAbort={onAbort}
      metrics={
        phase === "running"
          ? [
              { label: "Trial", value: `${idx + 1} / ${TS_TRIALS}`, mono: true },
              { label: "To'g'ri", value: correct, tone: "ok", mono: true },
              { label: "Xato", value: errors, tone: errors ? "err" : "neutral", mono: true },
              { label: "Ball", value: score, tone: "primary", mono: true },
            ]
          : undefined
      }
      intro={
        <TrainingIntro
          exercise={ex}
          description="Ekranda raqam paydo bo'ladi. Fon rangi qoidani belgilaydi: SARIQ — juft yoki toq, KO'K — 5 dan kichik yoki katta. Qoida tez-tez almashadi!"
          instructions={[
            "SARIQ fon: raqam JUFT bo'lsa chap, TOQ bo'lsa o'ng tugmani bosing.",
            "KO'K fon: raqam 5 dan KICHIK bo'lsa chap, KATTA bo'lsa o'ng tugmani bosing.",
            "Qoida har trial almashishi mumkin — fon rangiga e'tibor bering!",
            "Qoida o'zgarganda ball ko'paytirilgan.",
          ]}
          duration="3 daqiqa"
          onStart={start}
        />
      }
      body={
        trial ? (
          <div className="flex flex-col items-center gap-6">
            <div
              className="px-[18px] py-2 rounded-pill font-bold text-sm uppercase tracking-wider flex items-center gap-2"
              style={{ background: cfg.bg, color: cfg.fg, border: `1px solid ${cfg.border}` }}
            >
              {trial.isSwitch ? <Repeat className="h-3.5 w-3.5" /> : null}
              {cfg.title}
            </div>
            <div
              className="w-[min(82vw,360px)] h-[min(64vw,280px)] rounded-3xl grid place-items-center font-extrabold text-[clamp(96px,40vw,200px)] tracking-tight leading-none shadow-lg transition-colors"
              style={{
                background: cfg.bg,
                color: cfg.fg,
                border:
                  feedback === "ok"
                    ? "4px solid var(--color-ok)"
                    : feedback === "err"
                      ? "4px solid var(--color-err)"
                      : feedback === "timeout"
                        ? "4px solid var(--color-warn)"
                        : `2px solid ${cfg.border}`,
              }}
            >
              {trial.num}
            </div>
            <div className="flex gap-3.5">
              {[cfg.a, cfg.b].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onPointerDown={() => onAnswer(opt.val)}
                  disabled={Boolean(feedback)}
                  className="w-[200px] h-20 rounded-[14px] bg-ink text-white font-bold text-[26px] shadow-md disabled:opacity-60 active:bg-black"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ) : null
      }
      done={
        <TrainingDone
          score={resultRef.current?.score ?? score}
          accuracy={resultRef.current?.accuracy ?? null}
          duration={resultRef.current?.duration ?? 0}
          onAgain={start}
          onBack={save}
          saving={saving}
        />
      }
      hint={
        <span>
          Fon <b style={{ color: "#92400E" }}>SARIQ</b> — juft/toq ·{" "}
          <b style={{ color: "#1E3A8A" }}>KO'K</b> — 5 dan kichik/katta
        </span>
      }
    />
  );
}
