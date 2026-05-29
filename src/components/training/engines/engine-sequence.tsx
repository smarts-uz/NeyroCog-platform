"use client";

import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useRef, useState } from "react";
import type { EngineComponentProps, TrainingPhase } from "../shared";
import { TrainingDone, TrainingIntro, TrainingShell } from "../shared";
import { rndInt, sample } from "./util";

type Stage = "idle" | "show" | "input";

function CellGrid({
  grid,
  active,
  onTap,
  picked,
  fb,
}: {
  grid: [number, number];
  active: number;
  onTap: ((idx: number) => void) | null;
  picked: number[];
  fb: "ok" | "err" | null;
}) {
  const [rows, cols] = grid;
  const cells = rows * cols;
  return (
    <div
      className="grid gap-2.5 w-[min(360px,80vw)]"
      style={{ gridTemplateColumns: `repeat(${cols},1fr)` }}
    >
      {Array.from({ length: cells }).map((_, i) => {
        const on = active === i;
        const isPicked = picked.includes(i);
        return (
          <button
            key={i}
            type="button"
            onPointerDown={onTap ? () => onTap(i) : undefined}
            disabled={!onTap}
            className="aspect-square rounded-[14px] border border-border-strong"
            style={{
              cursor: onTap ? "pointer" : "default",
              background: on
                ? "var(--color-primary)"
                : isPicked
                  ? fb === "err"
                    ? "var(--color-err-bg)"
                    : "var(--color-primary-soft)"
                  : "var(--color-surface-2)",
              boxShadow: on ? "0 0 0 6px var(--color-primary-ring)" : "none",
              transition:
                "background 120ms var(--ease-confident), box-shadow 120ms var(--ease-confident)",
            }}
          />
        );
      })}
    </div>
  );
}

/** EngSequence — ketma-ketlikni ko'rsatib, eslab takrorlash (digit/word/cell). */
export function EngSequence({ patient, exercise, onAbort, onFinish }: EngineComponentProps) {
  const c = exercise.config ?? {};
  const grid: [number, number] = c.grid ?? [3, 3];
  const startLen = c.startLen ?? 3;
  const maxLen = c.maxLen ?? 9;
  const showMs = c.showMs ?? 900;
  const gapMs = c.gapMs ?? 300;
  const pool = c.itemType === "word" ? (c.words ?? []) : [];
  const isWord = c.itemType === "word";
  const isCell = c.itemType === "cell";
  const isDigit = c.itemType === "digit";

  const [phase, setPhase] = useState<TrainingPhase>("intro");
  const [len, setLen] = useState(startLen);
  const [seq, setSeq] = useState<number[]>([]);
  const [showIdx, setShowIdx] = useState(-1);
  const [stage, setStage] = useState<Stage>("idle");
  const [input, setInput] = useState<number[]>([]);
  const [fb, setFb] = useState<"ok" | "err" | null>(null);
  const [best, setBest] = useState(0);
  const [score, setScore] = useState(0);

  const startRef = useRef(0);
  const lenRef = useRef(startLen);
  const seqRef = useRef<number[]>([]);
  const failsRef = useRef(0);
  const bestRef = useRef(0);
  const scoreRef = useRef(0);

  const genSeq = (n: number): number[] => {
    if (isDigit) {
      const out: number[] = [];
      let last = -1;
      while (out.length < n) {
        const d = rndInt(10);
        if (d !== last) {
          out.push(d);
          last = d;
        }
      }
      return out;
    }
    if (isWord)
      return sample(
        Array.from({ length: pool.length }, (_, i) => i),
        n,
      );
    const total = grid[0] * grid[1];
    const out: number[] = [];
    let last = -1;
    while (out.length < n) {
      const d = rndInt(total);
      if (d !== last) {
        out.push(d);
        last = d;
      }
    }
    return out;
  };

  const showSequence = (s: number[]) => {
    setStage("show");
    setInput([]);
    setFb(null);
    let i = 0;
    const step = () => {
      if (i >= s.length) {
        setTimeout(() => {
          setShowIdx(-1);
          setStage("input");
        }, 250);
        return;
      }
      const v = s[i];
      setShowIdx(v ?? -1);
      i++;
      setTimeout(() => {
        setShowIdx(-1);
        setTimeout(step, gapMs);
      }, showMs);
    };
    step();
  };

  const start = () => {
    setPhase("running");
    setLen(startLen);
    lenRef.current = startLen;
    setBest(0);
    bestRef.current = 0;
    setScore(0);
    scoreRef.current = 0;
    failsRef.current = 0;
    startRef.current = Date.now();
    const s = genSeq(startLen);
    setSeq(s);
    seqRef.current = s;
    setTimeout(() => showSequence(s), 500);
  };

  const finish = () => {
    setPhase("done");
    setTimeout(
      () =>
        void onFinish({
          exerciseId: exercise.id,
          score: scoreRef.current,
          accuracy: bestRef.current / maxLen,
          duration: Date.now() - startRef.current,
          level: bestRef.current,
        }),
      700,
    );
  };

  const submit = (arr: number[]) => {
    const expected = c.mode === "reverse" ? [...seqRef.current].reverse() : seqRef.current;
    const ok = arr.length === expected.length && arr.every((v, i) => v === expected[i]);
    setFb(ok ? "ok" : "err");
    setTimeout(() => {
      setFb(null);
      if (ok) {
        bestRef.current = Math.max(bestRef.current, lenRef.current);
        setBest(bestRef.current);
        scoreRef.current += lenRef.current * 10;
        setScore(scoreRef.current);
        const nl = lenRef.current + 1;
        if (nl > maxLen) {
          finish();
          return;
        }
        lenRef.current = nl;
        setLen(nl);
        failsRef.current = 0;
        const s = genSeq(nl);
        setSeq(s);
        seqRef.current = s;
        setTimeout(() => showSequence(s), 500);
      } else {
        failsRef.current += 1;
        if (failsRef.current >= 2) {
          finish();
          return;
        }
        const s = genSeq(lenRef.current);
        setSeq(s);
        seqRef.current = s;
        setTimeout(() => showSequence(s), 500);
      }
    }, 650);
  };

  const expectedLen = seq.length;
  const pushDigit = (d: number) => setInput((cur) => [...cur, d]);

  return (
    <TrainingShell
      exercise={exercise}
      patient={patient}
      phase={phase}
      onAbort={onAbort}
      metrics={
        phase === "running"
          ? [
              { label: "Uzunlik", value: len, icon: "ruler", tone: "primary", mono: true },
              { label: "Eng yaxshi", value: best, icon: "award", tone: "ok", mono: true },
              { label: "Ball", value: score, icon: "star", mono: true },
            ]
          : undefined
      }
      intro={
        <TrainingIntro
          exercise={exercise}
          description={exercise.description}
          instructions={
            c.mode === "reverse"
              ? [
                  "Ketma-ketlik ko'rsatiladi — diqqat bilan kuzating.",
                  "Endi uni TESKARI tartibda kiriting.",
                  "To'g'ri bo'lsa — uzunlik oshadi.",
                  "Bir uzunlikda 2 marta xato — yakun.",
                ]
              : [
                  "Ketma-ketlik ko'rsatiladi — diqqat bilan kuzating.",
                  "Endi uni xuddi shu tartibda kiriting.",
                  "To'g'ri bo'lsa — uzunlik oshadi.",
                  "Bir uzunlikda 2 marta xato — yakun.",
                ]
          }
          duration={exercise.duration}
          onStart={start}
        />
      }
      body={
        <div className="flex flex-col items-center gap-7 w-[min(560px,92vw)]">
          {stage === "show" && (isDigit || isWord) ? (
            <div
              className="w-60 h-[200px] rounded-[24px] grid place-items-center font-extrabold tracking-tight text-center p-3"
              style={{
                background: "var(--color-ink)",
                color: "var(--color-bg)",
                fontSize: isWord ? 44 : 120,
                boxShadow: "var(--shadow-lg)",
              }}
            >
              {showIdx >= 0 ? (isWord ? pool[showIdx] : showIdx) : ""}
            </div>
          ) : null}

          {isCell ? (
            <CellGrid
              grid={grid}
              active={stage === "show" ? showIdx : -1}
              picked={input}
              fb={fb}
              onTap={
                stage === "input"
                  ? (idx) => {
                      const n = [...input, idx];
                      setInput(n);
                      const expected =
                        c.mode === "reverse" ? [...seqRef.current].reverse() : seqRef.current;
                      if (n.length === expected.length) submit(n);
                    }
                  : null
              }
            />
          ) : null}

          {stage === "input" && (isDigit || isWord) ? (
            <>
              <div className="text-[15px] text-ink-2 text-center">
                {c.mode === "reverse" ? (
                  <>
                    Endi <b className="text-accent">teskari</b> tartibda kiriting
                  </>
                ) : (
                  <>Ko'rsatilgan tartibda kiriting</>
                )}{" "}
                ({expectedLen} ta)
              </div>
              <div
                className="min-h-10 flex gap-2 flex-wrap justify-center font-bold text-2xl"
                style={{
                  color:
                    fb === "ok"
                      ? "var(--color-ok)"
                      : fb === "err"
                        ? "var(--color-err)"
                        : "var(--color-ink)",
                }}
              >
                {input.length ? (
                  input.map((v, i) => (
                    <span key={i} className="px-2.5 py-0.5 bg-surface-2 rounded-lg">
                      {isWord ? pool[v] : v}
                    </span>
                  ))
                ) : (
                  <span className="text-ink-4">…</span>
                )}
              </div>
              {isDigit ? (
                <div className="grid grid-cols-5 gap-2 w-full">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onPointerDown={() => pushDigit(d)}
                      disabled={!!fb}
                      className="h-[54px] rounded-xl border border-border-strong bg-surface text-ink font-bold text-[22px] tabular-nums"
                      style={{ cursor: fb ? "default" : "pointer" }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              ) : null}
              {isWord ? (
                <div className="flex flex-wrap gap-2 justify-center">
                  {Array.from(
                    new Set([
                      ...sample(pool, Math.min(8, pool.length)),
                      ...seq.map((i) => pool[i]),
                    ]),
                  )
                    .slice(0, 9)
                    .map((w, i) => (
                      <button
                        key={i}
                        type="button"
                        onPointerDown={() => setInput((cur) => [...cur, pool.indexOf(w as string)])}
                        disabled={!!fb}
                        className="px-3.5 py-2.5 rounded-xl border border-border-strong bg-surface text-ink font-semibold text-[15px]"
                        style={{ cursor: fb ? "default" : "pointer" }}
                      >
                        {w}
                      </button>
                    ))}
                </div>
              ) : null}
              <div className="flex gap-2.5">
                <Button variant="secondary" onClick={() => setInput([])} disabled={!!fb}>
                  Tozalash
                </Button>
                <Button onClick={() => submit(input)} disabled={!input.length || !!fb}>
                  Tasdiqlash <Check className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : null}

          {stage === "show" ? <div className="text-sm text-ink-3">Eslab qoling…</div> : null}
        </div>
      }
      done={
        <TrainingDone
          score={score}
          accuracy={best / maxLen}
          duration={Date.now() - startRef.current}
          level={best}
          onAgain={start}
          onBack={onAbort}
        />
      }
      hint={stage === "show" ? <span>Eslab qoling…</span> : <span>Ketma-ketlikni kiriting</span>}
    />
  );
}
