/**
 * PNB Risk Prediction Engine (TypeScript port).
 *
 * Manba: Excel "Statistics M-3 Risk Factors", n=181 (pos ∪ Sog'lom).
 * Koeffitsientlar (b0, dur, drugs, age, prem) Excel'dan to'g'ridan-to'g'ri
 * olingan. **HECH QACHON o'zgartirmang** sizning bilim doirangizdan
 * tashqari — birinchi Excel'dan tekshiring (CLAUDE.md qoidasi).
 */

import type { EnginePatient } from "./types";

// ─── Coefficient blocks ──────────────────────────────────────
type LRInstrument = "Stroop" | "TMT" | "DST" | "LMWT" | "NS" | "Audio" | "EEG" | "KNBT";

interface LRCoef {
  b0: number;
  dur: number;
  drugs: number;
  age: number;
  prem: number;
  auc: number;
  r2: number;
}

interface MLRCoef {
  dur: number;
  drugs: number;
  age: number;
  prem: number;
  adjR2: number;
}

interface ORBlock {
  dur: number;
  drugs: number;
  age: number;
  prem: number;
}

interface InputProfile {
  dur: number;
  drugs: number;
  age: number;
  prem: 0 | 1;
}

// Logistic regression — Test-3 M2 LR sheet
export const LR_COEF: Record<LRInstrument, LRCoef> = {
  Stroop: {
    b0: -3.3939,
    dur: 0.01543,
    drugs: 1.1572,
    age: -0.4713,
    prem: 2.437,
    auc: 0.748,
    r2: 0.347,
  },
  TMT: {
    b0: -2.8766,
    dur: 0.02425,
    drugs: 0.7342,
    age: -0.3383,
    prem: 1.7694,
    auc: 0.774,
    r2: 0.418,
  },
  DST: {
    b0: -5.3876,
    dur: 0.02349,
    drugs: 1.4077,
    age: -0.5026,
    prem: 2.4281,
    auc: 0.759,
    r2: 0.385,
  },
  LMWT: {
    b0: -2.7484,
    dur: 0.02119,
    drugs: 0.8481,
    age: -0.3823,
    prem: 2.2512,
    auc: 0.76,
    r2: 0.372,
  },
  NS: {
    b0: -6.9093,
    dur: -0.00022,
    drugs: 0.8361,
    age: -0.1499,
    prem: 2.9344,
    auc: 0.675,
    r2: 0.353,
  },
  Audio: {
    b0: -0.704,
    dur: 0.01396,
    drugs: 0.2144,
    age: -0.3262,
    prem: 1.7697,
    auc: 0.666,
    r2: 0.176,
  },
  EEG: {
    b0: -1.4922,
    dur: 0.01563,
    drugs: 0.1483,
    age: -0.4387,
    prem: 4.3157,
    auc: 0.809,
    r2: 0.716,
  },
  KNBT: {
    b0: -5.652,
    dur: 0.02427,
    drugs: 1.3389,
    age: -0.3937,
    prem: 1.2869,
    auc: 0.783,
    r2: 0.451,
  },
};

export const OR: Record<LRInstrument, ORBlock> = {
  Stroop: { dur: 1.02, drugs: 3.18, age: 0.62, prem: 11.44 },
  TMT: { dur: 1.02, drugs: 2.08, age: 0.71, prem: 5.87 },
  DST: { dur: 1.02, drugs: 4.09, age: 0.6, prem: 11.34 },
  LMWT: { dur: 1.02, drugs: 2.34, age: 0.68, prem: 9.5 },
  NS: { dur: 1.0, drugs: 2.31, age: 0.86, prem: 18.81 },
  Audio: { dur: 1.01, drugs: 1.24, age: 0.72, prem: 5.87 },
  EEG: { dur: 1.02, drugs: 1.16, age: 0.64, prem: 74.87 },
  KNBT: { dur: 1.02, drugs: 3.81, age: 0.67, prem: 3.62 },
};

// Multiple linear regression — Test-3 M3 MLR sheet
export const MLR_BASE = 85;
export const MLR_COEF: Record<LRInstrument, MLRCoef> = {
  Stroop: { dur: -0.075, drugs: -1.5, age: 0.8, prem: -16.0, adjR2: 0.566 },
  TMT: { dur: -0.135, drugs: -1.85, age: 0.9, prem: -15.0, adjR2: 0.57 },
  DST: { dur: -0.11, drugs: -2.1, age: 0.95, prem: -15.6, adjR2: 0.581 },
  LMWT: { dur: -0.105, drugs: -1.6, age: 0.85, prem: -14.0, adjR2: 0.456 },
  NS: { dur: -0.02, drugs: -1.2, age: 0.4, prem: -19.0, adjR2: 0.332 },
  Audio: { dur: -0.055, drugs: -0.5, age: 0.7, prem: -11.0, adjR2: 0.434 },
  EEG: { dur: -0.06, drugs: -0.4, age: 0.75, prem: -24.0, adjR2: 0.629 },
  KNBT: { dur: -0.09, drugs: -1.4, age: 0.75, prem: -16.0, adjR2: 0.566 },
};

export const REF_PATIENT: InputProfile = { dur: 90, drugs: 3, age: 11, prem: 0 };

// ─── Core math ───────────────────────────────────────────────
function logistic(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

export interface RiskResult {
  prob: number;
  logit: number;
  auc: number;
  r2: number;
}

export function computeRisk(instrument: LRInstrument, p: InputProfile): RiskResult | null {
  const c = LR_COEF[instrument];
  if (!c) return null;
  const logit = c.b0 + c.dur * p.dur + c.drugs * p.drugs + c.age * p.age + c.prem * p.prem;
  return { prob: logistic(logit), logit, auc: c.auc, r2: c.r2 };
}

export interface SeverityResult {
  score: number;
  adjR2: number;
}

export function computeSeverity(instrument: LRInstrument, p: InputProfile): SeverityResult | null {
  const c = MLR_COEF[instrument];
  if (!c) return null;
  const ref = REF_PATIENT;
  const score =
    MLR_BASE +
    c.dur * (p.dur - ref.dur) +
    c.drugs * (p.drugs - ref.drugs) +
    c.age * (p.age - ref.age) +
    c.prem * (p.prem - ref.prem);
  return { score: Math.max(0, Math.min(100, score)), adjR2: c.adjR2 };
}

// ─── Categories ──────────────────────────────────────────────
export interface Category {
  label: string;
  short: string;
  tone: "ok" | "info" | "warn" | "bad";
  color: string;
}

export function riskCategory(prob: number): Category {
  if (prob < 0.2) return { label: "Past xavf", short: "PAST", tone: "ok", color: "#16A34A" };
  if (prob < 0.45) return { label: "O'rta xavf", short: "O'RTA", tone: "info", color: "#2563EB" };
  if (prob < 0.7) return { label: "Yuqori xavf", short: "YUQORI", tone: "warn", color: "#D97706" };
  return { label: "Juda yuqori xavf", short: "JUDA YUQORI", tone: "bad", color: "#DC2626" };
}

export interface SeverityCat {
  label: string;
  tone: "ok" | "info" | "warn" | "bad";
  color: string;
}

export function severityCategory(score: number): SeverityCat {
  if (score >= 85) return { label: "Sog'lom diapazon", tone: "ok", color: "#16A34A" };
  if (score >= 75) return { label: "Yengil pasayish", tone: "info", color: "#2563EB" };
  if (score >= 65) return { label: "O'rta darajadagi PNB", tone: "warn", color: "#D97706" };
  if (score >= 50) return { label: "Sezilarli PNB", tone: "bad", color: "#DC2626" };
  return { label: "Og'ir kognitiv pasayish", tone: "bad", color: "#991B1B" };
}

// ─── Per-factor contribution ─────────────────────────────────
export interface FactorContribution {
  key: "dur" | "drugs" | "age" | "prem";
  label: string;
  delta: number;
  beta: number;
  or: number | undefined;
  unit: string;
  value: number | string;
  ref: number | string;
  logitContribution: number;
  direction: "increase" | "decrease";
}

export function factorContributions(
  instrument: LRInstrument,
  p: InputProfile,
): FactorContribution[] {
  const c = LR_COEF[instrument];
  if (!c) return [];
  const ref = REF_PATIENT;
  const orBlock = OR[instrument];
  const items: Omit<FactorContribution, "logitContribution" | "direction">[] = [
    {
      key: "dur",
      label: "Anesteziya davomiyligi",
      delta: p.dur - ref.dur,
      beta: c.dur,
      or: orBlock?.dur,
      unit: "daq",
      value: p.dur,
      ref: ref.dur,
    },
    {
      key: "drugs",
      label: "Preparatlar soni",
      delta: p.drugs - ref.drugs,
      beta: c.drugs,
      or: orBlock?.drugs,
      unit: "ta",
      value: p.drugs,
      ref: ref.drugs,
    },
    {
      key: "age",
      label: "Bemor yoshi",
      delta: p.age - ref.age,
      beta: c.age,
      or: orBlock?.age,
      unit: "yosh",
      value: p.age,
      ref: ref.age,
    },
    {
      key: "prem",
      label: "Premorbid nevrologik fon",
      delta: p.prem - ref.prem,
      beta: c.prem,
      or: orBlock?.prem,
      unit: "",
      value: p.prem ? "Mavjud" : "Yo'q",
      ref: "Yo'q",
    },
  ];
  return items
    .map((it) => ({
      ...it,
      logitContribution: it.beta * it.delta,
      direction: (it.beta > 0 ? "increase" : "decrease") as "increase" | "decrease",
    }))
    .sort((a, b) => Math.abs(b.logitContribution) - Math.abs(a.logitContribution));
}

// ─── Clinical recommendations ────────────────────────────────
export interface Recommendation {
  icon: string;
  tone: "ok" | "info" | "warn" | "bad";
  title: string;
  text: string;
}

export function recommendations(p: InputProfile, risk: RiskResult): Recommendation[] {
  const recs: Recommendation[] = [];
  if (risk.prob >= 0.45) {
    recs.push({
      icon: "alert-triangle",
      tone: "warn",
      title: "Operatsiyadan keyin kuchaytirilgan kuzatuv",
      text: "Bu bemorda PNB rivojlanish ehtimoli o'rtacha-yuqori. Operatsiyadan keyingi 7–10 kun davomida kunlik kognitiv tekshiruv tavsiya etiladi.",
    });
  }
  if (p.dur >= 120) {
    recs.push({
      icon: "clock",
      tone: "warn",
      title: "Anesteziya davomiyligi yuqori",
      text: `${p.dur} daqiqa anesteziya — 90 daq dan ko'p. Imkon bo'lsa qisqartirish, multimodal yondashuv qo'llash.`,
    });
  }
  if (p.drugs >= 5) {
    recs.push({
      icon: "pill",
      tone: "warn",
      title: "Polifarmatsiya yuki",
      text: `${p.drugs} ta preparat — neyrotoksik yuk yuqori. Preparat kombinatsiyasini optimallashtirib, sonni kamaytirish maqsadga muvofiq.`,
    });
  }
  if (p.age <= 9) {
    recs.push({
      icon: "baby",
      tone: "warn",
      title: "Kichik yosh — yuqori zaiflik",
      text: `${p.age} yosh — rivojlanayotgan miyaning anesteziyaga sezgirligi yuqori. Eng past samarali doza qo'llash, qisqa muddatli anesteziya tanlash.`,
    });
  }
  if (p.prem >= 1) {
    recs.push({
      icon: "alert-circle",
      tone: "bad",
      title: "Premorbid nevrologik fon mavjud",
      text: "Kognitiv zaxira pasaygan — operatsion stressga chidamlilik kam. Neyroprotektor (Pantogam) profilaktikasini operatsiyagacha boshlash mumkin.",
    });
  }
  if (risk.prob >= 0.7) {
    recs.push({
      icon: "stethoscope",
      tone: "bad",
      title: "Profilaktik davolash uchun nomzod",
      text: "Operatsiyagacha va keyin Pantogam (40 mg/kg/kun, 30–45 kun) + raqamli kognitiv trening kursi tavsiya etiladi.",
    });
  }
  if (recs.length === 0) {
    recs.push({
      icon: "check-circle",
      tone: "ok",
      title: "Standart kuzatuv",
      text: "Xavf profili past — odatdagi postoperativ kuzatuv yetarli. Operatsiyadan keyingi 7–10 kun davomida bir martalik KNBT testi tavsiya etiladi.",
    });
  }
  return recs;
}

// ─── Master forecast ─────────────────────────────────────────
export interface ForecastResult {
  input: InputProfile;
  composite: {
    risk: RiskResult;
    category: Category;
    severity: SeverityResult;
    sevCategory: SeverityCat;
  };
  perInstrument: Record<
    string,
    {
      risk: RiskResult;
      severity: SeverityResult;
      riskCat: Category;
      sevCat: SeverityCat;
    }
  >;
  contributions: FactorContribution[];
  recommendations: Recommendation[];
}

export function forecast(patient: EnginePatient): ForecastResult {
  const p: InputProfile = {
    dur: Number(patient.davom) || 0,
    drugs: Number(patient.prep) || 0,
    age: Number(patient.yosh) || 0,
    prem: Number(patient.premorbid) > 0 ? 1 : 0,
  };

  const compositeRisk = computeRisk("KNBT", p);
  const compositeSeverity = computeSeverity("KNBT", p);
  if (!compositeRisk || !compositeSeverity) {
    throw new Error("KNBT model coefficients missing");
  }
  const compositeCategory = riskCategory(compositeRisk.prob);
  const severityCategoryComposite = severityCategory(compositeSeverity.score);

  const instruments: LRInstrument[] = ["Stroop", "TMT", "DST", "LMWT", "NS", "EEG", "Audio"];
  const perInstrument: ForecastResult["perInstrument"] = {};
  for (const t of instruments) {
    const r = computeRisk(t, p);
    const s = computeSeverity(t, p);
    if (!r || !s) continue;
    perInstrument[t] = {
      risk: r,
      severity: s,
      riskCat: riskCategory(r.prob),
      sevCat: severityCategory(s.score),
    };
  }

  return {
    input: p,
    composite: {
      risk: compositeRisk,
      category: compositeCategory,
      severity: compositeSeverity,
      sevCategory: severityCategoryComposite,
    },
    perInstrument,
    contributions: factorContributions("KNBT", p),
    recommendations: recommendations(p, compositeRisk),
  };
}
