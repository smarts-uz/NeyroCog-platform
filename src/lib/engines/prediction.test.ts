/**
 * PNB prediction engine — guard tests.
 *
 * Maqsad: Excel'dagi LR / MLR koeffitsientlari tasodifan o'zgarmasligi
 * kafolatlash. Reference bemor profili va kutilayotgan diapazon
 * tekshiriladi.
 */

import { describe, expect, it } from "vitest";
import {
  LR_COEF,
  MLR_BASE,
  MLR_COEF,
  REF_PATIENT,
  computeRisk,
  computeSeverity,
  factorContributions,
  forecast,
  riskCategory,
} from "./prediction";

describe("Prediction — LR coefficient integrity", () => {
  it("has all 8 instruments", () => {
    expect(Object.keys(LR_COEF).sort()).toEqual(
      ["Audio", "DST", "EEG", "KNBT", "LMWT", "NS", "Stroop", "TMT"].sort(),
    );
  });
  it("KNBT composite has expected b0 (Excel)", () => {
    expect(LR_COEF.KNBT.b0).toBe(-5.652);
    expect(LR_COEF.KNBT.dur).toBe(0.02427);
    expect(LR_COEF.KNBT.drugs).toBe(1.3389);
    expect(LR_COEF.KNBT.age).toBe(-0.3937);
    expect(LR_COEF.KNBT.prem).toBe(1.2869);
    expect(LR_COEF.KNBT.auc).toBe(0.783);
  });
  it("EEG has highest premorbid coefficient", () => {
    expect(LR_COEF.EEG.prem).toBe(4.3157);
  });
});

describe("Prediction — MLR coefficient integrity", () => {
  it("base score is 85", () => {
    expect(MLR_BASE).toBe(85);
  });
  it("KNBT adjR2 is 0.566 (Excel)", () => {
    expect(MLR_COEF.KNBT.adjR2).toBe(0.566);
  });
  it("Premorbid binary shifts CogScore by -16 for KNBT", () => {
    expect(MLR_COEF.KNBT.prem).toBe(-16.0);
  });
});

describe("Prediction — Reference patient", () => {
  it("matches Excel reference profile", () => {
    expect(REF_PATIENT).toEqual({ dur: 90, drugs: 3, age: 11, prem: 0 });
  });
});

describe("Prediction — Risk computation", () => {
  it("returns low risk for reference patient", () => {
    const r = computeRisk("KNBT", REF_PATIENT);
    expect(r).not.toBeNull();
    expect(r?.prob).toBeLessThan(0.5);
  });
  it("returns high risk for stressed profile", () => {
    const r = computeRisk("KNBT", { dur: 150, drugs: 6, age: 8, prem: 1 });
    expect(r).not.toBeNull();
    expect(r?.prob).toBeGreaterThan(0.5);
  });
});

describe("Prediction — Severity", () => {
  it("reference patient → CogScore ≈ 85", () => {
    const s = computeSeverity("KNBT", REF_PATIENT);
    expect(s?.score).toBe(85);
  });
  it("severe profile → lower CogScore", () => {
    const s = computeSeverity("KNBT", { dur: 150, drugs: 6, age: 8, prem: 1 });
    expect(s?.score).toBeLessThan(70);
  });
});

describe("Prediction — Risk categorization", () => {
  it("0.10 → Past xavf", () => {
    expect(riskCategory(0.1).short).toBe("PAST");
  });
  it("0.30 → O'rta xavf", () => {
    expect(riskCategory(0.3).short).toBe("O'RTA");
  });
  it("0.55 → Yuqori xavf", () => {
    expect(riskCategory(0.55).short).toBe("YUQORI");
  });
  it("0.85 → Juda yuqori xavf", () => {
    expect(riskCategory(0.85).short).toBe("JUDA YUQORI");
  });
});

describe("Prediction — Factor contributions", () => {
  it("returns 4 factors sorted by |contribution|", () => {
    const c = factorContributions("KNBT", { dur: 150, drugs: 6, age: 8, prem: 1 });
    expect(c).toHaveLength(4);
    // Must be sorted by abs contribution descending
    for (let i = 1; i < c.length; i++) {
      expect(Math.abs(c[i - 1]!.logitContribution)).toBeGreaterThanOrEqual(
        Math.abs(c[i]!.logitContribution),
      );
    }
  });
});

describe("Prediction — Full forecast", () => {
  it("normalizes premorbid > 0 to 1", () => {
    const result = forecast({ yosh: 11, premorbid: 1, davom: 90, prep: 3 });
    expect(result.input.prem).toBe(1);
  });
  it("returns 7 per-instrument forecasts", () => {
    const result = forecast({ yosh: 11, premorbid: 0, davom: 90, prep: 3 });
    expect(Object.keys(result.perInstrument).sort()).toEqual(
      ["Audio", "DST", "EEG", "LMWT", "NS", "Stroop", "TMT"].sort(),
    );
  });
  it("provides at least one recommendation", () => {
    const result = forecast({ yosh: 11, premorbid: 0, davom: 90, prep: 3 });
    expect(result.recommendations.length).toBeGreaterThan(0);
  });
  it("composite risk and severity are coherent", () => {
    const result = forecast({ yosh: 8, premorbid: 1, davom: 180, prep: 7 });
    expect(result.composite.risk.prob).toBeGreaterThan(0.5);
    expect(result.composite.severity.score).toBeLessThan(70);
  });
});
