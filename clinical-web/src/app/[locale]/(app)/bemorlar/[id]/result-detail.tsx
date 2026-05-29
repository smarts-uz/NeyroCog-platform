"use client";

import { ClinicalIcon } from "@/components/clinical-icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { isISPOCD } from "@/lib/engines/knbt";
import type { TestName, TestSummary, Tone } from "@/lib/engines/types";
import { TEST_BY_ID } from "@/lib/tests/meta";

const TONE_COLOR: Record<Tone, string> = {
  great: "#16A34A",
  good: "#2563EB",
  ok: "#4F46E5",
  warn: "#D97706",
  bad: "#DC2626",
  neutral: "#64748B",
};

export function ResultDetail({
  testId,
  summary,
  open,
  onOpenChange,
}: {
  testId: TestName | null;
  summary?: TestSummary;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  if (!testId || !summary) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Natija</DialogTitle>
            <DialogDescription>Ma'lumot yo'q</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const meta = TEST_BY_ID[testId];
  const color = TONE_COLOR[summary.tone];
  const cog = summary.cogScore ?? 0;
  const z = summary.zScore;
  // Z-scale: -3 .. +3 → 0..100%
  const zPct = z != null ? Math.max(0, Math.min(100, ((z + 3) / 6) * 100)) : 50;
  const ispcdPct = ((-1.96 + 3) / 6) * 100; // ISPOCD chegarasi

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <span
              className="h-8 w-8 rounded-lg grid place-items-center"
              style={{ background: meta.soft, color: meta.color }}
            >
              <ClinicalIcon name={meta.icon} size={16} />
            </span>
            {meta.name}
          </DialogTitle>
          <DialogDescription>
            {meta.short} · {summary.timepoint} · normativ: μ={summary.normRef.m}, σ=
            {summary.normRef.sd}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 pt-1">
          {/* CogScore */}
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-[11px] uppercase tracking-wider text-ink-3 font-semibold">
                CogScore
              </span>
              <span className="text-sm font-medium" style={{ color }}>
                {summary.cognitiveHealth}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-extrabold text-4xl tabular-nums" style={{ color }}>
                {summary.cogScore ?? "—"}
              </span>
              <span className="text-ink-3 text-sm">/ 100</span>
            </div>
            <div className="relative h-3 rounded-pill mt-2 bg-gradient-to-r from-[#FECACA] via-[#FEF3C7] to-[#DCFCE7]">
              <div
                className="absolute -top-1 -bottom-1 w-1.5 rounded-[3px]"
                style={{
                  left: `calc(${cog}% - 3px)`,
                  background: "var(--color-ink)",
                  boxShadow: "0 0 0 3px rgba(255,255,255,0.8)",
                }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[10px] font-mono text-ink-3">
              <span>0 og'ir</span>
              <span>50</span>
              <span>100 a'lo</span>
            </div>
          </div>

          {/* Z-score */}
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-[11px] uppercase tracking-wider text-ink-3 font-semibold">
                Z-score (normativ populyatsiyaga nisbatan)
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-pill ${
                  isISPOCD(z) ? "bg-err-bg text-red-900" : "bg-ok-bg text-green-900"
                }`}
              >
                ISPOCD: {isISPOCD(z) ? "Musbat" : "Manfiy"}
              </span>
            </div>
            <div className="font-mono font-bold text-2xl tabular-nums">{z?.toFixed(2) ?? "—"}</div>
            <div className="relative h-3 rounded-pill mt-2 bg-surface-2 border border-border">
              {/* ISPOCD chegarasi (-1.96) */}
              <div
                className="absolute top-0 bottom-0 border-l-2 border-dashed border-err"
                style={{ left: `${ispcdPct}%` }}
              />
              {z != null ? (
                <div
                  className="absolute -top-1 -bottom-1 w-1.5 rounded-[3px]"
                  style={{
                    left: `calc(${zPct}% - 3px)`,
                    background: color,
                    boxShadow: "0 0 0 3px rgba(15,23,42,0.12)",
                  }}
                />
              ) : null}
            </div>
            <div className="flex justify-between mt-1 text-[10px] font-mono text-ink-3">
              <span>−3</span>
              <span className="text-err">−1.96 (ISPOCD)</span>
              <span>+3</span>
            </div>
          </div>

          <p className="text-[12px] text-ink-3 leading-relaxed border-t border-divider pt-3">
            ISPOCD chegarasi: Z ≤ −1.96 bo'lsa shu testda sezilarli kognitiv pasayish belgisi.
            Composite ISPOCD musbat bo'lishi uchun 4 ta core testdan (Stroop/TMT/DST/LMWT) kamida 2
            tasida shu chegara kuzatilishi kerak.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
