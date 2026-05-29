"use client";

import { CheckCircle2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { TestComponentProps } from "./shared";
import { TestIntro, TestShell } from "./shared";

const TMT_N = 25;
const TMT_W = 1000;
const TMT_H = 580;

interface Node {
  id: number;
  x: number;
  y: number;
}

function generateNodes(n: number): Node[] {
  const cols = 6;
  const rows = 5;
  const padX = 70;
  const padY = 60;
  const cellW = (TMT_W - padX * 2) / (cols - 1);
  const cellH = (TMT_H - padY * 2) / (rows - 1);
  const pts: { x: number; y: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (pts.length >= n) break;
      const jx = (Math.random() - 0.5) * cellW * 0.45;
      const jy = (Math.random() - 0.5) * cellH * 0.55;
      pts.push({ x: padX + c * cellW + jx, y: padY + r * cellH + jy });
    }
  }
  for (let i = pts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = pts[i];
    const other = pts[j];
    if (tmp && other) {
      pts[i] = other;
      pts[j] = tmp;
    }
  }
  return pts.slice(0, n).map((p, i) => ({ id: i + 1, x: p.x, y: p.y }));
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const cs = Math.floor((ms % 1000) / 10);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

export function TMTTest({ patient, onAbort, onFinish }: TestComponentProps) {
  const [phase, setPhase] = useState<"intro" | "running" | "done">("intro");
  const [nodes, setNodes] = useState<Node[]>([]);
  const [current, setCurrent] = useState(1);
  const [completed, setCompleted] = useState<Node[]>([]);
  const [errors, setErrors] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [wrongFlash, setWrongFlash] = useState<number | null>(null);
  const startTimeRef = useRef(0);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (phase !== "running") return;
    const id = setInterval(() => setElapsed(Date.now() - startTimeRef.current), 50);
    return () => clearInterval(id);
  }, [phase]);

  const start = () => {
    setNodes(generateNodes(TMT_N));
    setCurrent(1);
    setCompleted([]);
    setErrors(0);
    setElapsed(0);
    finishedRef.current = false;
    startTimeRef.current = Date.now();
    setPhase("running");
  };

  const onNodeClick = (node: Node) => {
    if (phase !== "running") return;
    if (node.id === current) {
      const next = [...completed, node];
      setCompleted(next);
      if (node.id === TMT_N) {
        const final = Date.now() - startTimeRef.current;
        setElapsed(final);
        setPhase("done");
        if (!finishedRef.current) {
          finishedRef.current = true;
          setTimeout(() => {
            void onFinish({ aTime: final / 1000, aErrors: errors });
          }, 700);
        }
      } else {
        setCurrent((c) => c + 1);
      }
    } else {
      setErrors((e) => e + 1);
      setWrongFlash(node.id);
      setTimeout(() => setWrongFlash((curr) => (curr === node.id ? null : curr)), 400);
    }
  };

  const completedIds = new Set(completed.map((n) => n.id));

  return (
    <TestShell
      test="TMT"
      patient={patient}
      phase={phase}
      onAbort={onAbort}
      metrics={
        phase !== "intro"
          ? [
              { label: "Vaqt", value: formatTime(elapsed), mono: true },
              { label: "Xato", value: errors, tone: errors ? "err" : "neutral", mono: true },
              { label: "Bog'langan", value: `${completed.length} / ${TMT_N}`, mono: true },
            ]
          : undefined
      }
      intro={
        <TestIntro
          test="TMT"
          title="Trail Making Test, qism A"
          description="Ekranda 1 dan 25 gacha sonlar tartibsiz joylashgan doiralar paydo bo'ladi. Vazifa — ularni tartib bo'yicha bosib chiqish."
          steps={[
            "Sichqoncha yoki barmoq bilan doiralarni bosing.",
            "Noto'g'ri doira bosilsa — xatolar soni ortadi, davom eting.",
            "25-doiraga yetib borganingizda test yakunlanadi.",
          ]}
          note="Test taymeri 'Boshlash' tugmasini bosgan paytdan boshlanadi."
          onStart={start}
        />
      }
      body={
        <div className="rounded-lg overflow-hidden shadow-sm border border-border bg-surface">
          <svg
            viewBox={`0 0 ${TMT_W} ${TMT_H}`}
            width={TMT_W}
            height={TMT_H}
            className="block w-full max-w-full h-auto touch-none"
            role="img"
            aria-label="Trail Making Test board"
          >
            <defs>
              <pattern id="tmt-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="0.5" cy="0.5" r="0.5" fill="rgba(15, 23, 42, 0.08)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#tmt-grid)" />

            {completed.length >= 2 ? (
              <polyline
                points={completed.map((n) => `${n.x},${n.y}`).join(" ")}
                fill="none"
                stroke="#0F766E"
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity="0.7"
              />
            ) : null}

            {nodes.map((n) => {
              const isCompleted = completedIds.has(n.id);
              const isCurrent = phase === "running" && n.id === current;
              const isWrong = wrongFlash === n.id;
              const r = 26;
              let fill = "#FFFFFF";
              let stroke = "rgba(15, 23, 42, 0.18)";
              let textColor = "#0F172A";
              let strokeWidth = 2;
              if (isCompleted) {
                fill = "#0F766E";
                stroke = "#0F766E";
                textColor = "#FFFFFF";
              } else if (isCurrent) {
                fill = "#FEF3C7";
                stroke = "#D97706";
                strokeWidth = 3;
                textColor = "#92400E";
              }
              if (isWrong) {
                fill = "#FEE2E2";
                stroke = "#DC2626";
                strokeWidth = 3;
                textColor = "#991B1B";
              }
              return (
                <g
                  key={n.id}
                  style={{ cursor: phase === "running" && !isCompleted ? "pointer" : "default" }}
                  onPointerDown={() => !isCompleted && onNodeClick(n)}
                >
                  {isCurrent ? (
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={r + 8}
                      fill="none"
                      stroke="#D97706"
                      strokeWidth="2"
                      opacity="0.4"
                    >
                      <animate
                        attributeName="r"
                        values={`${r + 4};${r + 14};${r + 4}`}
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.5;0;0.5"
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  ) : null}
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={r}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                  />
                  <text
                    x={n.x}
                    y={n.y + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontFamily="Outfit"
                    fontSize="16"
                    fontWeight="700"
                    fill={textColor}
                    style={{ pointerEvents: "none", userSelect: "none" }}
                  >
                    {n.id}
                  </text>
                </g>
              );
            })}

            {phase === "done" ? (
              <g>
                <rect x="0" y="0" width="100%" height="100%" fill="rgba(15, 118, 110, 0.10)" />
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontFamily="Outfit"
                  fontSize="42"
                  fontWeight="800"
                  fill="#0F766E"
                >
                  Test yakunlandi
                </text>
              </g>
            ) : null}
          </svg>
        </div>
      }
      done={
        <div className="text-center">
          <CheckCircle2 className="h-16 w-16 text-ok mx-auto" />
          <div className="font-bold text-2xl text-ink mt-3">Test yakunlandi</div>
        </div>
      }
      hint={
        <>
          <span>Keyingisi:</span>
          <span className="inline-flex items-center justify-center min-w-[44px] h-11 px-3 rounded-pill bg-primary text-white font-bold text-lg tabular-nums">
            {current}
          </span>
          <span className="text-ink-3">
            Doiralarni <b className="text-ink">tartibda</b> bosib chiqing — 1 dan 25 gacha.
          </span>
        </>
      }
    />
  );
}
