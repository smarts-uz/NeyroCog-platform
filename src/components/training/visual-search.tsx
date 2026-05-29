"use client";

import { TRAINING_META } from "@/lib/training/meta";
import { useCallback, useEffect, useRef, useState } from "react";
import type { TrainingComponentProps, TrainingResult } from "./shared";
import { TrainingDone, TrainingIntro, TrainingShell } from "./shared";

const VS_SHAPES = ["circle", "square", "triangle", "star", "hexagon"] as const;
const VS_COLORS = ["#DC2626", "#2563EB", "#16A34A", "#D97706", "#9333EA"];
const VS_TRIALS_PER_LEVEL = 5;
const VS_TOTAL = VS_TRIALS_PER_LEVEL * 3;
const VS_TIME_LIMIT = 10000;
const ex = TRAINING_META.visualSearch;

type Shape = (typeof VS_SHAPES)[number];
interface Item {
  x: number;
  y: number;
  shape: Shape;
  color: string;
  isTarget: boolean;
}
interface Trial {
  target: { shape: Shape; color: string };
  items: Item[];
}

function starPoints(cx: number, cy: number, rO: number, rI: number, n: number): string {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? rI : rO;
    const a = (i * Math.PI) / n - Math.PI / 2;
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return pts.join(" ");
}
function hexPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 - Math.PI / 2;
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return pts.join(" ");
}
function Shape({ shape, color, size = 40 }: { shape: Shape; color: string; size?: number }) {
  const half = size / 2;
  switch (shape) {
    case "circle":
      return <circle cx={half} cy={half} r={half - 2} fill={color} />;
    case "square":
      return <rect x="2" y="2" width={size - 4} height={size - 4} fill={color} rx="4" />;
    case "triangle":
      return <polygon points={`${half},2 ${size - 2},${size - 2} 2,${size - 2}`} fill={color} />;
    case "star":
      return (
        <polygon points={starPoints(half, half, half - 2, (half - 2) * 0.4, 5)} fill={color} />
      );
    case "hexagon":
      return <polygon points={hexPoints(half, half, half - 2)} fill={color} />;
  }
}

function randomPlace(existing: { x: number; y: number }[], minDist: number) {
  const W = 720;
  const H = 440;
  const pad = 30;
  for (let t = 0; t < 60; t++) {
    const x = pad + Math.random() * (W - pad * 2);
    const y = pad + Math.random() * (H - pad * 2);
    if (existing.every((e) => Math.hypot(e.x - x, e.y - y) >= minDist)) return { x, y };
  }
  return { x: Math.random() * W, y: Math.random() * H };
}

function genTrial(level: number): Trial {
  const distractorCount = 12 + level * 4;
  const targetShape = VS_SHAPES[Math.floor(Math.random() * VS_SHAPES.length)] as Shape;
  const targetColor = VS_COLORS[Math.floor(Math.random() * VS_COLORS.length)] as string;
  const items: Item[] = [];
  const target = randomPlace(items, 80);
  items.push({ ...target, shape: targetShape, color: targetColor, isTarget: true });
  for (let i = 0; i < distractorCount; i++) {
    let s: Shape;
    let c: string;
    if (Math.random() < 0.5) {
      s = targetShape;
      do {
        c = VS_COLORS[Math.floor(Math.random() * VS_COLORS.length)] as string;
      } while (c === targetColor);
    } else {
      c = targetColor;
      do {
        s = VS_SHAPES[Math.floor(Math.random() * VS_SHAPES.length)] as Shape;
      } while (s === targetShape);
    }
    const pos = randomPlace(items, 80);
    items.push({ ...pos, shape: s, color: c, isTarget: false });
  }
  return { target: { shape: targetShape, color: targetColor }, items };
}

export function VisualSearchTraining({ patient, onAbort, onFinish }: TrainingComponentProps) {
  const [phase, setPhase] = useState<"intro" | "running" | "done">("intro");
  const [level, setLevel] = useState(1);
  const [trialN, setTrialN] = useState(0);
  const [trial, setTrial] = useState<Trial | null>(null);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [errors, setErrors] = useState(0);
  const [feedback, setFeedback] = useState<"ok" | "err" | "timeout" | null>(null);
  const [saving, setSaving] = useState(false);
  const trialStartRef = useRef(0);
  const sessionStartRef = useRef(0);
  const resultRef = useRef<TrainingResult | null>(null);
  const stateRef = useRef({ trialN: 0, level: 1, score: 0, correct: 0, errors: 0 });
  stateRef.current = { trialN, level, score, correct, errors };

  const startTrial = useCallback((lvl: number) => {
    setTrial(genTrial(lvl));
    trialStartRef.current = Date.now();
    setFeedback(null);
  }, []);

  const advance = useCallback(() => {
    const s = stateRef.current;
    const nextN = s.trialN + 1;
    setTrialN(nextN);
    if (nextN >= VS_TOTAL) {
      const duration = Date.now() - sessionStartRef.current;
      resultRef.current = {
        exerciseId: "visualSearch",
        score: s.score,
        accuracy: s.correct / (s.correct + s.errors || 1),
        duration,
        level: s.level,
      };
      setPhase("done");
      return;
    }
    const newLevel = Math.min(3, Math.floor(nextN / VS_TRIALS_PER_LEVEL) + 1);
    setLevel(newLevel);
    setTimeout(() => startTrial(newLevel), 200);
  }, [startTrial]);

  useEffect(() => {
    if (phase !== "running" || !trial || feedback) return;
    const t = setTimeout(() => {
      setErrors((e) => e + 1);
      setFeedback("timeout");
      setTimeout(advance, 600);
    }, VS_TIME_LIMIT);
    return () => clearTimeout(t);
  }, [phase, trial, feedback, advance]);

  const start = () => {
    setLevel(1);
    setTrialN(0);
    setScore(0);
    setCorrect(0);
    setErrors(0);
    setPhase("running");
    sessionStartRef.current = Date.now();
    setTimeout(() => startTrial(1), 50);
  };

  const onItemClick = (item: Item) => {
    if (feedback || phase !== "running") return;
    const rt = Date.now() - trialStartRef.current;
    if (item.isTarget) {
      setCorrect((c) => c + 1);
      const points = Math.max(10, Math.round(150 - rt / 50)) * level;
      setScore((sc) => sc + points);
      setFeedback("ok");
    } else {
      setErrors((e) => e + 1);
      setScore((sc) => Math.max(0, sc - 20));
      setFeedback("err");
    }
    setTimeout(advance, 500);
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
              { label: "Daraja", value: level, tone: "primary", mono: true },
              { label: "Trial", value: `${trialN + 1} / ${VS_TOTAL}`, mono: true },
              { label: "Ball", value: score, tone: "ok", mono: true },
              { label: "To'g'ri", value: `${correct} / ${correct + errors}`, mono: true },
            ]
          : undefined
      }
      intro={
        <TrainingIntro
          exercise={ex}
          description="Ekranda turli rang va shakldagi figuralar paydo bo'ladi. Sizning vazifangiz — ko'rsatilgan TARGET shaklni iloji boricha tezroq topib bosish."
          instructions={[
            "Yuqoridagi nishon (target) shaklini diqqat bilan ko'ring.",
            "Maydondan xuddi shu shakl va rangdagi figurani toping.",
            "Topgan zahoti bosing — to'g'ri javob ball oladi.",
            "Noto'g'ri bosish — ball kamayadi. Daraja har 5 trial'da oshadi.",
          ]}
          duration="3–4 daqiqa"
          onStart={start}
        />
      }
      body={
        trial ? (
          <div className="flex flex-col items-center gap-4">
            <div
              className="flex items-center gap-4 px-6 py-3.5 rounded-2xl shadow-sm"
              style={{ background: ex.soft, color: ex.color, border: `2px solid ${ex.color}33` }}
            >
              <div className="font-semibold text-sm tracking-wide uppercase">Toping:</div>
              <svg width={48} height={48} role="img" aria-label="target shape">
                <Shape shape={trial.target.shape} color={trial.target.color} size={48} />
              </svg>
            </div>
            <div
              className="w-[760px] max-w-full aspect-[760/480] h-auto relative bg-surface rounded-[18px] shadow-md overflow-hidden transition-colors"
              style={{
                border:
                  feedback === "ok"
                    ? "3px solid var(--color-ok)"
                    : feedback === "err"
                      ? "3px solid var(--color-err)"
                      : feedback === "timeout"
                        ? "3px solid var(--color-warn)"
                        : "1px solid var(--color-border)",
              }}
            >
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 760 480"
                role="img"
                aria-label="search field"
              >
                {trial.items.map((item, i) => (
                  <g
                    key={`${item.x}-${item.y}-${i}`}
                    transform={`translate(${item.x - 20}, ${item.y - 20})`}
                    onPointerDown={() => onItemClick(item)}
                    style={{ cursor: feedback ? "default" : "pointer" }}
                  >
                    <Shape shape={item.shape} color={item.color} size={40} />
                  </g>
                ))}
              </svg>
            </div>
          </div>
        ) : null
      }
      done={
        <TrainingDone
          score={resultRef.current?.score ?? score}
          accuracy={resultRef.current?.accuracy ?? null}
          duration={resultRef.current?.duration ?? 0}
          level={level}
          onAgain={start}
          onBack={save}
          saving={saving}
        />
      }
      hint={
        <span>
          Target shaklni <b className="text-ink">iloji boricha tezroq</b> toping
        </span>
      }
    />
  );
}
