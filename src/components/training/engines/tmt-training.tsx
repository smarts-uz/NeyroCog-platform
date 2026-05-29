"use client";

import { TMTTest } from "@/components/tests/tmt-test";
import type { EngineComponentProps } from "../shared";

const TMT_N = 25;

/**
 * Diagnostik TMT-A taxtasini reabilitatsiya mashqi sifatida qayta ishlatadi
 * (fazoviy orientatsiya). Test natijasini (aTime/aErrors) trening natijasiga
 * o'giradi.
 */
export function TmtTraining({ patient, exercise, onAbort, onFinish }: EngineComponentProps) {
  return (
    <TMTTest
      patient={patient}
      onAbort={onAbort}
      onFinish={(raw) => {
        const aTime = typeof raw.aTime === "number" ? raw.aTime : 0;
        const aErrors = typeof raw.aErrors === "number" ? raw.aErrors : 0;
        const score = Math.max(0, Math.round(2000 - aTime * 10 - aErrors * 50));
        const accuracy = Math.max(0, Math.min(1, 1 - aErrors / TMT_N));
        return onFinish({
          exerciseId: exercise.id,
          score,
          accuracy,
          duration: aTime * 1000,
          level: exercise._level ?? 1,
          raw: { aTime, aErrors },
        });
      }}
    />
  );
}
