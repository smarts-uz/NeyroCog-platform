"use client";

import { CheckCircle2, Headphones, Volume2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { TestComponentProps } from "./shared";
import { TestIntro, TestShell } from "./shared";

const AUDIO_TONES = [
  { name: "Past", freq: 220 },
  { name: "O'rta", freq: 440 },
  { name: "Baland", freq: 880 },
  { name: "Tepa", freq: 1320 },
];
const AUDIO_TRIALS = 30;
const AUDIO_TONE_DUR = 700;

let audioCtx: AudioContext | null = null;

function playTone(freq: number, durMs = AUDIO_TONE_DUR) {
  try {
    if (!audioCtx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new Ctor();
    }
    const ctx = audioCtx;
    if (ctx.state === "suspended") void ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durMs / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durMs / 1000 + 0.05);
  } catch (e) {
    console.warn("Audio playback failed:", e);
  }
}

function generateTrials(n: number): number[] {
  const trials: number[] = [];
  for (let i = 0; i < n; i++) trials.push(Math.floor(Math.random() * AUDIO_TONES.length));
  return trials;
}

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export function AudioTest({ patient, onAbort, onFinish }: TestComponentProps) {
  const [phase, setPhase] = useState<"intro" | "running" | "done">("intro");
  const [trials, setTrials] = useState<number[]>([]);
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [errors, setErrors] = useState(0);
  const [played, setPlayed] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [feedback, setFeedback] = useState<"ok" | "err" | null>(null);
  const startTimeRef = useRef(0);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (phase !== "running") return;
    const id = setInterval(() => setElapsed(Date.now() - startTimeRef.current), 100);
    return () => clearInterval(id);
  }, [phase]);

  const playCurrent = useCallback(() => {
    const tone = trials[idx];
    if (tone == null) return;
    playTone(AUDIO_TONES[tone]?.freq ?? 440);
    setPlayed(true);
  }, [trials, idx]);

  // Auto-play when trial changes
  useEffect(() => {
    if (phase !== "running") return;
    setPlayed(false);
    setFeedback(null);
    const t = setTimeout(() => playCurrent(), 400);
    return () => clearTimeout(t);
  }, [phase, playCurrent]);

  const start = () => {
    setTrials(generateTrials(AUDIO_TRIALS));
    setIdx(0);
    setCorrect(0);
    setErrors(0);
    setElapsed(0);
    finishedRef.current = false;
    startTimeRef.current = Date.now();
    setPhase("running");
  };

  const onAnswer = (chosen: number) => {
    if (!played || feedback) return;
    const expected = trials[idx];
    const isOk = chosen === expected;
    const c = isOk ? correct + 1 : correct;
    const e = isOk ? errors : errors + 1;
    if (isOk) setCorrect(c);
    else setErrors(e);
    setFeedback(isOk ? "ok" : "err");

    setTimeout(() => {
      const next = idx + 1;
      if (next >= AUDIO_TRIALS) {
        const totalTimeSec = (Date.now() - startTimeRef.current) / 1000;
        setPhase("done");
        if (!finishedRef.current) {
          finishedRef.current = true;
          setTimeout(() => {
            void onFinish({
              correct: c,
              errors: e,
              totalTrials: AUDIO_TRIALS,
              totalTimeSec,
            });
          }, 800);
        }
      } else {
        setIdx(next);
      }
    }, 450);
  };

  return (
    <TestShell
      test="Audio"
      patient={patient}
      phase={phase}
      onAbort={onAbort}
      metrics={
        phase !== "intro"
          ? [
              { label: "Vaqt", value: formatMs(elapsed), mono: true },
              { label: "To'g'ri", value: correct, tone: "ok", mono: true },
              { label: "Xato", value: errors, tone: errors ? "err" : "neutral", mono: true },
              { label: "Trial", value: `${idx + 1} / ${AUDIO_TRIALS}`, mono: true },
            ]
          : undefined
      }
      intro={
        <TestIntro
          test="Audio"
          title="Audio diqqat testi"
          description="Quloqchin orqali tovush yangraydi. Sizning vazifangiz — qaysi balandlikdagi tovush yangraganini tanlash."
          steps={[
            "Quloqchin yoki dinamikni ulaning va ovozni tinglovchi darajaga sozlang.",
            "Har trial avtomatik tovush yangraydi. Kerak bo'lsa qayta tinglash mumkin.",
            "Pastdagi 4 ta tugmadan to'g'ri balandlikni tanlang.",
            `Jami ${AUDIO_TRIALS} ta trial.`,
          ]}
          note="Brauzerda audio ishlashi uchun sahifani bosgan bo'lishingiz kerak."
          onStart={start}
        />
      }
      body={
        <div className="flex flex-col items-center gap-10">
          <button
            type="button"
            onClick={playCurrent}
            className="w-[220px] h-[220px] rounded-pill grid place-items-center shadow-md transition-colors cursor-pointer border-2"
            style={{
              background:
                feedback === "ok"
                  ? "var(--color-ok-bg)"
                  : feedback === "err"
                    ? "var(--color-err-bg)"
                    : played
                      ? "var(--color-primary-soft)"
                      : "var(--color-surface)",
              borderColor:
                feedback === "ok"
                  ? "var(--color-ok)"
                  : feedback === "err"
                    ? "var(--color-err)"
                    : played
                      ? "var(--color-primary)"
                      : "var(--color-border-strong)",
            }}
          >
            <div className="flex flex-col items-center gap-3">
              {played ? (
                <Volume2 className="h-[72px] w-[72px] text-primary-press" />
              ) : (
                <Headphones className="h-[72px] w-[72px] text-ink-3" />
              )}
              <div className="font-semibold text-[13px] text-ink-3">
                {played ? "Qayta tinglash" : "Tinglash"}
              </div>
            </div>
          </button>

          <div className="flex gap-3.5">
            {AUDIO_TONES.map((t, i) => (
              <button
                key={t.name}
                type="button"
                onClick={() => onAnswer(i)}
                disabled={!played || Boolean(feedback)}
                className="w-[130px] h-[90px] border border-border-strong rounded-2xl bg-surface text-ink font-semibold text-base flex flex-col items-center justify-center gap-1 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{t.name}</span>
                <span className="font-mono text-[11px] text-ink-3">{t.freq} Hz</span>
              </button>
            ))}
          </div>
        </div>
      }
      done={
        <div className="text-center">
          <CheckCircle2 className="h-16 w-16 text-ok mx-auto" />
          <div className="font-bold text-2xl text-ink mt-3">Test yakunlandi</div>
        </div>
      }
      hint={<span>Qaysi balandlikdagi tovush yangraganini tanlang</span>}
    />
  );
}
