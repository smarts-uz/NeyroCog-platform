/**
 * Tahlil markazi — Excel'dan olingan referens qiymatlar.
 * CLAUDE.md: bu qiymatlarni Excel'siz o'zgartirmang.
 *   ROC_REFERENCE   — Statistics M-2 Diagnostic Value (n=181)
 *   TREATMENT_RESULTS — Statistics M-4 Treatment Efficacy (Asosiy vs Taqqoslov)
 */

import type { TestName } from "@/lib/engines/types";

export type Instrument = TestName | "KNBT";

export const INSTRUMENTS: Instrument[] = [
  "KNBT",
  "EEG",
  "TMT",
  "DST",
  "LMWT",
  "Stroop",
  "NS",
  "Audio",
];

export interface ROCRef {
  auc: number;
  ci: [number, number];
  se: number;
  cutoff: number;
  sens: number;
  spec: number;
  p: number;
}

export const ROC_REFERENCE: Record<Instrument, ROCRef> = {
  Stroop: {
    auc: 0.748,
    ci: [0.665, 0.831],
    se: 0.042,
    cutoff: 64,
    sens: 0.728,
    spec: 0.731,
    p: 0.001,
  },
  TMT: {
    auc: 0.774,
    ci: [0.701, 0.847],
    se: 0.037,
    cutoff: 60,
    sens: 0.701,
    spec: 0.795,
    p: 0.001,
  },
  DST: { auc: 0.759, ci: [0.681, 0.836], se: 0.04, cutoff: 62, sens: 0.71, spec: 0.766, p: 0.001 },
  LMWT: { auc: 0.76, ci: [0.68, 0.84], se: 0.041, cutoff: 60, sens: 0.733, spec: 0.722, p: 0.001 },
  NS: { auc: 0.675, ci: [0.587, 0.764], se: 0.045, cutoff: 67, sens: 0.638, spec: 0.701, p: 0.001 },
  Audio: {
    auc: 0.666,
    ci: [0.578, 0.755],
    se: 0.045,
    cutoff: 70,
    sens: 0.629,
    spec: 0.692,
    p: 0.001,
  },
  EEG: { auc: 0.809, ci: [0.739, 0.88], se: 0.036, cutoff: 65, sens: 0.793, spec: 0.748, p: 0.001 },
  KNBT: {
    auc: 0.783,
    ci: [0.713, 0.853],
    se: 0.036,
    cutoff: 63,
    sens: 0.762,
    spec: 0.748,
    p: 0.001,
  },
};

export interface TreatmentRef {
  exp: { post: number; postTx: number; n: number };
  ctl: { post: number; postTx: number; n: number };
  p: number;
  d: number;
  recoveryExp: number;
  recoveryCtl: number;
}

export const TREATMENT_RESULTS: Record<Instrument, TreatmentRef> = {
  Stroop: {
    exp: { post: 60, postTx: 78, n: 30 },
    ctl: { post: 58, postTx: 64, n: 26 },
    p: 0.001,
    d: 1.34,
    recoveryExp: 0.733,
    recoveryCtl: 0.231,
  },
  TMT: {
    exp: { post: 58, postTx: 76, n: 30 },
    ctl: { post: 56, postTx: 62, n: 26 },
    p: 0.001,
    d: 1.42,
    recoveryExp: 0.7,
    recoveryCtl: 0.192,
  },
  DST: {
    exp: { post: 60, postTx: 77, n: 30 },
    ctl: { post: 58, postTx: 64, n: 26 },
    p: 0.001,
    d: 1.28,
    recoveryExp: 0.667,
    recoveryCtl: 0.231,
  },
  LMWT: {
    exp: { post: 55, postTx: 74, n: 30 },
    ctl: { post: 54, postTx: 60, n: 26 },
    p: 0.001,
    d: 1.51,
    recoveryExp: 0.7,
    recoveryCtl: 0.192,
  },
  NS: {
    exp: { post: 72, postTx: 82, n: 30 },
    ctl: { post: 71, postTx: 75, n: 26 },
    p: 0.001,
    d: 0.94,
    recoveryExp: 0.633,
    recoveryCtl: 0.346,
  },
  Audio: {
    exp: { post: 68, postTx: 79, n: 30 },
    ctl: { post: 67, postTx: 71, n: 26 },
    p: 0.005,
    d: 0.88,
    recoveryExp: 0.6,
    recoveryCtl: 0.269,
  },
  EEG: {
    exp: { post: 72, postTx: 83, n: 30 },
    ctl: { post: 71, postTx: 76, n: 26 },
    p: 0.001,
    d: 1.06,
    recoveryExp: 0.667,
    recoveryCtl: 0.346,
  },
  KNBT: {
    exp: { post: 62, postTx: 78, n: 30 },
    ctl: { post: 61, postTx: 65, n: 26 },
    p: 0.001,
    d: 1.38,
    recoveryExp: 0.733,
    recoveryCtl: 0.231,
  },
};

export const INSTRUMENT_LABEL: Record<Instrument, string> = {
  KNBT: "KNBT Composite",
  Stroop: "Stroop",
  TMT: "TMT",
  DST: "DST",
  LMWT: "LMWT",
  NS: "NS",
  EEG: "EEG",
  Audio: "Audio",
};
