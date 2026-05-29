"use client";

import { Headphones, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { EngineComponentProps, TrainingPhase } from "../shared";
import { TrainingDone, TrainingIntro, TrainingShell } from "../shared";
import { playTone, rndInt } from "./util";

interface Tone {
  name: string;
  freq: number;
}
type AudioData = { count: number } | { seq: number[] } | { tone: number };

/** EngAudio — eshitish gnozisi: ohang/ketma-ketlik chalib, aniqlash. */
export function EngAudio({ patient, exercise, onAbort, onFinish }: EngineComponentProps) {
  const c = exercise.config ?? {};
  const mode = c.audioMode ?? "pitch";
  const rounds = c.rounds ?? 20;
  const TONES: Tone[] = c.tones ?? [
    { name: "Past", freq: 220 },
    { name: "O'rta", freq: 440 },
    { name: "Baland", freq: 880 },
    { name: "Tepa", freq: 1320 },
  ];

  const [phase, setPhase] = useState<TrainingPhase>("intro");
  const [idx, setIdx] = useState(0);
  const [played, setPlayed] = useState(false);
  const [fb, setFb] = useState<"ok" | "err" | null>(null);
  const [correct, setCorrect] = useState(0);
  const [errors, setErrors] = useState(0);
  const [score, setScore] = useState(0);
  const [cur, setCur] = useState<AudioData | null>(null);
  const [seqInput, setSeqInput] = useState<number[]>([]);

  const startRef = useRef(0);
  const answerRef = useRef<number | number[]>(0);
  const idxRef = useRef(0);
  const correctRef = useRef(0);
  const errorsRef = useRef(0);
  const scoreRef = useRef(0);

  const setup = (): AudioData => {
    if (mode === "count") {
      const n = 1 + rndInt(4);
      answerRef.current = n;
      return { count: n };
    }
    if (mode === "sequence") {
      const len = 2 + rndInt(2);
      const s = Array.from({ length: len }, () => rndInt(TONES.length));
      answerRef.current = s;
      return { seq: s };
    }
    const tone = rndInt(TONES.length);
    answerRef.current = tone;
    return { tone };
  };

  const playCurrent = (data: AudioData | null = cur) => {
    if (!data) return;
    if ("count" in data) {
      let i = 0;
      const beep = () => {
        if (i >= data.count) return;
        playTone(660, 200);
        i++;
        setTimeout(beep, 360);
      };
      beep();
    } else if ("seq" in data) {
      let i = 0;
      const beep = () => {
        if (i >= data.seq.length) return;
        const ti = data.seq[i];
        if (ti != null) playTone(TONES[ti]?.freq ?? 440, 420);
        i++;
        setTimeout(beep, 520);
      };
      beep();
    } else {
      playTone(TONES[data.tone]?.freq ?? 440, 700);
    }
    setPlayed(true);
  };

  useEffect(() => {
    if (phase !== "running") return;
    setPlayed(false);
    setFb(null);
    setSeqInput([]);
    const t = setTimeout(() => playCurrent(), 400);
    return () => clearTimeout(t);
  }, [phase, idx]);

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
    setCur(setup());
  };

  const judge = (ok: boolean) => {
    if (fb) return;
    if (ok) {
      correctRef.current += 1;
      setCorrect((x) => x + 1);
      scoreRef.current += 25;
      setScore((s) => s + 25);
      setFb("ok");
    } else {
      errorsRef.current += 1;
      setErrors((x) => x + 1);
      setFb("err");
    }
    setTimeout(() => {
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
      setCur(setup());
    }, 480);
  };

  const answerSeq = (arr: number[]) => {
    const exp = answerRef.current;
    judge(Array.isArray(exp) && arr.length === exp.length && arr.every((v, i) => v === exp[i]));
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
          instructions={[
            "Quloqchin yoki dinamikni ulang.",
            "Tovush yangraydi — diqqat bilan tinglang.",
            "Kerak bo'lsa qayta tinglang.",
            mode === "count"
              ? "Nechta signal eshitganingizni tanlang."
              : mode === "sequence"
                ? "Tovushlar ketma-ketligini takrorlang."
                : "Qaysi balandlikdagi tovush ekanini tanlang.",
          ]}
          duration={exercise.duration}
          onStart={start}
        />
      }
      body={
        <div className="flex flex-col items-center gap-8">
          <button
            type="button"
            onPointerDown={() => playCurrent()}
            className="w-[200px] h-[200px] rounded-full flex flex-col items-center justify-center gap-2.5 select-none"
            style={{
              background:
                fb === "ok"
                  ? "var(--color-ok-bg)"
                  : fb === "err"
                    ? "var(--color-err-bg)"
                    : played
                      ? "var(--color-primary-soft)"
                      : "var(--color-surface)",
              border: `2px solid ${played ? "var(--color-primary)" : "var(--color-border-strong)"}`,
              boxShadow: "var(--shadow-md)",
              cursor: "pointer",
            }}
          >
            {played ? (
              <Volume2 className="h-16 w-16" style={{ color: "var(--color-primary-press)" }} />
            ) : (
              <Headphones className="h-16 w-16" style={{ color: "var(--color-ink-3)" }} />
            )}
            <span className="font-semibold text-[13px] text-ink-3">
              {played ? "Qayta tinglash" : "Tinglash"}
            </span>
          </button>

          {mode === "pitch" ? (
            <div className="flex gap-3 w-[min(560px,92vw)] justify-center">
              {TONES.map((tn, i) => (
                <button
                  key={tn.name}
                  type="button"
                  onPointerDown={() => judge(i === answerRef.current)}
                  disabled={!played || !!fb}
                  className="flex-1 min-w-0 h-[84px] rounded-2xl border border-border-strong bg-surface text-ink font-semibold text-base flex flex-col items-center justify-center gap-1"
                  style={{ opacity: !played || fb ? 0.5 : 1, cursor: "pointer" }}
                >
                  <span>{tn.name}</span>
                  <span className="text-[11.5px] text-ink-3 tabular-nums">{tn.freq} Hz</span>
                </button>
              ))}
            </div>
          ) : null}

          {mode === "count" ? (
            <div className="flex gap-3">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  onPointerDown={() => judge(n === answerRef.current)}
                  disabled={!played || !!fb}
                  className="w-[72px] h-[72px] rounded-2xl border border-border-strong bg-surface text-ink font-extrabold text-[28px] tabular-nums"
                  style={{ opacity: !played || fb ? 0.5 : 1, cursor: "pointer" }}
                >
                  {n}
                </button>
              ))}
            </div>
          ) : null}

          {mode === "sequence" ? (
            <div className="flex flex-col gap-3.5 items-center">
              <div className="min-h-[30px] flex gap-1.5 font-bold text-ink tabular-nums">
                {seqInput.length ? (
                  seqInput.map((v, i) => (
                    <span key={i} className="px-2 py-0.5 bg-surface-2 rounded-md">
                      {TONES[v]?.name}
                    </span>
                  ))
                ) : (
                  <span className="text-ink-4">…</span>
                )}
              </div>
              <div className="flex gap-2.5 flex-wrap justify-center">
                {TONES.map((tn, i) => (
                  <button
                    key={tn.name}
                    type="button"
                    onPointerDown={() => {
                      const n = [...seqInput, i];
                      setSeqInput(n);
                      const exp = answerRef.current;
                      if (Array.isArray(exp) && n.length === exp.length) answerSeq(n);
                    }}
                    disabled={!played || !!fb}
                    className="px-4 py-3 rounded-[14px] border border-border-strong bg-surface text-ink font-semibold text-[15px]"
                    style={{ opacity: !played || fb ? 0.5 : 1, cursor: "pointer" }}
                  >
                    {tn.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
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
      hint={<span>Tovushni tinglab, javob bering</span>}
    />
  );
}
