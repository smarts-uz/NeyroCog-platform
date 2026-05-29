"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, CheckCircle2 } from "lucide-react";
import { useRef, useState } from "react";
import type { TestComponentProps } from "./shared";
import { TestIntro, TestShell } from "./shared";

const DST_SHOW_MS = 1000;
const DST_GAP_MS = 350;

function randDigits(len: number): number[] {
  const arr: number[] = [];
  let last = -1;
  while (arr.length < len) {
    const d = Math.floor(Math.random() * 10);
    if (d !== last) {
      arr.push(d);
      last = d;
    }
  }
  return arr;
}

type Mode = "forward" | "backward";
type ShowPhase = "idle" | "showing" | "input";

export function DSTTest({ patient, onAbort, onFinish }: TestComponentProps) {
  const [phase, setPhase] = useState<"intro" | "running" | "done">("intro");
  const [mode, setMode] = useState<Mode>("forward");
  const [span, setSpan] = useState(3);
  const [sequence, setSequence] = useState<number[]>([]);
  const [showingDigit, setShowingDigit] = useState<number | null>(null);
  const [showPhase, setShowPhase] = useState<ShowPhase>("idle");
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<"ok" | "err" | null>(null);
  const [forwardBest, setForwardBest] = useState(0);
  const [backwardBest, setBackwardBest] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Refs to read latest game state inside timeouts
  const modeRef = useRef<Mode>("forward");
  const spanRef = useRef(3);
  const failsRef = useRef(0);
  const fwdRef = useRef(0);
  const bwdRef = useRef(0);
  const finishedRef = useRef(false);

  const showSequence = (seq: number[]) => {
    setShowPhase("showing");
    setInput("");
    let i = 0;
    const showNext = () => {
      if (i >= seq.length) {
        setTimeout(() => {
          setShowingDigit(null);
          setShowPhase("input");
          setTimeout(() => inputRef.current?.focus(), 50);
        }, 300);
        return;
      }
      setShowingDigit(seq[i] ?? null);
      i++;
      setTimeout(() => {
        setShowingDigit(null);
        setTimeout(showNext, DST_GAP_MS);
      }, DST_SHOW_MS);
    };
    showNext();
  };

  const start = () => {
    setPhase("running");
    setMode("forward");
    modeRef.current = "forward";
    setSpan(3);
    spanRef.current = 3;
    failsRef.current = 0;
    setForwardBest(0);
    setBackwardBest(0);
    fwdRef.current = 0;
    bwdRef.current = 0;
    finishedRef.current = false;
    const seq = randDigits(3);
    setSequence(seq);
    setTimeout(() => showSequence(seq), 600);
  };

  const nextStage = () => {
    if (modeRef.current === "forward") {
      modeRef.current = "backward";
      setMode("backward");
      spanRef.current = 2;
      setSpan(2);
      failsRef.current = 0;
      const seq = randDigits(2);
      setSequence(seq);
      setTimeout(() => showSequence(seq), 600);
    } else {
      setPhase("done");
      if (!finishedRef.current) {
        finishedRef.current = true;
        setTimeout(() => {
          void onFinish({ forward: fwdRef.current, backward: bwdRef.current });
        }, 800);
      }
    }
  };

  const submitAnswer = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (showPhase !== "input" || feedback) return;
    const userDigits = input
      .split("")
      .filter((c) => /\d/.test(c))
      .map(Number);
    const expected = modeRef.current === "forward" ? sequence : [...sequence].reverse();
    const ok =
      userDigits.length === expected.length && userDigits.every((d, i) => d === expected[i]);

    setFeedback(ok ? "ok" : "err");

    setTimeout(() => {
      setFeedback(null);
      if (ok) {
        if (modeRef.current === "forward") {
          fwdRef.current = Math.max(fwdRef.current, spanRef.current);
          setForwardBest(fwdRef.current);
        } else {
          bwdRef.current = Math.max(bwdRef.current, spanRef.current);
          setBackwardBest(bwdRef.current);
        }
        const maxSpan = modeRef.current === "forward" ? 9 : 8;
        if (spanRef.current >= maxSpan) {
          nextStage();
        } else {
          spanRef.current += 1;
          setSpan(spanRef.current);
          failsRef.current = 0;
          const seq = randDigits(spanRef.current);
          setSequence(seq);
          setTimeout(() => showSequence(seq), 600);
        }
      } else {
        failsRef.current += 1;
        if (failsRef.current >= 2) {
          nextStage();
        } else {
          const seq = randDigits(spanRef.current);
          setSequence(seq);
          setTimeout(() => showSequence(seq), 600);
        }
      }
    }, 700);
  };

  const expectedLen = sequence.length;

  return (
    <TestShell
      test="DST"
      patient={patient}
      phase={phase}
      onAbort={onAbort}
      metrics={
        phase !== "intro"
          ? [
              { label: "Bosqich", value: mode === "forward" ? "To'g'ri" : "Teskari" },
              { label: "Hozirgi span", value: span, mono: true },
              { label: "Forward", value: forwardBest, tone: "ok", mono: true },
              { label: "Backward", value: backwardBest, tone: "ok", mono: true },
            ]
          : undefined
      }
      intro={
        <TestIntro
          test="DST"
          title="Digit Span Test (DST)"
          description="Ekranda raqamlar ketma-ket ko'rinadi. Sizning vazifangiz — ularni ko'rsatilganidek qaytarib yozish."
          steps={[
            "Birinchi bosqich (Forward) — raqamlarni ko'rsatilgan tartibda yozing.",
            "Ikkinchi bosqich (Backward) — raqamlarni teskari tartibda yozing.",
            "Har safar yozish to'g'ri bo'lsa, navbatdagi ketma-ketlik bir raqamga uzunroq bo'ladi.",
            "Bir uzunlikda ikki marta xato bo'lsa — bosqich tugaydi.",
          ]}
          onStart={start}
        />
      }
      body={
        <div className="flex flex-col items-center gap-8 w-full max-w-[560px]">
          {showPhase === "showing" ? (
            <div className="w-60 h-60 rounded-3xl bg-ink text-white grid place-items-center font-extrabold text-[140px] tracking-tight shadow-lg">
              {showingDigit ?? ""}
            </div>
          ) : null}

          {showPhase === "input" ? (
            <form onSubmit={submitAnswer} className="w-full flex flex-col gap-4 items-center">
              <div className="text-base text-ink-2 text-center">
                {mode === "forward" ? (
                  <>
                    Endi <b className="text-ink">{expectedLen} ta raqamni</b> ko'rsatilgan tartibda
                    yozing
                  </>
                ) : (
                  <>
                    Endi <b className="text-ink">{expectedLen} ta raqamni</b>{" "}
                    <b className="text-accent">teskari</b> tartibda yozing
                  </>
                )}
              </div>
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value.replace(/\D/g, ""))}
                disabled={Boolean(feedback)}
                inputMode="numeric"
                maxLength={expectedLen}
                autoComplete="off"
                className="!h-auto text-[clamp(32px,11vw,56px)] font-bold text-center tracking-[0.2em] py-4 w-full max-w-[380px] tabular-nums"
                style={{
                  borderColor:
                    feedback === "ok"
                      ? "var(--color-ok)"
                      : feedback === "err"
                        ? "var(--color-err)"
                        : undefined,
                }}
              />
              <Button type="submit" size="lg" disabled={!input || Boolean(feedback)}>
                Tasdiqlash
                <Check className="h-4 w-4" />
              </Button>
            </form>
          ) : null}

          {showPhase === "idle" ? <div className="text-ink-3">Tayyorlanmoqda…</div> : null}
        </div>
      }
      done={
        <div className="text-center">
          <CheckCircle2 className="h-16 w-16 text-ok mx-auto" />
          <div className="font-bold text-2xl text-ink mt-3">Test yakunlandi</div>
          <div className="text-[15px] text-ink-2 mt-2">
            Forward: <b>{forwardBest}</b> · Backward: <b>{backwardBest}</b>
          </div>
        </div>
      }
      hint={
        showPhase === "showing" ? (
          <span>Raqamlarni eslab qoling…</span>
        ) : (
          <span>
            Raqamlarni{" "}
            <b className="text-ink">
              {mode === "forward" ? "ko'rsatilgan tartibda" : "TESKARI tartibda"}
            </b>{" "}
            yozing
          </span>
        )
      }
    />
  );
}
