/**
 * KNBT engine — umumiy turlar
 *
 * Bemor uchun minimal shakl — barcha engine'lar shu interfeysni ishlatadi.
 * To'liq DB shakli `lib/db/schema.ts`'da.
 */

export type Sex = "Erkak" | "Ayol";

export interface EnginePatient {
  yosh: number; // 0–18
  jinsi?: Sex;
  premorbid: 0 | 1; // CLAUDE.md: binary only
  davom: number; // amaliyot davomiyligi (daqiqada)
  prep: number; // preparatlar soni
}

export type TestName = "Stroop" | "TMT" | "DST" | "LMWT" | "NS" | "EEG" | "Audio";
export type Timepoint = "PreOp" | "PostOp" | "PostTx";

export type Tone = "great" | "good" | "ok" | "warn" | "bad" | "neutral";

export interface CogLabel {
  label: string;
  tone: Tone;
}

export interface NormRef {
  m: number;
  sd: number;
}

export interface TestSummary {
  cogScore: number | null;
  cognitiveHealth: string;
  tone: Tone;
  zScore: number | null;
  ispcd: boolean;
  timepoint: Timepoint;
  normRef: NormRef;
}

export interface CompositeSummary {
  compositeScore: number;
  cognitiveHealth: string;
  tone: Tone;
  zScore: number | null;
  ispcd: boolean;
  ispcdCount: number;
  ispcdRequired: number;
  includedTests: number;
  timepoint: Timepoint;
}

// Test raw shapes — har test uchun aniq kirish
export interface StroopRaw {
  correct: number;
  errors: number;
  skipped?: number;
  totalTimeSec: number;
  totalTrials?: number;
}

export interface TMTRaw {
  aTime: number;
  aErrors?: number;
  bTime?: number;
  bErrors?: number;
}

export interface DSTRaw {
  forward: number;
  backward?: number;
}

export interface LMWTRaw {
  v1: number;
  v2?: number;
  v3?: number;
  v4?: number;
  v5?: number;
  vDelay?: number;
}

export interface NSRaw {
  mrc?: number;
  dtr?: number;
  icars?: number;
  etdrs?: number;
  pta?: number;
  dhi?: number;
  omf?: number;
  fois?: number;
  fda?: number;
  psqi?: number;
  cn?: number;
  asa?: number;
}

export interface EEGRaw {
  alphaAmp: number;
  thetaAmp?: number;
  ihaAlpha?: number;
  swiAnt?: number;
  alphaPost?: number;
  iaf?: number;
  thetaAlpha?: number;
}

export interface AudioRaw {
  correct: number;
  errors?: number;
  totalTimeSec: number;
  totalTrials?: number;
}

export type RawByTest = {
  Stroop: StroopRaw;
  TMT: TMTRaw;
  DST: DSTRaw;
  LMWT: LMWTRaw;
  NS: NSRaw;
  EEG: EEGRaw;
  Audio: AudioRaw;
};
