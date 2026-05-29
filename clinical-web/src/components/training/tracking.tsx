"use client";

import { TRAINING_META } from "@/lib/training/meta";
import { useEffect, useRef, useState } from "react";
import type { TrainingComponentProps, TrainingResult } from "./shared";
import { TrainingDone, TrainingIntro, TrainingShell } from "./shared";

const TR_DURATION = 45000;
const TR_TARGET_RADIUS = 28;
const TR_LEVEL_MS = 10000;
const W = 720;
const H = 480;
const ex = TRAINING_META.tracking;

export function TrackingTraining({ patient, onAbort, onFinish }: TrainingComponentProps) {
  const [phase, setPhase] = useState<"intro" | "running" | "done">("intro");
  const [elapsed, setElapsed] = useState(0);
  const [score, setScore] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [inside, setInside] = useState(false);
  const [, forceRender] = useState(0);
  const [saving, setSaving] = useState(false);

  const fieldRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef({ x: 360, y: 240, vx: 60, vy: 50 });
  const lastTickRef = useRef(0);
  const insideAccumRef = useRef(0);
  const cursorRef = useRef({ x: 0, y: 0 });
  const scoreRef = useRef(0);
  const sessionStartRef = useRef(0);
  const resultRef = useRef<TrainingResult | null>(null);

  useEffect(() => {
    if (phase !== "running") return;
    let raf = 0;
    let stopped = false;
    const tick = () => {
      if (stopped) return;
      const now = Date.now();
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      const el = now - sessionStartRef.current;
      setElapsed(el);

      const t = targetRef.current;
      const speedMul = 1 + Math.floor(el / TR_LEVEL_MS) * 0.35;
      t.x += t.vx * dt * speedMul;
      t.y += t.vy * dt * speedMul;
      if (Math.random() < 0.02) t.vx += (Math.random() - 0.5) * 80;
      if (Math.random() < 0.02) t.vy += (Math.random() - 0.5) * 80;
      if (t.x < TR_TARGET_RADIUS) {
        t.x = TR_TARGET_RADIUS;
        t.vx = Math.abs(t.vx);
      }
      if (t.x > W - TR_TARGET_RADIUS) {
        t.x = W - TR_TARGET_RADIUS;
        t.vx = -Math.abs(t.vx);
      }
      if (t.y < TR_TARGET_RADIUS) {
        t.y = TR_TARGET_RADIUS;
        t.vy = Math.abs(t.vy);
      }
      if (t.y > H - TR_TARGET_RADIUS) {
        t.y = H - TR_TARGET_RADIUS;
        t.vy = -Math.abs(t.vy);
      }
      const maxV = 220 + Math.floor(el / TR_LEVEL_MS) * 60;
      const vmag = Math.hypot(t.vx, t.vy);
      if (vmag > maxV) {
        t.vx = (t.vx / vmag) * maxV;
        t.vy = (t.vy / vmag) * maxV;
      }

      const dx = cursorRef.current.x - t.x;
      const dy = cursorRef.current.y - t.y;
      const isInside = Math.hypot(dx, dy) < TR_TARGET_RADIUS;
      setInside(isInside);
      if (isInside) {
        insideAccumRef.current += dt * 1000;
        scoreRef.current += Math.round(dt * 60 * speedMul);
        setScore(scoreRef.current);
      }
      forceRender((n) => n + 1); // reposition target each frame

      if (el >= TR_DURATION) {
        stopped = true;
        const duration = el;
        resultRef.current = {
          exerciseId: "tracking",
          score: scoreRef.current,
          accuracy: insideAccumRef.current / duration,
          duration,
          level: Math.floor(duration / TR_LEVEL_MS) + 1,
          raw: { insideMs: insideAccumRef.current },
        };
        setPhase("done");
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
    };
  }, [phase]);

  const start = () => {
    setElapsed(0);
    setScore(0);
    insideAccumRef.current = 0;
    scoreRef.current = 0;
    targetRef.current = { x: 360, y: 240, vx: 60, vy: 50 };
    sessionStartRef.current = Date.now();
    lastTickRef.current = Date.now();
    setPhase("running");
  };

  const onPointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = fieldRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = "touches" in e ? e.touches[0]?.clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0]?.clientY : e.clientY;
    if (clientX == null || clientY == null) return;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    cursorRef.current = { x, y };
    setCursorPos({ x, y });
  };

  const t = targetRef.current;
  const remainSec = Math.max(0, Math.ceil((TR_DURATION - elapsed) / 1000));
  const accuracy = elapsed > 0 ? insideAccumRef.current / elapsed : 0;
  const level = Math.floor(elapsed / TR_LEVEL_MS) + 1;

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
              { label: "Vaqt", value: `${remainSec} s`, mono: true },
              {
                label: "Aniqlik",
                value: `${Math.round(accuracy * 100)}%`,
                tone: accuracy > 0.5 ? "ok" : "neutral",
                mono: true,
              },
              { label: "Ball", value: score, mono: true },
            ]
          : undefined
      }
      intro={
        <TrainingIntro
          exercise={ex}
          description="Ekran bo'ylab harakatlanayotgan nishonni sichqoncha (yoki barmoq) bilan kuzatib boring. Kursoringiz nishon ichida bo'lganda — ball oladi."
          instructions={[
            "Maydonga sichqonchani olib boring va nishon ustiga yo'naltiring.",
            "Nishon harakatlanadi — uni doimo kuzatib turing.",
            "Kursor nishon ichida bo'lgan har sekund uchun ball beriladi.",
            "Daraja har 10 sonda oshadi — nishon tezroq harakatlanadi.",
          ]}
          duration="45 son"
          onStart={start}
        />
      }
      body={
        <div
          ref={fieldRef}
          onMouseMove={onPointerMove}
          onTouchMove={onPointerMove}
          className="relative bg-surface rounded-[18px] shadow-md overflow-hidden cursor-none transition-colors"
          style={{
            width: W,
            height: H,
            maxWidth: "100%",
            border: inside ? "3px solid var(--color-ok)" : "1px solid var(--color-border)",
            backgroundImage:
              "radial-gradient(circle, rgba(15, 118, 110, 0.04) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        >
          <div
            className="absolute rounded-pill grid place-items-center pointer-events-none transition-colors"
            style={{
              left: t.x - TR_TARGET_RADIUS,
              top: t.y - TR_TARGET_RADIUS,
              width: TR_TARGET_RADIUS * 2,
              height: TR_TARGET_RADIUS * 2,
              background: inside ? "var(--color-ok)" : "var(--color-primary)",
              boxShadow: inside
                ? "0 0 0 12px rgba(22, 163, 74, 0.15)"
                : "0 0 0 12px rgba(15, 118, 110, 0.10)",
            }}
          >
            <div className="w-2.5 h-2.5 rounded-pill bg-white/80" />
          </div>
          <div
            className="absolute w-4 h-4 rounded-pill border-2 border-ink pointer-events-none bg-white/50"
            style={{ left: cursorPos.x - 8, top: cursorPos.y - 8 }}
          />
        </div>
      }
      done={
        <TrainingDone
          score={resultRef.current?.score ?? score}
          accuracy={resultRef.current?.accuracy ?? accuracy}
          duration={resultRef.current?.duration ?? elapsed}
          level={level}
          onAgain={start}
          onBack={save}
          saving={saving}
        />
      }
      hint={
        <span>
          Nishonni doimo <b className="text-ink">kursor ichida</b> ushlab turing
        </span>
      }
    />
  );
}
