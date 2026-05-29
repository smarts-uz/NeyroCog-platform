/**
 * KNBT engine — snapshot tests.
 *
 * Maqsad: formulani tasodifan o'zgartirib qo'ymaslik. Prototipdagi
 * konkret kirish qiymatlari uchun aniq score'larni tekshiramiz.
 */

import { describe, expect, it } from "vitest";
import {
  NORM,
  cogLabel,
  computeCogScore,
  interpretZChange,
  isISPOCD,
  summarizeComposite,
  summarizeTest,
  zScore,
} from "./knbt";

const referenceChild = { yosh: 11, premorbid: 0 as const, davom: 90, prep: 3 };

describe("KNBT — cogLabel", () => {
  it("returns A'lo for ≥90", () => {
    expect(cogLabel(95)).toEqual({ label: "A'lo", tone: "great" });
  });
  it("returns O'rtacha for 75", () => {
    expect(cogLabel(75)).toEqual({ label: "O'rtacha", tone: "ok" });
  });
  it("returns Jiddiy buzilish for <40", () => {
    expect(cogLabel(20).label).toBe("Jiddiy buzilish");
  });
  it("returns — for null", () => {
    expect(cogLabel(null)).toEqual({ label: "—", tone: "neutral" });
  });
});

describe("KNBT — zScore + ISPOCD", () => {
  it("computes z correctly", () => {
    expect(zScore(60, 80, 10)).toBe(-2);
  });
  it("ISPOCD when z ≤ -1.96", () => {
    expect(isISPOCD(-2)).toBe(true);
    expect(isISPOCD(-1.5)).toBe(false);
  });
});

describe("KNBT — Stroop scoring", () => {
  it("perfect performance ≈ 100", () => {
    const score = computeCogScore("Stroop", {
      correct: 40,
      errors: 0,
      skipped: 0,
      totalTimeSec: 40, // 1s/trial → ideal speed
      totalTrials: 40,
    });
    expect(score).toBeGreaterThanOrEqual(95);
  });
  it("middling performance ≈ 60–80", () => {
    const score = computeCogScore("Stroop", {
      correct: 32,
      errors: 8,
      skipped: 0,
      totalTimeSec: 100,
      totalTrials: 40,
    });
    expect(score).toBeGreaterThan(50);
    expect(score).toBeLessThan(85);
  });
});

describe("KNBT — TMT scoring", () => {
  it("fast time near ref ≈ 80+", () => {
    const score = computeCogScore("TMT", { aTime: 30, aErrors: 0, bTime: 75, bErrors: 0 });
    expect(score).toBeGreaterThan(85);
  });
  it("slow time → lower score", () => {
    const score = computeCogScore("TMT", { aTime: 90, aErrors: 5, bTime: 200, bErrors: 5 });
    expect(score).toBeLessThan(40);
  });
});

describe("KNBT — DST scoring", () => {
  it("typical span 8 + 6 = 14 → near 100", () => {
    expect(computeCogScore("DST", { forward: 8, backward: 6 })).toBe(100);
  });
});

describe("KNBT — summarizeComposite", () => {
  it("ISPOCD when ≥2 of 4 core tests fail", () => {
    const tests = {
      Stroop: summarizeTest(
        "Stroop",
        { correct: 10, errors: 30, totalTimeSec: 200 },
        "PostOp",
        referenceChild,
      ),
      TMT: summarizeTest(
        "TMT",
        { aTime: 120, aErrors: 5, bTime: 250, bErrors: 5 },
        "PostOp",
        referenceChild,
      ),
      DST: summarizeTest("DST", { forward: 4, backward: 2 }, "PostOp", referenceChild),
      LMWT: summarizeTest(
        "LMWT",
        { v1: 5, v2: 5, v3: 6, v4: 6, v5: 7, vDelay: 4 },
        "PostOp",
        referenceChild,
      ),
    };
    const composite = summarizeComposite(tests, "PostOp");
    expect(composite).not.toBeNull();
    expect(composite?.ispcdCount).toBeGreaterThanOrEqual(2);
    expect(composite?.ispcd).toBe(true);
  });

  it("returns null when no core scores present", () => {
    expect(summarizeComposite({}, "PreOp")).toBeNull();
  });
});

describe("KNBT — interpretZChange", () => {
  it("returns Kuchli yaxshilanish for z ≥ 1.96", () => {
    expect(interpretZChange(2.0).tone).toBe("great");
  });
  it("returns Sezilarli o'zgarish yo'q in mid-range", () => {
    expect(interpretZChange(0).label).toBe("Sezilarli o'zgarish yo'q");
  });
  it("returns Kuchli yomonlashuv for z ≤ -1.96", () => {
    expect(interpretZChange(-2.5).tone).toBe("bad");
  });
});

describe("KNBT — NORM table integrity", () => {
  it("has all 8 instruments + Composite", () => {
    expect(Object.keys(NORM).sort()).toEqual(
      ["Audio", "Composite", "DST", "EEG", "LMWT", "NS", "Stroop", "TMT"].sort(),
    );
  });
  it("each has three timepoints", () => {
    for (const key of Object.keys(NORM)) {
      const block = NORM[key as keyof typeof NORM];
      expect(Object.keys(block).sort()).toEqual(["PostOp", "PostTx", "PreOp"]);
    }
  });
});
