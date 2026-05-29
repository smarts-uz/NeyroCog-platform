"use client";

import { useEffect, useRef, useState } from "react";
import type { EngineComponentProps, TrainingPhase } from "../shared";
import { TrainingDone, TrainingIntro, TrainingShell } from "../shared";

type Stage = "in" | "hold" | "out";

/** EngBreathe — emotsional regulyatsiya: ritmik nafas + relaksatsiya. */
export function EngBreathe({ patient, exercise, onAbort, onFinish }: EngineComponentProps) {
  const c = exercise.config ?? {};
  const cycles = c.cycles ?? 6;
  const IN = c.inhale ?? 4;
  const HOLD = c.hold ?? 4;
  const OUT = c.exhale ?? 6;

  const [phase, setPhase] = useState<TrainingPhase>("intro");
  const [cycle, setCycle] = useState(0);
  const [stage, setStage] = useState<Stage>("in");
  const [t, setT] = useState(0);
  const startRef = useRef(0);
  const rafRef = useRef(0);

  const start = () => {
    setPhase("running");
    setCycle(0);
    setStage("in");
    setT(0);
    startRef.current = Date.now();
  };

  useEffect(() => {
    if (phase !== "running") return;
    let last = Date.now();
    let st: Stage = "in";
    let acc = 0;
    let cy = 0;
    let raf = 0;
    const dur: Record<Stage, number> = { in: IN, hold: HOLD, out: OUT };
    let finished = false;

    const doFinish = () => {
      finished = true;
      cancelAnimationFrame(raf);
      setPhase("done");
      setTimeout(
        () =>
          void onFinish({
            exerciseId: exercise.id,
            score: cycles * 15,
            accuracy: 1,
            duration: Date.now() - startRef.current,
            level: cycles,
          }),
        700,
      );
    };

    const loop = () => {
      if (finished) return;
      const now = Date.now();
      acc += (now - last) / 1000;
      last = now;
      if (acc >= dur[st]) {
        acc = 0;
        st = st === "in" ? "hold" : st === "hold" ? "out" : "in";
        if (st === "in") {
          cy++;
          setCycle(cy);
          if (cy >= cycles) {
            doFinish();
            return;
          }
        }
        setStage(st);
      }
      setT(acc);
      raf = requestAnimationFrame(loop);
      rafRef.current = raf;
    };
    raf = requestAnimationFrame(loop);
    rafRef.current = raf;
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  const dur = stage === "in" ? IN : stage === "hold" ? HOLD : OUT;
  const frac = Math.min(1, t / dur);
  const scale = stage === "in" ? 0.5 + frac * 0.5 : stage === "out" ? 1 - frac * 0.5 : 1;
  const label =
    stage === "in" ? "Nafas oling" : stage === "hold" ? "Ushlab turing" : "Nafas chiqaring";
  const col =
    stage === "in"
      ? "var(--color-primary)"
      : stage === "hold"
        ? "var(--color-accent)"
        : "var(--color-info)";

  return (
    <TrainingShell
      exercise={exercise}
      patient={patient}
      phase={phase}
      onAbort={onAbort}
      metrics={
        phase === "running"
          ? [
              {
                label: "Sikl",
                value: `${cycle + 1}/${cycles}`,
                icon: "repeat",
                tone: "primary",
                mono: true,
              },
              { label: "Bosqich", value: label, icon: "wind" },
            ]
          : undefined
      }
      intro={
        <TrainingIntro
          exercise={exercise}
          description={exercise.description}
          instructions={[
            "Qulay o'tiring, yelkangizni bo'shashtiring.",
            "Doira kengayganda — burun orqali nafas oling.",
            "To'xtaganda — nafasni ushlab turing.",
            "Kichrayganda — sekin nafas chiqaring.",
          ]}
          duration={exercise.duration}
          onStart={start}
        />
      }
      body={
        <div className="flex flex-col items-center gap-9">
          <div className="relative w-[280px] h-[280px] flex items-center justify-center">
            <div className="absolute w-[280px] h-[280px] rounded-full border-2 border-dashed border-border-strong" />
            <div
              className="w-[280px] h-[280px] rounded-full"
              style={{
                background: col,
                opacity: 0.18,
                transform: `scale(${scale})`,
                transition: "transform 80ms linear, background 400ms var(--ease-confident)",
              }}
            />
            <div
              className="absolute w-[140px] h-[140px] rounded-full flex items-center justify-center"
              style={{
                background: col,
                opacity: 0.85,
                transform: `scale(${scale})`,
                transition: "transform 80ms linear, background 400ms var(--ease-confident)",
              }}
            >
              <span className="text-white font-extrabold text-[34px] tabular-nums">
                {Math.ceil(dur - t)}
              </span>
            </div>
          </div>
          <div className="font-bold text-2xl tracking-tight" style={{ color: col }}>
            {label}
          </div>
        </div>
      }
      done={
        <TrainingDone
          score={cycles * 15}
          accuracy={1}
          duration={Date.now() - startRef.current}
          level={cycles}
          onAgain={start}
          onBack={onAbort}
        />
      }
      hint={<span>Doira bilan birga nafas oling</span>}
    />
  );
}
