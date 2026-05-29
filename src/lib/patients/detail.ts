import "server-only";

import { db } from "@/lib/db/client";
import { patient, testResult, trainingSession } from "@/lib/db/schema";
import type { TestName, Timepoint } from "@/lib/engines/types";
import { and, desc, eq, isNull } from "drizzle-orm";

export interface PatientDetail {
  id: string;
  fish: string;
  jinsi: string;
  tugilgan: string; // ISO
  yosh: number;
  premorbid: number;
  davom: number;
  prep: number;
  boshlanish: string | null;
  tugash: string | null;
  sana: string;
}

export interface TestResultRow {
  id: string;
  test: TestName;
  timepoint: Timepoint;
  raw: unknown;
  scored: unknown;
  completedAt: string;
}

export interface TrainingRow {
  id: string;
  exerciseId: string;
  score: number;
  accuracy: number;
  duration: number;
  level: number;
  completedAt: string;
}

export interface PatientDetailBundle {
  patient: PatientDetail;
  results: TestResultRow[];
  training: TrainingRow[];
}

function calcAge(birth: Date): number {
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return Math.max(0, age);
}

/**
 * Bemorni + uning barcha test natijalari va trening seanslarini yuklaydi.
 * Faqat shu doktorga tegishli bo'lsa qaytaradi (aks holda null).
 */
export async function getPatientDetail(opts: {
  patientId: string;
  doctorId: string;
}): Promise<PatientDetailBundle | null> {
  const { patientId, doctorId } = opts;

  const [p] = await db
    .select()
    .from(patient)
    .where(
      and(eq(patient.id, patientId), eq(patient.doctorId, doctorId), isNull(patient.archivedAt)),
    )
    .limit(1);

  if (!p) return null;

  const [results, training] = await Promise.all([
    db
      .select()
      .from(testResult)
      .where(eq(testResult.patientId, patientId))
      .orderBy(desc(testResult.completedAt)),
    db
      .select()
      .from(trainingSession)
      .where(eq(trainingSession.patientId, patientId))
      .orderBy(desc(trainingSession.completedAt)),
  ]);

  return {
    patient: {
      id: p.id,
      fish: p.fish,
      jinsi: p.jinsi,
      tugilgan: p.tugilgan.toISOString(),
      yosh: calcAge(p.tugilgan),
      premorbid: p.premorbid,
      davom: p.davom,
      prep: p.prep,
      boshlanish: p.boshlanish ? p.boshlanish.toISOString() : null,
      tugash: p.tugash ? p.tugash.toISOString() : null,
      sana: p.sana.toISOString(),
    },
    results: results.map((r) => ({
      id: r.id,
      test: r.test as TestName,
      timepoint: r.timepoint as Timepoint,
      raw: r.raw,
      scored: r.scored,
      completedAt: r.completedAt.toISOString(),
    })),
    training: training.map((tr) => ({
      id: tr.id,
      exerciseId: tr.exerciseId,
      score: tr.score,
      accuracy: tr.accuracy,
      duration: tr.duration,
      level: tr.level,
      completedAt: tr.completedAt.toISOString(),
    })),
  };
}
