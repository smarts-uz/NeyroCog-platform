import "server-only";

import { db } from "@/lib/db/client";
import { patient, testResult, trainingSession } from "@/lib/db/schema";
import { and, desc, eq, ilike, isNull, or } from "drizzle-orm";

export interface TimepointInfo {
  /** Shu timepoint'da bajarilgan testlar soni */
  count: number;
  /** Composite ISPOCD musbat (≥2/4 core testda Z ≤ −1.96) */
  ispcd: boolean;
}

export interface PatientListItem {
  id: string;
  fish: string;
  jinsi: string;
  tugilgan: Date;
  yosh: number;
  premorbid: number;
  davom: number;
  prep: number;
  boshlanish: Date | null;
  tugash: Date | null;
  sana: Date;
  // aggregat: testlar va trening seanslari soni
  testCount: number;
  trainingCount: number;
  // timepoint bo'yicha taqsimot (PreOp/PostOp/PostTx)
  timepoints: Record<"PreOp" | "PostOp" | "PostTx", TimepointInfo>;
  /** Reabilitatsiyada bajarilgan UNIKAL mashqlar soni */
  rehabExercises: number;
}

// ISPOCD = ≥2/4 core testda Z ≤ −1.96 (CLAUDE.md)
const CORE_TESTS = new Set(["Stroop", "TMT", "DST", "LMWT"]);
const ISPOCD_Z = -1.96;
const TIMEPOINTS = ["PreOp", "PostOp", "PostTx"] as const;
type Tp = (typeof TIMEPOINTS)[number];

function emptyTimepoints(): Record<Tp, TimepointInfo> {
  return {
    PreOp: { count: 0, ispcd: false },
    PostOp: { count: 0, ispcd: false },
    PostTx: { count: 0, ispcd: false },
  };
}

/**
 * Bemorlar ro'yxati — joriy doktor uchun, archived bo'lmaganlar.
 * Har shifokor faqat o'zining bemorlarini ko'radi.
 */
export async function listPatients(opts: {
  doctorId: string;
  query?: string;
}): Promise<PatientListItem[]> {
  const { doctorId, query } = opts;

  const where = and(
    eq(patient.doctorId, doctorId),
    isNull(patient.archivedAt),
    query ? or(ilike(patient.fish, `%${query}%`)) : undefined,
  );

  const rows = await db
    .select({
      id: patient.id,
      fish: patient.fish,
      jinsi: patient.jinsi,
      tugilgan: patient.tugilgan,
      premorbid: patient.premorbid,
      davom: patient.davom,
      prep: patient.prep,
      boshlanish: patient.boshlanish,
      tugash: patient.tugash,
      sana: patient.sana,
    })
    .from(patient)
    .where(where)
    .orderBy(desc(patient.sana))
    .limit(500);

  if (rows.length === 0) return [];

  const ids = new Set(rows.map((r) => r.id));

  // Test natijalari — timepoint taqsimoti + ISPOCD uchun zScore.
  const [testRows, trainingRows] = await Promise.all([
    db
      .select({
        patientId: testResult.patientId,
        test: testResult.test,
        timepoint: testResult.timepoint,
        scored: testResult.scored,
      })
      .from(testResult)
      .where(eq(testResult.doctorId, doctorId))
      .catch(() => []),
    db
      .select({
        patientId: trainingSession.patientId,
        exerciseId: trainingSession.exerciseId,
      })
      .from(trainingSession)
      .where(eq(trainingSession.doctorId, doctorId))
      .catch(() => []),
  ]);

  // Per-patient agregatsiya
  const tpMap = new Map<string, Record<Tp, TimepointInfo>>();
  const testCount = new Map<string, number>();
  // core test zScore'lar (ISPOCD hisoblash uchun): patient → tp → zScores[]
  const coreZ = new Map<string, Record<Tp, number[]>>();

  for (const r of testRows) {
    if (!ids.has(r.patientId)) continue;
    const tp = (TIMEPOINTS as readonly string[]).includes(r.timepoint) ? (r.timepoint as Tp) : null;
    if (!tp) continue;

    testCount.set(r.patientId, (testCount.get(r.patientId) ?? 0) + 1);

    const tps = tpMap.get(r.patientId) ?? emptyTimepoints();
    tps[tp].count += 1;
    tpMap.set(r.patientId, tps);

    if (CORE_TESTS.has(r.test)) {
      const z = (r.scored as { zScore?: number | null } | null)?.zScore;
      if (typeof z === "number") {
        const cz = coreZ.get(r.patientId) ?? { PreOp: [], PostOp: [], PostTx: [] };
        cz[tp].push(z);
        coreZ.set(r.patientId, cz);
      }
    }
  }

  // ISPOCD bayrog'ini o'rnatish
  for (const [pid, cz] of coreZ) {
    const tps = tpMap.get(pid);
    if (!tps) continue;
    for (const tp of TIMEPOINTS) {
      const belowCount = cz[tp].filter((z) => z <= ISPOCD_Z).length;
      tps[tp].ispcd = belowCount >= 2;
    }
  }

  const trainingCount = new Map<string, number>();
  const rehabSet = new Map<string, Set<string>>();
  for (const r of trainingRows) {
    if (!ids.has(r.patientId)) continue;
    trainingCount.set(r.patientId, (trainingCount.get(r.patientId) ?? 0) + 1);
    const s = rehabSet.get(r.patientId) ?? new Set<string>();
    s.add(r.exerciseId);
    rehabSet.set(r.patientId, s);
  }

  return rows.map((r) => ({
    ...r,
    yosh: calcAge(r.tugilgan),
    testCount: testCount.get(r.id) ?? 0,
    trainingCount: trainingCount.get(r.id) ?? 0,
    timepoints: tpMap.get(r.id) ?? emptyTimepoints(),
    rehabExercises: rehabSet.get(r.id)?.size ?? 0,
  }));
}

/**
 * Tug'ilgan sanadan yoshni hisoblash (yil aniqligi bilan).
 */
function calcAge(birth: Date): number {
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return Math.max(0, age);
}
