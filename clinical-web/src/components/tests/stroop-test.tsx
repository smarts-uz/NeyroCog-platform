"use client";

import { CheckCircle2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { TestComponentProps } from "./shared";
import { TestIntro, TestShell } from "./shared";

const STROOP_COLORS = [
  { name: "Qizil", word: "QIZIL", hex: "#DC2626" },
  { name: "Ko'k", word: "KO'K", hex: "#2563EB" },
  { name: "Yashil", word: "YASHIL", hex: "#16A34A" },
  { name: "Sariq", word: "SARIQ", hex: "#CA8A04" },
];
const STROOP_TRIALS = 40;
const STROOP_TRIAL_TIMEOUT = 6000;

interface Trial {
  wordIdx: number;
  inkIdx: number;
}

function generateTrials(n: number): Trial[] {
  const trials: Trial[] = [];
  for (let i = 0; i < n; i++) {
    const wordIdx = Math.floor(Math.random() * STROOP_COLORS.length);
    let inkIdx: number;
    if (Math.random() < 0.75) {
      do {
        inkIdx = Math.floor(Math.random() * STROOP_COLORS.length);
      } while (inkIdx === wordIdx);
    } else {
      inkIdx = wordIdx;
    }
    trials.push({ wordIdx, inkIdx });
  }
  return trials;
}

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export function StroopTest({ patient, onAbort, onFinish }: TestComponentProps) {
  const [phase, setPhase] = useState<"intro" | "running" | "done">("intro");
  const [trials, setTrials] = useState<Trial[]>([]);
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [errors, setErrors] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [feedback, setFeedback] = useState<"ok" | "err" | "skip" | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number>(0);
  const finishedRef = useRef(false);

  // Elapsed timer
  useEffect(() => {
    if (phase !== "running") return;
    const id = setInterval(() => setElapsed(Date.now() - startTimeRef.current), 100);
    return () => clearInterval(id);
  }, [phase]);

  const finish = useCallback(
    (c: number, e: number, sk: number) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      const totalTimeSec = (Date.now() - startTimeRef.current) / 1000;
      setPhase("done");
      setTimeout(() => {
        void onFinish({
          correct: c,
          errors: e,
          skipped: sk,
          totalTrials: STROOP_TRIALS,
          totalTimeSec,
        });
      }, 700);
    },
    [onFinish],
  );

  const advance = useCallback(
    (c: number, e: number, sk: number) => {
      setFeedback(null);
      setIdx((prev) => {
        const next = prev + 1;
        if (next >= STROOP_TRIALS) {
          finish(c, e, sk);
          return prev;
        }
        return next;
      });
    },
    [finish],
  );

  // Trial timeout (skip)
  useEffect(() => {
    if (phase !== "running" || feedback) return;
    const timer = setTimeout(() => {
      setFeedback("skip");
      const sk = skipped + 1;
      setSkipped(sk);
      setTimeout(() => advance(correct, errors, sk), 350);
    }, STROOP_TRIAL_TIMEOUT);
    return () => clearTimeout(timer);
  }, [phase, idx, feedback, advance, correct, errors, skipped]);

  const start = () => {
    setTrials(generateTrials(STROOP_TRIALS));
    setIdx(0);
    setCorrect(0);
    setErrors(0);
    setSkipped(0);
    setElapsed(0);
    finishedRef.current = false;
    startTimeRef.current = Date.now();
    setPhase("running");
  };

  const onAnswer = (chosenIdx: number) => {
    if (phase !== "running" || feedback) return;
    const trial = trials[idx];
    if (!trial) return;
    if (chosenIdx === trial.inkIdx) {
      const c = correct + 1;
      setCorrect(c);
      setFeedback("ok");
      setTimeout(() => advance(c, errors, skipped), 280);
    } else {
      const e = errors + 1;
      setErrors(e);
      setFeedback("err");
      setTimeout(() => advance(correct, e, skipped), 280);
    }
  };

  const trial = trials[idx];

  return (
    <TestShell
      test="Stroop"
      patient={patient}
      phase={phase}
      onAbort={onAbort}
      metrics={
        phase !== "intro"
          ? [
              { label: "Vaqt", value: formatMs(elapsed), icon: "play", mono: true },
              { label: "To'g'ri", value: correct, tone: "ok", mono: true },
              { label: "Xato", value: errors, tone: errors ? "err" : "neutral", mono: true },
              { label: "Trial", value: `${idx + 1} / ${STROOP_TRIALS}`, mono: true },
            ]
          : undefined
      }
      intro={
        <TestIntro
          test="Stroop"
          title="Stroop testi"
          description="Ekranda rangli so'z paydo bo'ladi. Sizning vazifangiz — so'zning ma'nosini emas, balki yozilgan rangini tanlash."
          steps={[
            "Har bir slayd uchun pastdagi 4 ta tugmadan to'g'ri rangni tanlang.",
            "Iloji boricha tez va aniq javob bering.",
            "Agar 6 soniya javob bermasangiz — slayd o'tkazib yuboriladi.",
            `Jami ${STROOP_TRIALS} ta slayd. So'ng natija ko'rsatiladi.`,
          ]}
          note="Diqqat: so'zning rangi muhim, mazmuni emas!"
          onStart={start}
        />
      }
      body={
        trial ? (
          <div className="flex flex-col items-center gap-6 sm:gap-12 w-full">
            <div
              className="w-full max-w-[480px] h-40 sm:h-[200px] bg-surface rounded-3xl flex items-center justify-center shadow-md px-4 sm:px-12 transition-colors"
              style={{
                border:
                  feedback === "ok"
                    ? "3px solid var(--color-ok)"
                    : feedback === "err"
                      ? "3px solid var(--color-err)"
                      : feedback === "skip"
                        ? "3px solid var(--color-warn)"
                        : "1px solid var(--color-border)",
              }}
            >
              <div
                className="font-extrabold text-[clamp(52px,18vw,96px)] tracking-tight select-none"
                style={{ color: STROOP_COLORS[trial.inkIdx]?.hex }}
              >
                {STROOP_COLORS[trial.wordIdx]?.word}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3.5 w-full max-w-[480px] sm:max-w-none sm:w-auto">
              {STROOP_COLORS.map((c, i) => (
                <button
                  key={c.name}
                  type="button"
                  onPointerDown={() => onAnswer(i)}
                  disabled={Boolean(feedback)}
                  className="w-full sm:w-[130px] h-16 sm:h-[76px] rounded-2xl text-white font-bold text-base sm:text-lg tracking-wide shadow-sm transition-opacity"
                  style={{
                    background: c.hex,
                    opacity: feedback === "err" && i !== trial.inkIdx ? 0.5 : 1,
                  }}
                >
                  {c.name.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        ) : null
      }
      done={
        <div className="text-center">
          <CheckCircle2 className="h-16 w-16 text-ok mx-auto" />
          <div className="font-bold text-2xl text-ink mt-3">Test yakunlandi</div>
        </div>
      }
      hint={
        <span>
          So'zning <b className="text-ink">RANGINI</b> tanlang, mazmunini emas.
        </span>
      }
    />
  );
}
