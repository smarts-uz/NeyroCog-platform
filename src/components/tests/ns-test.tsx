"use client";

import { Button } from "@/components/ui/button";
import { NS_SCALES, estimatePOCD, pocdSeverity } from "@/lib/tests/ns-scales";
import { cn } from "@/lib/utils";
import { Check, Star } from "lucide-react";
import { useMemo, useState } from "react";
import type { TestComponentProps } from "./shared";
import { TestIntro, TestShell } from "./shared";

export function NSTest({ patient, onAbort, onFinish }: TestComponentProps) {
  const age = patient.yosh || 10;
  const [phase, setPhase] = useState<"intro" | "running">("intro");
  const [vals, setVals] = useState<Record<string, number>>(() =>
    Object.fromEntries(NS_SCALES.map((s) => [s.key, Math.round(s.norm(age))])),
  );

  const set = (k: string, v: number) => setVals((f) => ({ ...f, [k]: v }));

  // Aggregat POCD (impact bilan vaznlangan)
  const aggregatePOCD = useMemo(() => {
    let weighted = 0;
    let weightSum = 0;
    for (const s of NS_SCALES) {
      const pocd = estimatePOCD(s, vals[s.key] ?? 0, age);
      if (pocd != null) {
        weighted += pocd * s.impact;
        weightSum += s.impact;
      }
    }
    return weightSum > 0 ? weighted / weightSum : 0;
  }, [vals, age]);

  const totalScore = useMemo(
    () => NS_SCALES.reduce((acc, s) => acc + (vals[s.key] ?? 0), 0),
    [vals],
  );
  const aggSev = pocdSeverity(aggregatePOCD);

  const submit = () => {
    const raw: Record<string, number> = {};
    for (const s of NS_SCALES) raw[s.key] = vals[s.key] ?? 0;
    void onFinish(raw);
  };

  return (
    <TestShell
      test="NS"
      patient={patient}
      phase={phase}
      onAbort={onAbort}
      done={null}
      intro={
        <TestIntro
          test="NS"
          title="Nevrologik holatni baholash"
          description="12 ta standartlashtirilgan nevrologik shkala. Har shkala uchun bemorga mos darajani tanlang — yondagi izoh klinik ma'noni ko'rsatadi, real vaqtda POCD bahosi hisoblanadi."
          steps={[
            "Har shkala uchun bemor holatiga mos darajani tanlang.",
            "Tanlash bilan o'sha shkaladagi POCD ta'siri darhol ko'rinadi.",
            "★ belgisi — POCD ga eng sezgir shkalalar (NQ nutq, UY uyqu).",
            "Yuqorida — barcha shkalalar bo'yicha o'rtacha (vaznlangan) POCD bahosi.",
          ]}
          onStart={() => setPhase("running")}
          ctaLabel="Baholashni boshlash"
        />
      }
      body={
        <div className="w-full max-w-[860px] flex flex-col gap-3">
          {/* Sticky aggregate header */}
          <div className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-surface border border-border rounded-xl px-5 py-3 shadow-sm">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-ink-3 font-semibold">
                Tahminiy POCD (12 shkala o'rtacha)
              </div>
              <div className="flex items-baseline gap-2">
                <span
                  className="font-mono font-bold text-2xl tabular-nums"
                  style={{ color: aggSev.color }}
                >
                  {aggregatePOCD.toFixed(0)}
                </span>
                <span className="text-sm font-medium" style={{ color: aggSev.color }}>
                  {aggSev.label}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-wider text-ink-3 font-semibold">
                Jami ball
              </div>
              <div className="font-mono font-bold text-lg tabular-nums text-ink">{totalScore}</div>
            </div>
            <Button onClick={submit}>
              <Check className="h-4 w-4" />
              Saqlash
            </Button>
          </div>

          {NS_SCALES.map((scale) => {
            const value = vals[scale.key] ?? 0;
            const pocd = estimatePOCD(scale, value, age);
            const sev = pocdSeverity(pocd);
            const level = scale.levels.find((l) => l.v === value) ?? scale.levels[0];
            return (
              <div
                key={scale.key}
                className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-2.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-surface-2 text-ink-2 border border-border">
                      {scale.code}
                    </span>
                    <span className="font-semibold text-sm text-ink">{scale.name}</span>
                    {scale.sensitive ? (
                      <span className="inline-flex items-center gap-0.5 text-[11px] text-amber-700 font-semibold">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                        SEZGIR
                      </span>
                    ) : null}
                    <span className="text-[11px] text-ink-4 font-mono">{scale.abbr}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-ink-3">
                      norma: <b className="text-ink-2 font-mono">{scale.norm(age).toFixed(1)}</b>
                    </span>
                    <span className="text-ink-3">
                      ta'sir:{" "}
                      <b className="text-ink-2 font-mono">{Math.round(scale.impact * 100)}%</b>
                    </span>
                    {pocd != null ? (
                      <span
                        className="font-semibold px-2 py-0.5 rounded-pill"
                        style={{ color: sev.color, background: `${sev.color}1A` }}
                      >
                        POCD ≈ {pocd.toFixed(0)} · {sev.label}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Value buttons */}
                <div className="flex flex-wrap gap-1.5">
                  {scale.levels.map((lvl) => (
                    <button
                      key={lvl.v}
                      type="button"
                      title={lvl.desc}
                      onClick={() => set(scale.key, lvl.v)}
                      className={cn(
                        "flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg border text-xs transition-colors min-w-[64px]",
                        value === lvl.v
                          ? "bg-primary text-white border-primary"
                          : "bg-surface-2 text-ink-2 border-border hover:border-border-strong",
                      )}
                    >
                      <span className="font-mono font-bold">{lvl.v}</span>
                      <span
                        className={cn(
                          "text-[10px]",
                          value === lvl.v ? "text-white/90" : "text-ink-3",
                        )}
                      >
                        {lvl.short}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Selected level description */}
                {level ? <p className="text-[12px] text-ink-3 m-0">{level.desc}</p> : null}
              </div>
            );
          })}
        </div>
      }
    />
  );
}
