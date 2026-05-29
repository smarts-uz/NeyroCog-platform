/**
 * KNBT — Kognitiv-Neyrobiologik Test scoring engine (TypeScript port).
 *
 * Manba: prototipdagi `clinical_app/knbt.js`. Hech qanday formula
 * o'zgartirilmagan — CLAUDE.md "statistik koeffitsientlar Excel'dan"
 * qoidasiga rioya qilingan.
 */

import type {
  AudioRaw,
  CogLabel,
  CompositeSummary,
  DSTRaw,
  EEGRaw,
  EnginePatient,
  LMWTRaw,
  NSRaw,
  NormRef,
  RawByTest,
  StroopRaw,
  TMTRaw,
  TestName,
  TestSummary,
  Timepoint,
  Tone,
} from "./types";

// ─── Cognitive Health labels ─────────────────────────────────
const COG_LABELS: Array<{ min: number; max: number; label: string; tone: Tone }> = [
  { min: 90, max: 101, label: "A'lo", tone: "great" },
  { min: 80, max: 90, label: "Yaxshi", tone: "good" },
  { min: 70, max: 80, label: "O'rtacha", tone: "ok" },
  { min: 60, max: 70, label: "Pastroq", tone: "warn" },
  { min: 50, max: 60, label: "Past", tone: "warn" },
  { min: 40, max: 50, label: "Juda past", tone: "bad" },
  { min: 0, max: 40, label: "Jiddiy buzilish", tone: "bad" },
];

export function cogLabel(score: number | null | undefined): CogLabel {
  if (score == null || Number.isNaN(score)) return { label: "—", tone: "neutral" };
  for (const b of COG_LABELS) {
    if (score >= b.min && score < b.max) return { label: b.label, tone: b.tone };
  }
  // Fallback (shouldn't hit — last bucket starts at 0)
  return { label: "Jiddiy buzilish", tone: "bad" };
}

export function interpretZChange(z: number | null | undefined): CogLabel {
  if (z == null || Number.isNaN(z)) return { label: "—", tone: "neutral" };
  if (z >= 1.96) return { label: "Kuchli yaxshilanish", tone: "great" };
  if (z >= 1.0) return { label: "Sezilarli yaxshilanish", tone: "good" };
  if (z > -1.0) return { label: "Sezilarli o'zgarish yo'q", tone: "ok" };
  if (z > -1.96) return { label: "Sezilarli yomonlashuv", tone: "warn" };
  return { label: "Kuchli yomonlashuv", tone: "bad" };
}

export function zScore(value: number | null | undefined, mean: number, sd: number): number | null {
  if (value == null || Number.isNaN(value) || !sd || sd === 0) return null;
  return (value - mean) / sd;
}

export function isISPOCD(z: number | null | undefined): boolean {
  return z != null && !Number.isNaN(z) && z <= -1.96;
}

// ─── Normative populations ────────────────────────────────────
// App!$B$675 asosida (Composite + per-test). Real klinikada haqiqiy
// datasetdan qayta hisoblang.
type NormBlock = Record<Timepoint, NormRef>;

export const NORM: Record<TestName | "Composite", NormBlock> = {
  Stroop: { PreOp: { m: 80, sd: 10 }, PostOp: { m: 60, sd: 12 }, PostTx: { m: 75, sd: 11 } },
  TMT: { PreOp: { m: 78, sd: 11 }, PostOp: { m: 58, sd: 13 }, PostTx: { m: 72, sd: 12 } },
  DST: { PreOp: { m: 76, sd: 10 }, PostOp: { m: 60, sd: 12 }, PostTx: { m: 73, sd: 11 } },
  LMWT: { PreOp: { m: 75, sd: 11 }, PostOp: { m: 55, sd: 14 }, PostTx: { m: 72, sd: 12 } },
  NS: { PreOp: { m: 82, sd: 8 }, PostOp: { m: 72, sd: 10 }, PostTx: { m: 80, sd: 9 } },
  EEG: { PreOp: { m: 78, sd: 9 }, PostOp: { m: 72, sd: 10 }, PostTx: { m: 80, sd: 9 } },
  Audio: { PreOp: { m: 80, sd: 10 }, PostOp: { m: 68, sd: 12 }, PostTx: { m: 76, sd: 11 } },
  Composite: { PreOp: { m: 78, sd: 8 }, PostOp: { m: 62, sd: 10 }, PostTx: { m: 75, sd: 9 } },
};

// ─── Helpers ──────────────────────────────────────────────────
function round1(n: number | null): number | null {
  if (n == null) return null;
  return Math.round(n * 10) / 10;
}
function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function ageAdjust(score: number | null, age?: number): number | null {
  if (score == null) return null;
  if (age == null) return score;
  if (age <= 8) return Math.min(100, score + 5);
  if (age >= 16) return Math.max(0, score - 3);
  return score;
}

// ─── Per-test CogScore ────────────────────────────────────────

export function stroopCogScore(raw: StroopRaw, patient?: EnginePatient): number | null {
  if (!raw || raw.correct == null) return null;
  const n = raw.totalTrials ?? 40;
  const accuracy = raw.correct / n;
  const skipPct = (raw.skipped ?? 0) / n;
  const avgRT = raw.totalTimeSec / n;
  const speed = Math.max(0, Math.min(1, (4 - avgRT) / 3));
  const score = (accuracy * 0.6 + speed * 0.3 + (1 - skipPct) * 0.1) * 100;
  return ageAdjust(round1(score), patient?.yosh);
}

export function tmtCogScore(raw: TMTRaw, patient?: EnginePatient): number | null {
  if (!raw || raw.aTime == null) return null;
  const aRef = 30;
  const bRef = 75;
  const aPct = Math.max(0, Math.min(1, (aRef * 2 - raw.aTime) / aRef));
  let bPct = 1;
  if (raw.bTime != null) {
    bPct = Math.max(0, Math.min(1, (bRef * 2 - raw.bTime) / bRef));
  }
  const errPenalty = Math.min(0.3, ((raw.aErrors ?? 0) + (raw.bErrors ?? 0)) * 0.03);
  const base = (aPct * 0.4 + bPct * 0.6) * 100 - errPenalty * 100;
  return ageAdjust(round1(Math.max(0, base)), patient?.yosh);
}

export function dstCogScore(raw: DSTRaw, patient?: EnginePatient): number | null {
  if (!raw || raw.forward == null) return null;
  const total = (raw.forward ?? 0) + (raw.backward ?? 0);
  const score = Math.max(0, Math.min(100, ((total - 4) / 10) * 100));
  return ageAdjust(round1(score), patient?.yosh);
}

export function lmwtCogScore(raw: LMWTRaw, patient?: EnginePatient): number | null {
  if (!raw || raw.v1 == null) return null;
  const trials = [raw.v1, raw.v2, raw.v3, raw.v4, raw.v5].map((v) => v ?? 0);
  const learning = trials.reduce((a, b) => a + b, 0);
  const delay = raw.vDelay ?? 0;
  const score = (learning / 75) * 70 + (delay / 15) * 30;
  return ageAdjust(round1(score), patient?.yosh);
}

export const NS_MAX: Record<keyof NSRaw, number> = {
  mrc: 5,
  dtr: 4,
  icars: 10,
  etdrs: 10,
  pta: 10,
  dhi: 4,
  omf: 6,
  fois: 4,
  fda: 10,
  psqi: 10,
  cn: 12,
  asa: 10,
};
export const NS_MAX_TOTAL = Object.values(NS_MAX).reduce((a, b) => a + b, 0); // 95

export function nsCogScore(raw: NSRaw, patient?: EnginePatient): number | null {
  if (!raw) return null;
  let total = 0;
  let hasAny = false;
  for (const k of Object.keys(NS_MAX) as Array<keyof NSRaw>) {
    const v = raw[k];
    if (v != null && !Number.isNaN(v)) {
      total += Number(v);
      hasAny = true;
    }
  }
  if (!hasAny) return null;
  const score = (total / NS_MAX_TOTAL) * 100;
  return ageAdjust(round1(score), patient?.yosh);
}

export function eegCogScore(raw: EEGRaw, _patient?: EnginePatient): number | null {
  if (!raw || raw.alphaAmp == null) return null;
  const aA = clamp((raw.alphaAmp - 5) / 30, 0, 1);
  const tA = 1 - clamp(((raw.thetaAmp ?? 0) - 10) / 40, 0, 1);
  const iha = 1 - clamp((Math.abs(raw.ihaAlpha ?? 0) - 5) / 25, 0, 1);
  const aP = clamp(((raw.alphaPost ?? 30) - 10) / 50, 0, 1);
  const iaf = 1 - clamp(Math.abs((raw.iaf ?? 10) - 10) / 4, 0, 1);
  const score = (aA * 0.25 + tA * 0.25 + iha * 0.15 + aP * 0.2 + iaf * 0.15) * 100;
  return round1(score);
}

export function audioCogScore(raw: AudioRaw, patient?: EnginePatient): number | null {
  if (!raw || raw.correct == null) return null;
  const n = raw.totalTrials ?? 30;
  const accuracy = raw.correct / n;
  const avgRT = raw.totalTimeSec / n;
  const speed = Math.max(0, Math.min(1, (8 - avgRT) / 7));
  const errPenalty = Math.min(0.3, (raw.errors ?? 0) * 0.02);
  const score = (accuracy * 0.7 + speed * 0.3) * 100 - errPenalty * 100;
  return ageAdjust(round1(Math.max(0, score)), patient?.yosh);
}

// ─── Master dispatcher ────────────────────────────────────────

export function computeCogScore<T extends TestName>(
  testName: T,
  raw: RawByTest[T],
  patient?: EnginePatient,
): number | null {
  switch (testName) {
    case "Stroop":
      return stroopCogScore(raw as StroopRaw, patient);
    case "TMT":
      return tmtCogScore(raw as TMTRaw, patient);
    case "DST":
      return dstCogScore(raw as DSTRaw, patient);
    case "LMWT":
      return lmwtCogScore(raw as LMWTRaw, patient);
    case "NS":
      return nsCogScore(raw as NSRaw, patient);
    case "EEG":
      return eegCogScore(raw as EEGRaw, patient);
    case "Audio":
      return audioCogScore(raw as AudioRaw, patient);
    default:
      return null;
  }
}

export function summarizeTest<T extends TestName>(
  testName: T,
  raw: RawByTest[T],
  timepoint: Timepoint,
  patient?: EnginePatient,
): TestSummary {
  const cog = computeCogScore(testName, raw, patient);
  const lbl = cogLabel(cog);
  const norm: NormRef = NORM[testName]?.[timepoint] ?? NORM[testName]?.PreOp ?? { m: 75, sd: 12 };
  const z = zScore(cog, norm.m, norm.sd);
  return {
    cogScore: cog,
    cognitiveHealth: lbl.label,
    tone: lbl.tone,
    zScore: z,
    ispcd: isISPOCD(z),
    timepoint,
    normRef: norm,
  };
}

export function summarizeComposite(
  tests: Partial<Record<TestName, TestSummary>>,
  timepoint: Timepoint,
): CompositeSummary | null {
  const core: TestName[] = ["Stroop", "TMT", "DST", "LMWT"];
  const fifth: TestName[] = ["NS"];

  const coreScores = core.map((t) => tests[t]?.cogScore).filter((s): s is number => s != null);
  if (coreScores.length === 0) return null;

  const allCoreScores = [...core, ...fifth]
    .map((t) => tests[t]?.cogScore)
    .filter((s): s is number => s != null);

  const composite = allCoreScores.reduce((a, b) => a + b, 0) / allCoreScores.length;
  const lbl = cogLabel(composite);
  const norm = NORM.Composite[timepoint] ?? NORM.Composite.PreOp;
  const z = zScore(composite, norm.m, norm.sd);

  const ispcdCount = core.filter((t) => tests[t]?.ispcd).length;
  const composite_ispcd = ispcdCount >= 2;

  return {
    compositeScore: round1(composite) ?? composite,
    cognitiveHealth: lbl.label,
    tone: lbl.tone,
    zScore: z,
    ispcd: composite_ispcd,
    ispcdCount,
    ispcdRequired: 2,
    includedTests: allCoreScores.length,
    timepoint,
  };
}

// ─── Test metadata (for UI) ──────────────────────────────────
export const TEST_META: Record<
  TestName,
  {
    name: string;
    short: string;
    icon: string;
    desc: string;
    duration: string;
    color: string;
    soft: string;
  }
> = {
  Stroop: {
    name: "Stroop Test",
    short: "Stroop",
    icon: "type",
    desc: "Diqqatni boshqarish va interferensiyani yengish.",
    duration: "5–7 daq",
    color: "#D97706",
    soft: "#FEF3C7",
  },
  TMT: {
    name: "Trail Making Test",
    short: "TMT",
    icon: "git-branch",
    desc: "Vizual qidiruv va kognitiv moslashuvchanlik.",
    duration: "3–5 daq",
    color: "#0F766E",
    soft: "#CCFBF1",
  },
  DST: {
    name: "Digit Span Test",
    short: "DST",
    icon: "list-ordered",
    desc: "Qisqa muddatli va ishchi xotira.",
    duration: "4–6 daq",
    color: "#2563EB",
    soft: "#DBEAFE",
  },
  LMWT: {
    name: "Lurya Memory Word Test",
    short: "LMWT",
    icon: "book-open",
    desc: "Eshitish-og'zaki o'rganish va xotira (Rey AVLT).",
    duration: "10–15 daq",
    color: "#9333EA",
    soft: "#F3E8FF",
  },
  NS: {
    name: "Nevrologik holatni baholash",
    short: "NS",
    icon: "stethoscope",
    desc: "12 ta nevrologik shkala (MRC, DTR, ICARS, …).",
    duration: "10–15 daq",
    color: "#0891B2",
    soft: "#CFFAFE",
  },
  EEG: {
    name: "EEG ko'rsatkichlari",
    short: "EEG",
    icon: "activity",
    desc: "Alfa, teta ritmi va asimmetriya indekslari.",
    duration: "Asbob orqali",
    color: "#DB2777",
    soft: "#FCE7F3",
  },
  Audio: {
    name: "Audio diqqat testi",
    short: "Audio",
    icon: "ear",
    desc: "Tovushlarni ajratish, diqqat va reaksiya.",
    duration: "5–7 daq",
    color: "#16A34A",
    soft: "#DCFCE7",
  },
};
