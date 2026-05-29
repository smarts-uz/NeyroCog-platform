"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import { useState } from "react";
import type { TestComponentProps } from "./shared";
import { TestIntro, TestShell } from "./shared";

const LMWT_WORDS = [
  "stol",
  "g'ildirak",
  "uy",
  "qaymoq",
  "olma",
  "kitob",
  "tarvuz",
  "tog'",
  "shisha",
  "soat",
  "qaychi",
  "qor",
  "tuxum",
  "yulduz",
  "qush",
];

type FieldKey = "v1" | "v2" | "v3" | "v4" | "v5" | "vDelay";

const TRIALS: { key: FieldKey; label: string; accent?: boolean }[] = [
  { key: "v1", label: "1-urinish (V1)" },
  { key: "v2", label: "2-urinish (V2)" },
  { key: "v3", label: "3-urinish (V3)" },
  { key: "v4", label: "4-urinish (V4)" },
  { key: "v5", label: "5-urinish (V5)" },
  { key: "vDelay", label: "30–60 daq (V_Delay)", accent: true },
];

export function LMWTTest({ patient, onAbort, onFinish }: TestComponentProps) {
  const [phase, setPhase] = useState<"intro" | "running">("intro");
  const [vals, setVals] = useState<Record<FieldKey, string>>({
    v1: "",
    v2: "",
    v3: "",
    v4: "",
    v5: "",
    vDelay: "",
  });

  const set = (k: FieldKey, v: string) => setVals((f) => ({ ...f, [k]: v.replace(/\D/g, "") }));

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    void onFinish({
      v1: Number(vals.v1) || 0,
      v2: Number(vals.v2) || 0,
      v3: Number(vals.v3) || 0,
      v4: Number(vals.v4) || 0,
      v5: Number(vals.v5) || 0,
      vDelay: Number(vals.vDelay) || 0,
    });
  };

  const total = (["v1", "v2", "v3", "v4", "v5"] as const).reduce(
    (a, k) => a + (Number(vals[k]) || 0),
    0,
  );
  const dynamics = (Number(vals.v5) || 0) - (Number(vals.v1) || 0);
  const retention =
    Number(vals.v5) > 0
      ? `${Math.round(((Number(vals.vDelay) || 0) / Number(vals.v5)) * 100)}%`
      : "—";

  return (
    <TestShell
      test="LMWT"
      patient={patient}
      phase={phase}
      onAbort={onAbort}
      done={null}
      intro={
        <TestIntro
          test="LMWT"
          title="Lurya Memory Word Test (LMWT)"
          description="15 ta umumiy so'z bemorga 5 marta ketma-ket o'qib beriladi. Har urinishdan keyin bemor eslab qolgan so'zlar soni qayd etiladi. 30–60 daqiqadan keyin oxirgi marta (delayed recall) yana o'qish so'raladi."
          steps={[
            "So'zlarni bemorga sekin va aniq o'qing — taxminan 1 s/so'z.",
            "Har urinishdan keyin bemordan eslab qolgan so'zlarni so'rang.",
            "Tartib muhim emas — faqat to'g'ri eslab qolingan so'zlar soni.",
            "Yakuniy delayed recall — 30–60 daq dam olishdan keyin.",
          ]}
          onStart={() => setPhase("running")}
          ctaLabel="Natijalarni kiritish"
        />
      }
      body={
        <form
          onSubmit={submit}
          className="bg-surface border border-border rounded-lg shadow-md w-[720px] max-w-full p-8 flex flex-col gap-5"
        >
          <div>
            <div className="eyebrow mb-1.5">So'zlar ro'yxati</div>
            <div className="flex flex-wrap gap-1.5 px-3.5 py-2.5 bg-surface-2 rounded-xl border border-border">
              {LMWT_WORDS.map((w) => (
                <span
                  key={w}
                  className="font-mono text-[13px] px-2 py-0.5 rounded-md bg-surface text-ink border border-border"
                >
                  {w}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3.5">
            {TRIALS.map((tr) => (
              <div key={tr.key}>
                <Label className={tr.accent ? "text-primary-press font-semibold" : undefined}>
                  {tr.label}
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    min={0}
                    max={15}
                    value={vals[tr.key]}
                    onChange={(e) => set(tr.key, e.target.value)}
                    placeholder="0"
                    required={tr.key !== "vDelay"}
                    className="pr-14 font-mono text-base font-semibold tabular-nums"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-ink-3">
                    / 15
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 px-4 py-3.5 bg-surface-2 rounded-xl">
            <Stat label="Jami V1–V5" value={total} max={75} />
            <Stat label="O'rganish dinamikasi" value={dynamics} />
            <Stat label="Saqlash %" value={retention} />
          </div>

          <div className="flex gap-2.5 justify-end pt-2 border-t border-divider">
            <Button type="button" variant="secondary" onClick={onAbort}>
              Bekor qilish
            </Button>
            <Button type="submit">
              <Check className="h-4 w-4" />
              Saqlash va davom etish
            </Button>
          </div>
        </form>
      }
    />
  );
}

function Stat({ label, value, max }: { label: string; value: number | string; max?: number }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider font-semibold text-ink-3 mb-1">
        {label}
      </div>
      <div className="font-mono font-bold text-lg text-ink tabular-nums">
        {value}
        {max ? <span className="text-xs text-ink-3 font-medium"> / {max}</span> : null}
      </div>
    </div>
  );
}
