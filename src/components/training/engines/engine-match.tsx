"use client";

import { useRef, useState } from "react";
import type { EngineComponentProps, TrainingPhase } from "../shared";
import { TrainingDone, TrainingIntro, TrainingShell } from "../shared";
import { shuffle } from "./util";

interface MatchCard {
  id: number;
  pair: number;
  label: string;
}

/** EngMatch — xotira juftlarini topish (konsentratsiya). */
export function EngMatch({ patient, exercise, onAbort, onFinish }: EngineComponentProps) {
  const c = exercise.config ?? {};
  const nPairs = typeof c.pairs === "number" ? c.pairs : 6;
  const items = c.items ?? [];

  const [phase, setPhase] = useState<TrainingPhase>("intro");
  const [cards, setCards] = useState<MatchCard[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const startRef = useRef(0);
  const lockRef = useRef(false);
  const scoreRef = useRef(0);
  const movesRef = useRef(0);

  const build = () => {
    const picked = shuffle(items).slice(0, nPairs);
    const deck = shuffle(
      picked.flatMap((label, i) => [
        { id: i * 2, pair: i, label },
        { id: i * 2 + 1, pair: i, label },
      ]),
    );
    setCards(deck);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    movesRef.current = 0;
    setScore(0);
    scoreRef.current = 0;
  };
  const start = () => {
    setPhase("running");
    build();
    startRef.current = Date.now();
  };

  const flip = (idx: number) => {
    if (lockRef.current) return;
    const card = cards[idx];
    if (!card) return;
    if (flipped.includes(idx) || matched.includes(card.pair)) return;
    const nf = [...flipped, idx];
    setFlipped(nf);
    if (nf.length === 2) {
      movesRef.current += 1;
      setMoves(movesRef.current);
      lockRef.current = true;
      const [a, b] = nf;
      const ca = cards[a as number];
      const cb = cards[b as number];
      if (ca && cb && ca.pair === cb.pair) {
        setTimeout(() => {
          const nm = [...matched, ca.pair];
          setMatched(nm);
          setFlipped([]);
          scoreRef.current += 20;
          setScore(scoreRef.current);
          lockRef.current = false;
          if (nm.length === nPairs) {
            setPhase("done");
            const moveCount = movesRef.current;
            setTimeout(
              () =>
                void onFinish({
                  exerciseId: exercise.id,
                  score: scoreRef.current,
                  accuracy: nPairs / Math.max(nPairs, moveCount),
                  duration: Date.now() - startRef.current,
                  level: nPairs,
                }),
              700,
            );
          }
        }, 450);
      } else {
        scoreRef.current = Math.max(0, scoreRef.current - 4);
        setScore(scoreRef.current);
        setTimeout(() => {
          setFlipped([]);
          lockRef.current = false;
        }, 800);
      }
    }
  };

  const cols = nPairs <= 8 ? 4 : 6;

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
                label: "Juftlar",
                value: `${matched.length}/${nPairs}`,
                icon: "copy",
                tone: "primary",
                mono: true,
              },
              { label: "Yurishlar", value: moves, icon: "move", mono: true },
              { label: "Ball", value: score, icon: "star", mono: true },
            ]
          : undefined
      }
      intro={
        <TrainingIntro
          exercise={exercise}
          description={exercise.description}
          instructions={[
            "Kartochkalar yashirin. Bittasini bosib oching.",
            "Ikkinchisini bosib, juftini toping.",
            "Mos kelsa — ochiq qoladi.",
            "Barcha juftlarni eng kam yurishda toping.",
          ]}
          duration={exercise.duration}
          onStart={start}
        />
      }
      body={
        <div
          className="grid gap-2.5 w-[min(520px,92vw)]"
          style={{ gridTemplateColumns: `repeat(${cols},1fr)` }}
        >
          {cards.map((card, idx) => {
            const open = flipped.includes(idx) || matched.includes(card.pair);
            const isMatched = matched.includes(card.pair);
            return (
              <button
                key={card.id}
                type="button"
                onPointerDown={() => flip(idx)}
                className="rounded-[14px] border border-border-strong flex items-center justify-center font-bold text-center p-1"
                style={{
                  aspectRatio: "3/4",
                  cursor: "pointer",
                  fontSize: "clamp(13px,3.5vw,20px)",
                  background: open ? "var(--color-primary-soft)" : "var(--color-ink)",
                  color: open ? "var(--color-primary-press)" : "transparent",
                  boxShadow: isMatched ? "0 0 0 3px var(--color-ok)" : "var(--shadow-xs)",
                  transition:
                    "background 200ms var(--ease-confident), box-shadow 200ms var(--ease-confident)",
                }}
              >
                {open ? card.label : ""}
              </button>
            );
          })}
        </div>
      }
      done={
        <TrainingDone
          score={score}
          accuracy={nPairs / Math.max(nPairs, moves)}
          duration={Date.now() - startRef.current}
          level={nPairs}
          onAgain={start}
          onBack={onAbort}
        />
      }
      hint={<span>Juftlarni toping</span>}
    />
  );
}
