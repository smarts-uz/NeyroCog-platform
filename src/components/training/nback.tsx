"use client";

import { TRAINING_META } from "@/lib/training/meta";
import { useEffect, useRef, useState } from "react";
import type { TrainingComponentProps, TrainingResult } from "./shared";
import { TrainingDone, TrainingIntro, TrainingShell } from "./shared";

const NB_STIMULI = ["A", "B", "C", "D", "E", "F", "G", "H"];
const NB_TOTAL = 24;
const NB_SHOW_MS = 1500;
const NB_GAP_MS = 800;
const NB_TARGET_RATE = 0.33;
const ex = TRAINING_META.nback;

function genSeq(n: number, total: number): string[] {
  const seq: string[] = [];
  for (let i = 0; i < total; i++) {
    if (i >= n && Math.random() < NB_TARGET_RATE) {
      seq.push(seq[i - n] as string);
    } else {
      let next: string;
      do {
        next = NB_STIMULI[Math.floor(Math.random() * NB_STIMULI.length)] as string;
      } while (i >= n && next === seq[i - n]);
      seq.push(next);
    }
  }
  return seq;
}

export function NBackTraining({ patient, onAbort, onFinish }: TrainingComponentProps) {
  const [phase, setPhase] = useState<"intro" | "running" | "done">("intro");
  const [n] = useState(2);
  const [seq, setSeq] = useState<string[]>([]);
  const [idx, setIdx] = useState(-1);
  const [showing, setShowing] = useState(false);
  const [responded, setResponded] = useState(false);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [falseAlarms, setFalseAlarms] = useState(0);
  const [correctRejs, setCorrectRejs] = useState(0);
  const [score, setScore] = useState(0);
  const [flash, setFlash] = useState(false);
  const [saving, setSaving] = useState(false);

  const respondedRef = useRef(false);
  const showingRef = useRef(false);
  const sessionStartRef = useRef(0);
  const counts = useRef({ hits: 0, misses: 0, falseAlarms: 0, correctRejs: 0, score: 0 });
  const resultRef = useRef<TrainingResult | null>(null);

  const evaluateTrial = (s: string[], i: number, lvl: number) => {
    const isMatch = i >= lvl && s[i] === s[i - lvl];
    const userResponded = respondedRef.current;
    const c = counts.current;
    if (isMatch && userResponded) {
      c.hits += 1;
      c.score += 20;
    } else if (isMatch && !userResponded) {
      c.misses += 1;
      c.score = Math.max(0, c.score - 5);
    } else if (!isMatch && userResponded) {
      c.falseAlarms += 1;
      c.score = Math.max(0, c.score - 15);
    } else {
      c.correctRejs += 1;
      c.score += 5;
    }
    setHits(c.hits);
    setMisses(c.misses);
    setFalseAlarms(c.falseAlarms);
    setCorrectRejs(c.correctRejs);
    setScore(c.score);
    respondedRef.current = false;
  };

  const advance = (s: string[], current: number, lvl: number) => {
    const next = current + 1;
    if (next >= NB_TOTAL) {
      const duration = Date.now() - sessionStartRef.current;
      const c = counts.current;
      resultRef.current = {
        exerciseId: "nback",
        score: c.score,
        accuracy: (c.hits + c.correctRejs) / NB_TOTAL,
        duration,
        level: lvl,
        raw: {
          hits: c.hits,
          misses: c.misses,
          falseAlarms: c.falseAlarms,
          correctRejs: c.correctRejs,
          n: lvl,
        },
      };
      setShowing(false);
      showingRef.current = false;
      setPhase("done");
      return;
    }
    setIdx(next);
    setShowing(true);
    showingRef.current = true;
    setResponded(false);
    setTimeout(() => {
      setShowing(false);
      showingRef.current = false;
      setTimeout(() => {
        evaluateTrial(s, next, lvl);
        advance(s, next, lvl);
      }, NB_GAP_MS);
    }, NB_SHOW_MS);
  };

  const start = (level: number) => {
    const s = genSeq(level, NB_TOTAL);
    setSeq(s);
    setIdx(-1);
    setHits(0);
    setMisses(0);
    setFalseAlarms(0);
    setCorrectRejs(0);
    setScore(0);
    counts.current = { hits: 0, misses: 0, falseAlarms: 0, correctRejs: 0, score: 0 };
    sessionStartRef.current = Date.now();
    setPhase("running");
    setTimeout(() => advance(s, -1, level), 600);
  };

  const onMatchClick = () => {
    if (!showingRef.current || respondedRef.current) return;
    respondedRef.current = true;
    setResponded(true);
    setFlash(true);
    setTimeout(() => setFlash(false), 200);
  };

  useEffect(() => {
    if (phase !== "running") return;
    const h = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        onMatchClick();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [phase]);

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
              {
                label: `${n}-Back`,
                value: `${idx + 1} / ${NB_TOTAL}`,
                tone: "primary",
                mono: true,
              },
              { label: "Hit", value: hits, tone: "ok", mono: true },
              {
                label: "Xato",
                value: falseAlarms + misses,
                tone: misses + falseAlarms ? "err" : "neutral",
                mono: true,
              },
              { label: "Ball", value: score, mono: true },
            ]
          : undefined
      }
      intro={
        <TrainingIntro
          exercise={ex}
          description={`Ekranda harflar ketma-ket ko'rinadi. Joriy harf ${n} ta oldingisi bilan bir xil bo'lsa — MATCH tugmasini bosing (yoki space).`}
          instructions={[
            `Birinchi ${n} ta harfni eslab qoling — javob bermang.`,
            `${n + 1}-harfdan boshlab — joriy harf ${n} qadam oldingisi bilan bir xil bo'lsa, MATCH bosing.`,
            "Tugmani harf ko'rinib turgan vaqtda bosing.",
            "Aniqlik va tezlik — ikkalasi ham muhim.",
          ]}
          duration="3–4 daqiqa"
          onStart={() => start(2)}
        />
      }
      body={
        <div className="flex flex-col items-center gap-9">
          <div
            className="w-[280px] h-[280px] rounded-[28px] grid place-items-center font-extrabold text-[168px] tracking-tight border-2 border-border select-none transition-all"
            style={{
              background: showing ? "var(--color-ink)" : "var(--color-surface-2)",
              color: showing ? "#fff" : "var(--color-ink-4)",
              boxShadow: showing ? "var(--shadow-lg)" : "var(--shadow-xs)",
            }}
          >
            {showing ? seq[idx] : "·"}
          </div>
          <div className="flex items-center gap-6">
            <div className="px-4 py-2.5 rounded-xl bg-primary-soft text-primary-press font-bold text-sm uppercase tracking-wider">
              {n}-Back
            </div>
            <button
              type="button"
              onPointerDown={onMatchClick}
              disabled={!showing}
              className="px-9 py-4 rounded-2xl text-white font-bold text-lg uppercase tracking-wide shadow-md min-w-[220px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: responded
                  ? "var(--color-ok)"
                  : flash
                    ? "var(--color-primary-press)"
                    : "var(--color-primary)",
              }}
            >
              {responded ? "✓ MATCH" : "MATCH"}
              <span className="opacity-50 text-xs ml-2 font-mono">SPACE</span>
            </button>
          </div>
        </div>
      }
      done={
        <TrainingDone
          score={resultRef.current?.score ?? score}
          accuracy={resultRef.current?.accuracy ?? null}
          duration={resultRef.current?.duration ?? 0}
          level={n}
          onAgain={() => start(n)}
          onBack={save}
          saving={saving}
        />
      }
      hint={
        <span>
          Joriy harf <b className="text-ink">{n}</b> ta oldingisi bilan bir xil bo'lsa — MATCH
          bosing
        </span>
      }
    />
  );
}
