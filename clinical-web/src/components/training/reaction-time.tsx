"use client";

import { TRAINING_META } from "@/lib/training/meta";
import { useEffect, useRef, useState } from "react";
import type { TrainingComponentProps, TrainingResult } from "./shared";
import { TrainingDone, TrainingIntro, TrainingShell } from "./shared";

const RT_TRIALS = 25;
const RT_GO_RATE = 0.75;
const RT_MIN_DELAY = 1000;
const RT_MAX_DELAY = 2800;
const RT_RESPONSE_WINDOW = 1200;
const ex = TRAINING_META.reactionTime;

type Stage = "wait" | "go" | "nogo" | "feedback";
type Feedback = "ok" | "miss" | "noGoErr" | "early" | "correctRej" | null;

export function RTimeTraining({ patient, onAbort, onFinish }: TrainingComponentProps) {
  const [phase, setPhase] = useState<"intro" | "running" | "done">("intro");
  const [idx, setIdx] = useState(0);
  const [stage, setStage] = useState<Stage>("wait");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [falseAlarms, setFalseAlarms] = useState(0);
  const [correctRejs, setCorrectRejs] = useState(0);
  const [rts, setRts] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const stageStartRef = useRef(0);
  const stageRef = useRef<Stage>("wait");
  const idxRef = useRef(0);
  const sessionStartRef = useRef(0);
  const counts = useRef({
    score: 0,
    hits: 0,
    misses: 0,
    falseAlarms: 0,
    correctRejs: 0,
    rts: [] as number[],
  });
  const resultRef = useRef<TrainingResult | null>(null);

  const setStageBoth = (s: Stage) => {
    stageRef.current = s;
    setStage(s);
  };

  const finish = () => {
    const c = counts.current;
    const duration = Date.now() - sessionStartRef.current;
    const avgRT = c.rts.length ? c.rts.reduce((a, b) => a + b, 0) / c.rts.length : null;
    resultRef.current = {
      exerciseId: "reactionTime",
      score: c.score,
      accuracy: (c.hits + c.correctRejs) / RT_TRIALS,
      duration,
      level: 1,
      raw: {
        hits: c.hits,
        misses: c.misses,
        falseAlarms: c.falseAlarms,
        correctRejs: c.correctRejs,
        avgRT,
      },
    };
    setPhase("done");
  };

  const beginTrial = (i: number) => {
    if (i >= RT_TRIALS) {
      finish();
      return;
    }
    setIdx(i);
    idxRef.current = i;
    setStageBoth("wait");
    setFeedback(null);
    const isGo = Math.random() < RT_GO_RATE;
    const delay = RT_MIN_DELAY + Math.random() * (RT_MAX_DELAY - RT_MIN_DELAY);
    setTimeout(() => {
      if (stageRef.current !== "wait") return;
      setStageBoth(isGo ? "go" : "nogo");
      stageStartRef.current = Date.now();
      setTimeout(() => {
        // no response within window
        if (stageRef.current !== "go" && stageRef.current !== "nogo") return;
        const c = counts.current;
        if (isGo) {
          c.misses += 1;
          c.score = Math.max(0, c.score - 10);
          setMisses(c.misses);
          setScore(c.score);
          setFeedback("miss");
        } else {
          c.correctRejs += 1;
          c.score += 15;
          setCorrectRejs(c.correctRejs);
          setScore(c.score);
          setFeedback("correctRej");
        }
        setStageBoth("feedback");
        setTimeout(() => beginTrial(i + 1), 700);
      }, RT_RESPONSE_WINDOW);
    }, delay);
  };

  const onTap = () => {
    const prev = stageRef.current;
    const c = counts.current;
    const i = idxRef.current;
    if (prev === "wait") {
      c.falseAlarms += 1;
      c.score = Math.max(0, c.score - 30);
      setFalseAlarms(c.falseAlarms);
      setScore(c.score);
      setFeedback("early");
      setStageBoth("feedback");
      setTimeout(() => beginTrial(i + 1), 700);
    } else if (prev === "go") {
      const rt = Date.now() - stageStartRef.current;
      c.hits += 1;
      c.rts.push(rt);
      c.score += Math.max(20, Math.round(220 - rt / 3));
      setHits(c.hits);
      setRts([...c.rts]);
      setScore(c.score);
      setFeedback("ok");
      setStageBoth("feedback");
      setTimeout(() => beginTrial(i + 1), 600);
    } else if (prev === "nogo") {
      c.falseAlarms += 1;
      c.score = Math.max(0, c.score - 25);
      setFalseAlarms(c.falseAlarms);
      setScore(c.score);
      setFeedback("noGoErr");
      setStageBoth("feedback");
      setTimeout(() => beginTrial(i + 1), 700);
    }
  };

  useEffect(() => {
    if (phase !== "running") return;
    const h = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        onTap();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [phase]);

  const start = () => {
    setIdx(0);
    setScore(0);
    setHits(0);
    setMisses(0);
    setFalseAlarms(0);
    setCorrectRejs(0);
    setRts([]);
    counts.current = { score: 0, hits: 0, misses: 0, falseAlarms: 0, correctRejs: 0, rts: [] };
    sessionStartRef.current = Date.now();
    setPhase("running");
    setTimeout(() => beginTrial(0), 600);
  };

  const lastRT = rts.length ? rts[rts.length - 1] : null;
  const avgRT = rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : null;

  let circleColor = "var(--color-surface-2)";
  let circleBorder = "var(--color-border)";
  let label = "Kuting…";
  let labelColor = "var(--color-ink-3)";
  if (stage === "go") {
    circleColor = "#16A34A";
    circleBorder = "#15803D";
    label = "BOS!";
    labelColor = "#FFF";
  }
  if (stage === "nogo") {
    circleColor = "#DC2626";
    circleBorder = "#991B1B";
    label = "BOSMA";
    labelColor = "#FFF";
  }
  if (feedback === "ok") {
    circleColor = "#16A34A";
    label = "✓";
    labelColor = "#FFF";
  }
  if (feedback === "miss") {
    circleColor = "#D97706";
    label = "Kech qoldingiz";
    labelColor = "#FFF";
  }
  if (feedback === "noGoErr") {
    circleColor = "#DC2626";
    label = "✗ BOSMASLIK kerak edi";
    labelColor = "#FFF";
  }
  if (feedback === "early") {
    circleColor = "#D97706";
    label = "Erta bosildi";
    labelColor = "#FFF";
  }
  if (feedback === "correctRej") {
    circleColor = "#16A34A";
    label = "✓ To'g'ri to'xtatildi";
    labelColor = "#FFF";
  }

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
              { label: "Trial", value: `${idx + 1} / ${RT_TRIALS}`, mono: true },
              { label: "Hit", value: hits, tone: "ok", mono: true },
              {
                label: "Xato",
                value: falseAlarms + misses,
                tone: falseAlarms + misses ? "err" : "neutral",
                mono: true,
              },
              { label: "Oxirgi RT", value: lastRT ? `${lastRT} ms` : "—", mono: true },
              { label: "O'rt RT", value: avgRT ? `${avgRT} ms` : "—", mono: true },
            ]
          : undefined
      }
      intro={
        <TrainingIntro
          exercise={ex}
          description="GO/NO-GO testi. YASHIL doira paydo bo'lsa — iloji boricha tezroq doirani bosing. QIZIL doira chiqsa — bosmang!"
          instructions={[
            "Doira yashil rangda chiqsa — darhol katta tugmani bosing (yoki SPACE).",
            "Doira qizil rangda chiqsa — bosmang. Kuting yangi trial uchun.",
            "Erta bosish ham xato hisoblanadi.",
            "Tezlik MUHIM — har 100 ms tezlik = qo'shimcha ball.",
          ]}
          duration="2–3 daqiqa"
          onStart={start}
        />
      }
      body={
        <div className="flex flex-col items-center gap-7">
          <button
            type="button"
            onPointerDown={onTap}
            className="w-[min(78vw,360px)] h-[min(78vw,360px)] rounded-pill font-extrabold text-4xl tracking-tight shadow-lg select-none transition-colors"
            style={{
              background: circleColor,
              color: labelColor,
              border: `4px solid ${circleBorder}`,
            }}
          >
            {label}
          </button>
          <div className="font-mono text-[11px] text-ink-3 tracking-wide">
            SPACE bilan ham bosish mumkin
          </div>
        </div>
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
          <b style={{ color: "#16A34A" }}>YASHIL</b> = bos ·{" "}
          <b style={{ color: "#DC2626" }}>QIZIL</b> = bosma
        </span>
      }
    />
  );
}
