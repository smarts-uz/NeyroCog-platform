"use client";

import type { CategorySpec, EmotionScenario, ExerciseConfig, WordPair } from "@/lib/training/meta";
import { useEffect, useMemo, useRef, useState } from "react";
import type { EngineComponentProps, TrainingPhase } from "../shared";
import { TrainingDone, TrainingIntro, TrainingShell } from "../shared";
import { rndInt, sample, shuffle } from "./util";

interface Option {
  label: string;
  correct: boolean;
  color?: string;
}
interface Trial {
  promptText?: string;
  promptColor?: string;
  ruleText?: string;
  options: Option[];
}
type Generator = () => Trial;

function buildGenerator(cfg: ExerciseConfig): Generator {
  switch (cfg.genKey) {
    case "category": {
      const cats: CategorySpec[] = cfg.categories ?? [];
      return () => {
        const cat = cats[rndInt(cats.length)];
        if (!cat) return { ruleText: "Qaysi guruhga kiradi?", options: [] };
        const item = cat.items[rndInt(cat.items.length)];
        return {
          promptText: item,
          ruleText: "Qaysi guruhga kiradi?",
          options: cats.map((c) => ({ label: c.name, correct: c.name === cat.name })),
        };
      };
    }
    case "oddball": {
      const groups: string[][] = cfg.groups ?? [];
      return () => {
        const g = groups[rndInt(groups.length)] ?? [];
        const others = groups.filter((x) => x !== g);
        const otherGroup = others[rndInt(others.length)] ?? [];
        const odd = otherGroup[rndInt(Math.min(3, otherGroup.length))] ?? otherGroup[0] ?? "";
        const picks = sample(g, 3).concat(odd);
        return {
          ruleText: "Ortiqcha so'zni toping",
          options: shuffle(picks).map((w) => ({ label: w, correct: w === odd })),
        };
      };
    }
    case "wordpair": {
      const pairs: WordPair[] = Array.isArray(cfg.pairs) ? cfg.pairs : [];
      const ruleText = cfg.ruleText ?? "Mos so'zni tanlang";
      return () => {
        const p = pairs[rndInt(pairs.length)];
        if (!p) return { ruleText, options: [] };
        return {
          promptText: p.word,
          ruleText,
          options: shuffle([
            { label: p.match, correct: true },
            ...p.distractors.map((d) => ({ label: d, correct: false })),
          ]),
        };
      };
    }
    case "emotion": {
      const scenarios: EmotionScenario[] = cfg.scenarios ?? [];
      return () => {
        const e = scenarios[rndInt(scenarios.length)];
        if (!e) return { ruleText: "Bu qanday his-tuyg'u?", options: [] };
        return {
          promptText: e.text,
          ruleText: "Bu qanday his-tuyg'u?",
          options: shuffle(e.options.map((o) => ({ label: o, correct: o === e.answer }))),
        };
      };
    }
    case "stroop": {
      const colors = [
        { name: "Qizil", hex: "#DC2626" },
        { name: "Ko'k", hex: "#2563EB" },
        { name: "Yashil", hex: "#16A34A" },
        { name: "Sariq", hex: "#CA8A04" },
      ];
      return () => {
        const wi = rndInt(colors.length);
        let ii: number;
        do {
          ii = rndInt(colors.length);
        } while (ii === wi && Math.random() < 0.75);
        const word = colors[wi];
        const ink = colors[ii];
        if (!word || !ink) return { ruleText: "So'zning RANGINI tanlang", options: [] };
        return {
          promptText: word.name.toUpperCase(),
          promptColor: ink.hex,
          ruleText: "So'zning RANGINI tanlang",
          options: shuffle(colors.map((c) => ({ label: c.name, correct: c.name === ink.name }))),
        };
      };
    }
    default: {
      // arith
      const ops = cfg.ops ?? ["+", "-"];
      const max = cfg.max ?? 12;
      return () => {
        const op = ops[rndInt(ops.length)] ?? "+";
        let a = rndInt(max) + 1;
        let b = rndInt(max) + 1;
        if (op === "-" && b > a) [a, b] = [b, a];
        const ans = op === "+" ? a + b : op === "-" ? a - b : a * b;
        const distract = shuffle([ans + 1, ans - 1, ans + 2, ans - 2].filter((x) => x >= 0)).slice(
          0,
          3,
        );
        return {
          promptText: `${a} ${op} ${b}`,
          ruleText: "Javobni tanlang",
          options: shuffle([
            { label: String(ans), correct: true },
            ...distract.map((d) => ({ label: String(d), correct: false })),
          ]),
        };
      };
    }
  }
}

/**
 * EngChoice — stimul → to'g'ri variantni tanlash. Toifalash, oddball, Stroop,
 * arifmetika, so'z juftlari, his-tuyg'u kabi 14 mashqni quvvatlaydi.
 */
export function EngChoice({ patient, exercise, onAbort, onFinish }: EngineComponentProps) {
  const c = exercise.config ?? {};
  const rounds = c.rounds ?? 16;
  const timeout = c.timeout ?? 0;
  const genFn = useMemo(() => buildGenerator(c), [exercise.id]);

  const [phase, setPhase] = useState<TrainingPhase>("intro");
  const [idx, setIdx] = useState(0);
  const [trial, setTrial] = useState<Trial | null>(null);
  const [fb, setFb] = useState<"ok" | "err" | "timeout" | null>(null);
  const [correct, setCorrect] = useState(0);
  const [errors, setErrors] = useState(0);
  const [score, setScore] = useState(0);
  const startRef = useRef(0);
  const tRef = useRef(0);
  const idxRef = useRef(0);
  const correctRef = useRef(0);
  const errorsRef = useRef(0);
  const scoreRef = useRef(0);

  const next = () => {
    setTrial(genFn());
    setFb(null);
    tRef.current = Date.now();
  };
  const start = () => {
    setPhase("running");
    setIdx(0);
    idxRef.current = 0;
    setCorrect(0);
    correctRef.current = 0;
    setErrors(0);
    errorsRef.current = 0;
    setScore(0);
    scoreRef.current = 0;
    startRef.current = Date.now();
    next();
  };

  const advance = () => {
    const n = idxRef.current + 1;
    if (n >= rounds) {
      setPhase("done");
      const acc = correctRef.current / (correctRef.current + errorsRef.current || 1);
      setTimeout(
        () =>
          void onFinish({
            exerciseId: exercise.id,
            score: scoreRef.current,
            accuracy: acc,
            duration: Date.now() - startRef.current,
            level: exercise._level ?? 1,
          }),
        700,
      );
      return;
    }
    idxRef.current = n;
    setIdx(n);
    next();
  };

  // timeout
  useEffect(() => {
    if (phase !== "running" || !trial || fb || !timeout) return;
    const t = setTimeout(() => {
      errorsRef.current += 1;
      setErrors((e) => e + 1);
      setFb("timeout");
      setTimeout(advance, 500);
    }, timeout);
    return () => clearTimeout(t);
  }, [phase, trial, fb, timeout]);

  const answer = (opt: Option) => {
    if (fb) return;
    if (opt.correct) {
      correctRef.current += 1;
      setCorrect((x) => x + 1);
      const rt = Date.now() - tRef.current;
      const bonus = Math.max(0, Math.round(((timeout || 4000) - rt) / 40));
      scoreRef.current += 30 + bonus;
      setScore((s) => s + 30 + bonus);
      setFb("ok");
    } else {
      errorsRef.current += 1;
      setErrors((x) => x + 1);
      scoreRef.current = Math.max(0, scoreRef.current - 15);
      setScore((s) => Math.max(0, s - 15));
      setFb("err");
    }
    setTimeout(advance, 480);
  };

  const acc = correct / (correct + errors || 1);

  return (
    <TrainingShell
      exercise={exercise}
      patient={patient}
      phase={phase}
      onAbort={onAbort}
      metrics={
        phase === "running"
          ? [
              { label: "Savol", value: `${idx + 1}/${rounds}`, icon: "list", mono: true },
              { label: "To'g'ri", value: correct, icon: "check", tone: "ok", mono: true },
              { label: "Ball", value: score, icon: "star", mono: true },
            ]
          : undefined
      }
      intro={
        <TrainingIntro
          exercise={exercise}
          description={exercise.description}
          instructions={
            c.instructions ?? [
              "Ekrandagi vazifani diqqat bilan o'qing.",
              "To'g'ri javobni tanlang.",
              "Tez va aniq javob bering.",
              `Jami ${rounds} ta savol.`,
            ]
          }
          duration={exercise.duration}
          onStart={start}
        />
      }
      body={
        trial ? (
          <div className="flex flex-col items-center gap-6 w-[min(620px,94vw)] select-none">
            {trial.ruleText ? (
              <span className="px-3 py-1.5 rounded-pill bg-primary-soft text-primary-press text-sm font-semibold">
                {trial.ruleText}
              </span>
            ) : null}
            {trial.promptText ? (
              <div
                className="min-w-[min(440px,90vw)] min-h-[150px] px-7 py-6 bg-surface rounded-[22px] flex items-center justify-center text-center font-extrabold tracking-tight"
                style={{
                  fontSize: "clamp(28px,6vw,52px)",
                  boxShadow: "var(--shadow-md)",
                  color: trial.promptColor ?? "var(--color-ink)",
                  border:
                    fb === "ok"
                      ? "3px solid var(--color-ok)"
                      : fb === "err"
                        ? "3px solid var(--color-err)"
                        : fb === "timeout"
                          ? "3px solid var(--color-warn)"
                          : "1px solid var(--color-border)",
                }}
              >
                {trial.promptText}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-3 justify-center w-full">
              {trial.options.map((o, i) => (
                <button
                  key={`${o.label}-${i}`}
                  type="button"
                  onPointerDown={() => answer(o)}
                  disabled={!!fb}
                  className="flex-[1_1_40%] min-w-[120px] min-h-[60px] px-[18px] rounded-[14px] border border-border-strong font-bold text-[17px]"
                  style={{
                    background: fb && o.correct ? "var(--color-ok-bg)" : "var(--color-surface)",
                    color: o.color ?? "var(--color-ink)",
                    boxShadow: "var(--shadow-xs)",
                    cursor: fb ? "default" : "pointer",
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        ) : null
      }
      done={
        <TrainingDone
          score={score}
          accuracy={acc}
          duration={Date.now() - startRef.current}
          onAgain={start}
          onBack={onAbort}
        />
      }
      hint={<span>To'g'ri javobni tanlang</span>}
    />
  );
}
