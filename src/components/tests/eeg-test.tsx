"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EEGRaw } from "@/lib/engines/types";
import { Check } from "lucide-react";
import { useState } from "react";
import type { TestComponentProps } from "./shared";
import { TestIntro, TestShell } from "./shared";

interface EEGField {
  key: keyof EEGRaw;
  name: string;
  short: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  ref: string;
}

const EEG_FIELDS: EEGField[] = [
  {
    key: "alphaAmp",
    name: "O'rtacha alfa-ritm amplituda",
    short: "α-amp (EC)",
    unit: "μV",
    min: 0,
    max: 80,
    step: 0.5,
    ref: "15–40 μV",
  },
  {
    key: "thetaAmp",
    name: "O'rtacha teta-ritm amplituda",
    short: "θ-amp (EC)",
    unit: "μV",
    min: 0,
    max: 80,
    step: 0.5,
    ref: "<25 μV",
  },
  {
    key: "ihaAlpha",
    name: "Yarimsharchalararo asimmetriya",
    short: "IHA-α (EC)",
    unit: "%",
    min: -50,
    max: 50,
    step: 1,
    ref: "−10 … +10%",
  },
  {
    key: "swiAnt",
    name: "Old sohalardagi sekin to'lqin",
    short: "SWI-Ant",
    unit: "%",
    min: 0,
    max: 100,
    step: 1,
    ref: "<20%",
  },
  {
    key: "alphaPost",
    name: "Orqa alfa-ritm indeksi",
    short: "α-Idx-Post",
    unit: "%",
    min: 0,
    max: 100,
    step: 1,
    ref: "25–60%",
  },
  {
    key: "iaf",
    name: "Individual alfa chastotasi",
    short: "IAF",
    unit: "Hz",
    min: 4,
    max: 14,
    step: 0.1,
    ref: "8–12 Hz",
  },
];

export function EEGTest({ patient, onAbort, onFinish }: TestComponentProps) {
  const [phase, setPhase] = useState<"intro" | "running">("intro");
  const [vals, setVals] = useState<Record<string, string>>(
    Object.fromEntries(EEG_FIELDS.map((f) => [f.key, ""])),
  );

  const set = (k: string, v: string) => setVals((f) => ({ ...f, [k]: v }));

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const raw: Record<string, number> = {};
    for (const f of EEG_FIELDS) {
      raw[f.key] = Number.parseFloat(vals[f.key] ?? "") || 0;
    }
    const alphaAmp = raw.alphaAmp ?? 0;
    raw.thetaAlpha = alphaAmp > 0 ? (raw.thetaAmp ?? 0) / alphaAmp : 0;
    void onFinish(raw);
  };

  return (
    <TestShell
      test="EEG"
      patient={patient}
      phase={phase}
      onAbort={onAbort}
      done={null}
      intro={
        <TestIntro
          test="EEG"
          title="EEG ko'rsatkichlari"
          description="EEG qurilmasidan o'qilgan asosiy ritm ko'rsatkichlarini kiriting. Ko'rsatkichlar ko'zlar yumuq (EC) holatda olingan bo'lishi kerak."
          steps={[
            "Bemorni tinch holatda, ko'zlar yumuq holda yozib oling (2–3 daq).",
            "Qurilma dasturidan keltirilgan asosiy ko'rsatkichlarni o'qing.",
            "Har bir maydonga aniq qiymat kiriting.",
          ]}
          note="Bu asboblardan olingan ma'lumotlar — formula avtomatik hisoblanadi."
          onStart={() => setPhase("running")}
          ctaLabel="Ko'rsatkichlarni kiritish"
        />
      }
      body={
        <form
          onSubmit={submit}
          className="bg-surface border border-border rounded-lg shadow-md w-[720px] max-w-full p-8 flex flex-col gap-4"
        >
          <div className="eyebrow">EEG ma'lumotlari (EC — ko'zlar yumuq)</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {EEG_FIELDS.map((f) => (
              <div key={f.key}>
                <Label className="flex justify-between">
                  <span>{f.name}</span>
                  <span className="text-ink-3 font-mono text-[11px]">{f.short}</span>
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    step={f.step}
                    min={f.min}
                    max={f.max}
                    value={vals[f.key] ?? ""}
                    onChange={(e) => set(f.key, e.target.value)}
                    placeholder={f.ref}
                    required
                    className="pr-12 font-mono tabular-nums"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-ink-3">
                    {f.unit}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-ink-3">Me'yor: {f.ref}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-2.5 justify-end pt-3 border-t border-divider">
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
