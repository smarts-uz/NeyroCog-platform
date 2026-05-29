import "server-only";

import { db } from "@/lib/db/client";
import { patient, testResult, trainingSession } from "@/lib/db/schema";
import { summarizeComposite } from "@/lib/engines/knbt";
import { forecast } from "@/lib/engines/prediction";
import type { TestName, TestSummary } from "@/lib/engines/types";
import { and, desc, eq, isNull } from "drizzle-orm";

export interface CohortPatient {
  id: string;
  fish: string;
  jinsi: string;
  yosh: number;
  premorbid: number;
  davom: number;
  prep: number;
  testCount: number;
  trainingCount: number;
  compositeScore: number | null;
  ispcd: boolean;
  riskProb: number; // 0–1
  expectedCogScore: number; // 0–100
  // ROC tahlili uchun: per-instrument CogScore (KNBT = composite) + label
  scores: Record<string, number>;
  label: number | null; // composite ispcd → 1/0, testlar yo'q bo'lsa null
}

function calcAge(birth: Date): number {
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return Math.max(0, age);
}

/**
 * Doktorning butun kohorti — har bemor uchun composite ISPOCD + forecast risk
 * server tomonda hisoblanadi (engine'lar bilan).
 */
export async function getCohort(doctorId: string): Promise<CohortPatient[]> {
  const patients = await db
    .select()
    .from(patient)
    .where(and(eq(patient.doctorId, doctorId), isNull(patient.archivedAt)))
    .orderBy(desc(patient.sana))
    .limit(1000);

  if (patients.length === 0) return [];

  const [allResults, allTraining] = await Promise.all([
    db.select().from(testResult).where(eq(testResult.doctorId, doctorId)),
    db.select().from(trainingSession).where(eq(trainingSession.doctorId, doctorId)),
  ]);

  const resultsByPatient = new Map<string, typeof allResults>();
  for (const r of allResults) {
    const arr = resultsByPatient.get(r.patientId) ?? [];
    arr.push(r);
    resultsByPatient.set(r.patientId, arr);
  }
  const trainingByPatient = new Map<string, number>();
  for (const t of allTraining) {
    trainingByPatient.set(t.patientId, (trainingByPatient.get(t.patientId) ?? 0) + 1);
  }

  return patients.map((p) => {
    const yosh = calcAge(p.tugilgan);
    const rows = resultsByPatient.get(p.id) ?? [];
    // latest per test
    const summaries: Partial<Record<TestName, TestSummary>> = {};
    for (const r of rows) {
      const test = r.test as TestName;
      if (!summaries[test]) summaries[test] = r.scored as TestSummary;
    }
    const composite = summarizeComposite(summaries, "PreOp");

    // Per-instrument CogScore (ROC uchun)
    const scores: Record<string, number> = {};
    for (const [test, summary] of Object.entries(summaries)) {
      if (summary?.cogScore != null) scores[test] = summary.cogScore;
    }
    if (composite?.compositeScore != null) scores.KNBT = composite.compositeScore;

    let riskProb = 0;
    let expectedCogScore = 0;
    if (p.davom > 0) {
      const f = forecast({
        yosh,
        jinsi: p.jinsi === "Ayol" ? "Ayol" : "Erkak",
        premorbid: (p.premorbid > 0 ? 1 : 0) as 0 | 1,
        davom: p.davom,
        prep: p.prep,
      });
      riskProb = f.composite.risk.prob;
      expectedCogScore = f.composite.severity.score;
    }

    return {
      id: p.id,
      fish: p.fish,
      jinsi: p.jinsi,
      yosh,
      premorbid: p.premorbid,
      davom: p.davom,
      prep: p.prep,
      testCount: rows.length,
      trainingCount: trainingByPatient.get(p.id) ?? 0,
      compositeScore: composite?.compositeScore ?? null,
      ispcd: composite?.ispcd ?? false,
      riskProb,
      expectedCogScore,
      scores,
      label: composite ? (composite.ispcd ? 1 : 0) : null,
    };
  });
}
