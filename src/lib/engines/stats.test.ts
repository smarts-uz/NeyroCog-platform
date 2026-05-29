/**
 * stats.ts — sanity tests for statistical primitives.
 *
 * Real klinikada — bu funksiyalar har bir release oldidan SPSS/R bilan
 * cross-check qilinishi shart. Bu yerda faqat asosiy invariantlar.
 */

import { describe, expect, it } from "vitest";
import {
  chi2_2x2,
  cohenDInterpret,
  confusionMatrix,
  mean,
  pFmt,
  pairedT,
  pearson,
  rocCurve,
  sd,
  welchT,
} from "./stats";

describe("stats — basic stats", () => {
  it("mean of empty array is NaN", () => {
    expect(Number.isNaN(mean([]))).toBe(true);
  });
  it("mean of [2,4,6] = 4", () => {
    expect(mean([2, 4, 6])).toBe(4);
  });
  it("sd of [2,4,6] ≈ 2", () => {
    expect(sd([2, 4, 6])).toBeCloseTo(2, 5);
  });
});

describe("stats — Pearson correlation", () => {
  it("perfect positive correlation", () => {
    const r = pearson([1, 2, 3, 4, 5], [2, 4, 6, 8, 10]);
    expect(r?.r).toBeCloseTo(1, 5);
  });
  it("returns null for n<3", () => {
    expect(pearson([1, 2], [3, 4])).toBeNull();
  });
});

describe("stats — paired t-test", () => {
  it("computes positive mean diff for improvement", () => {
    const result = pairedT([50, 55, 60], [65, 70, 75]);
    expect(result?.meanDiff).toBeGreaterThan(0);
    expect(result?.cohen_d).toBeGreaterThan(0);
  });
});

describe("stats — Welch t-test", () => {
  it("detects difference between distinct groups", () => {
    const result = welchT([50, 52, 51, 53], [70, 72, 71, 73]);
    expect(result?.meanA).toBeLessThan(result?.meanB ?? 0);
    expect(Math.abs(result?.cohen_d ?? 0)).toBeGreaterThan(2);
  });
});

describe("stats — chi-square 2×2", () => {
  it("computes odds ratio", () => {
    const result = chi2_2x2(10, 5, 3, 12);
    expect(result?.or).toBeCloseTo(8, 1);
  });
});

describe("stats — ROC curve & AUC", () => {
  it("returns AUC near 1.0 for perfect separation", () => {
    // labels=1 → low scores, labels=0 → high scores (direction "low")
    const scores = [1, 2, 3, 8, 9, 10];
    const labels = [1, 1, 1, 0, 0, 0];
    const result = rocCurve(scores, labels, "low");
    expect(result?.auc).toBeCloseTo(1.0, 2);
  });
  it("returns AUC near 0.5 for random", () => {
    const scores = [1, 2, 3, 4, 5, 6];
    const labels = [1, 0, 1, 0, 1, 0];
    const result = rocCurve(scores, labels, "low");
    expect(result?.auc).toBeGreaterThan(0.3);
    expect(result?.auc).toBeLessThan(0.7);
  });
});

describe("stats — confusion matrix", () => {
  it("computes TP/FN/FP/TN correctly at threshold", () => {
    const scores = [1, 2, 3, 8, 9, 10];
    const labels = [1, 1, 1, 0, 0, 0];
    const cm = confusionMatrix(scores, labels, 5, "low");
    expect(cm.TP).toBe(3);
    expect(cm.TN).toBe(3);
    expect(cm.FP).toBe(0);
    expect(cm.FN).toBe(0);
    expect(cm.sens).toBe(1);
    expect(cm.spec).toBe(1);
  });
});

describe("stats — pFmt + cohenDInterpret", () => {
  it("formats p < 0.001", () => {
    expect(pFmt(0.0001)).toBe("p < 0.001");
  });
  it("formats p = 0.03", () => {
    expect(pFmt(0.03)).toBe("p = 0.030");
  });
  it("classifies d=0.9 as large effect", () => {
    expect(cohenDInterpret(0.9).label).toBe("Katta effekt");
  });
});
