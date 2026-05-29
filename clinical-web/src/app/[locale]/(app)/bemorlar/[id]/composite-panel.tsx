"use client";

import { ClinicalIcon } from "@/components/clinical-icon";
import { Card } from "@/components/ui/card";
import { summarizeComposite } from "@/lib/engines/knbt";
import type { TestName, TestSummary, Timepoint, Tone } from "@/lib/engines/types";
import { TEST_BY_ID } from "@/lib/tests/meta";
import { BarChart3, Info } from "lucide-react";
import { useMemo, useState } from "react";
import { ResultDetail } from "./result-detail";

const CORE_ORDER: TestName[] = ["Stroop", "TMT", "DST", "LMWT", "NS", "EEG", "Audio"];

const TILE_TONE: Record<Tone, { bg: string; fg: string }> = {
  great: { bg: "#DCFCE7", fg: "#14532D" },
  good: { bg: "#DBEAFE", fg: "#1E3A8A" },
  ok: { bg: "#E0E7FF", fg: "#3730A3" },
  warn: { bg: "#FEF3C7", fg: "#92400E" },
  bad: { bg: "#FEE2E2", fg: "#991B1B" },
  neutral: { bg: "var(--color-surface-2)", fg: "var(--color-ink-3)" },
};

export function CompositePanel({
  summaries,
  timepoint,
}: {
  /** activeTimepoint bo'yicha test → summary (patient-detail tomonidan tayyorlangan) */
  summaries: Partial<Record<TestName, TestSummary>>;
  timepoint: Timepoint | "latest";
}) {
  const compTp: Timepoint = timepoint === "latest" ? "PostOp" : timepoint;
  const composite = useMemo(() => summarizeComposite(summaries, compTp), [summaries, compTp]);
  const hasAny = Object.keys(summaries).length > 0;
  const [detail, setDetail] = useState<TestName | null>(null);

  if (!hasAny) {
    return (
      <Card className="p-6 flex flex-col gap-2 bg-surface-2 border-dashed border-border-strong">
        <div className="flex items-center gap-2.5">
          <BarChart3 className="h-5 w-5 text-ink-3" />
          <div className="eyebrow">KNBT Composite</div>
        </div>
        <div className="text-sm text-ink-2">
          Hech bo'lmaganda <b className="text-ink">bitta test</b> bajarilgandan keyin KNBT Composite
          hisoblanadi.
        </div>
      </Card>
    );
  }

  const compTone: "err" | "warn" | "ok" | "neutral" = composite
    ? composite.ispcd || composite.tone === "bad"
      ? "err"
      : composite.tone === "warn"
        ? "warn"
        : "ok"
    : "neutral";

  const heroBg =
    compTone === "err"
      ? "linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)"
      : compTone === "warn"
        ? "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)"
        : compTone === "ok"
          ? "linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)"
          : "var(--color-surface-2)";

  return (
    <Card className="overflow-hidden p-0">
      <div className="px-7 py-6 border-b border-border" style={{ background: heroBg }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="eyebrow text-ink-2">
              KNBT Composite · {timepoint === "latest" ? "So'nggi" : timepoint}
            </div>
            {composite ? (
              <>
                <div className="font-extrabold text-[56px] tracking-tight text-ink leading-none mt-1.5 tabular-nums">
                  {composite.compositeScore}
                  <span className="text-[22px] font-medium text-ink-3 ml-1.5">/ 100</span>
                </div>
                <div className="font-semibold text-lg text-ink mt-2">
                  {composite.cognitiveHealth}
                </div>
                <div className="text-[13px] text-ink-2 mt-1">
                  Z-score: <b className="font-mono">{composite.zScore?.toFixed(2) ?? "—"}</b>
                  {" · "}
                  {composite.includedTests} ta test ishtirok etgan
                </div>
              </>
            ) : (
              <div className="text-sm text-ink-2 mt-3">Composite uchun yetarli ma'lumot yo'q.</div>
            )}
          </div>

          {composite ? (
            <div
              className="px-4 py-3 rounded-xl flex flex-col items-end gap-1"
              style={{
                background: composite.ispcd ? "var(--color-err)" : "rgba(255,255,255,0.6)",
                color: composite.ispcd ? "#FFF" : "var(--color-ink)",
                border: composite.ispcd ? "0" : "1px solid var(--color-border-strong)",
              }}
            >
              <div className="text-[10px] font-semibold tracking-widest uppercase opacity-85">
                ISPOCD
              </div>
              <div className="font-extrabold text-[22px] tracking-tight">
                {composite.ispcd ? "Musbat" : "Manfiy"}
              </div>
              <div className="font-mono text-[11px] opacity-80 tabular-nums">
                {composite.ispcdCount} / 4 testda Z ≤ −1.96
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="p-5">
        <div className="eyebrow mb-3">Test bo'yicha taqsimot</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {CORE_ORDER.map((t) => (
            <TestTile
              key={t}
              testId={t}
              summary={summaries[t]}
              onClick={summaries[t] ? () => setDetail(t) : undefined}
            />
          ))}
        </div>

        {composite ? (
          <div className="mt-3.5 px-3.5 py-2.5 bg-surface-2 rounded-[10px] text-xs text-ink-3 flex items-center gap-2">
            <Info className="h-3.5 w-3.5" />
            <span>
              <b className="text-ink">ISPOCD = Musbat</b> bo'lishi uchun Stroop / TMT / DST / LMWT
              to'rttasidan kamida 2 tasida Z-score ≤ −1.96 bo'lishi kerak.
            </span>
          </div>
        ) : null}
      </div>

      <ResultDetail
        testId={detail}
        summary={detail ? summaries[detail] : undefined}
        open={detail != null}
        onOpenChange={(o) => !o && setDetail(null)}
      />
    </Card>
  );
}

function TestTile({
  testId,
  summary,
  onClick,
}: {
  testId: TestName;
  summary?: TestSummary;
  onClick?: () => void;
}) {
  const meta = TEST_BY_ID[testId];
  const tone = TILE_TONE[summary?.tone ?? "neutral"];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="text-left p-3.5 rounded-xl border border-border flex flex-col gap-1.5 transition-shadow enabled:hover:shadow-sm enabled:cursor-pointer disabled:cursor-default"
      style={{ background: tone.bg, color: tone.fg, opacity: summary ? 1 : 0.5 }}
    >
      <div className="flex items-center gap-1.5">
        <ClinicalIcon name={meta.icon} size={14} />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider">
          {meta.short}
        </span>
        {summary?.ispcd ? (
          <span className="ml-auto px-1.5 py-px rounded bg-err text-white text-[9px] font-bold tracking-wider">
            ISPOCD
          </span>
        ) : null}
      </div>
      <div className="font-bold text-[22px] tabular-nums leading-none">
        {summary?.cogScore != null ? summary.cogScore : "—"}
      </div>
      <div className="text-[11px] opacity-80">
        {summary ? summary.cognitiveHealth : "Bajarilmagan"}
      </div>
      {summary ? (
        <div className="font-mono text-[10px] opacity-70 tabular-nums">
          z = {summary.zScore?.toFixed(2) ?? "—"}
        </div>
      ) : null}
    </button>
  );
}
