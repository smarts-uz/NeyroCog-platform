import "server-only";

import { db } from "@/lib/db/client";
import { patient, testResult, trainingSession } from "@/lib/db/schema";
import { and, desc, eq, ilike, isNull, or } from "drizzle-orm";

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
}

/**
 * Bemorlar ro'yxati — joriy doktor uchun, archived bo'lmaganlar.
 *
 * Adminlar uchun keyinroq role check qo'shamiz; hozir har shifokor
 * faqat o'zining bemorlarini ko'radi.
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

  // Agregat — testlar va trening seanslari soni
  // (alohida so'rovlar — bemorlar ro'yxati uchun yetarli)
  const ids = rows.map((r) => r.id);
  const counts = await Promise.all([
    db
      .select({ patientId: testResult.patientId })
      .from(testResult)
      .where(and(...ids.map((id) => eq(testResult.patientId, id))))
      .then((res) => {
        const map = new Map<string, number>();
        for (const r of res) {
          map.set(r.patientId, (map.get(r.patientId) ?? 0) + 1);
        }
        return map;
      })
      .catch(() => new Map<string, number>()),
    db
      .select({ patientId: trainingSession.patientId })
      .from(trainingSession)
      .where(and(...ids.map((id) => eq(trainingSession.patientId, id))))
      .then((res) => {
        const map = new Map<string, number>();
        for (const r of res) {
          map.set(r.patientId, (map.get(r.patientId) ?? 0) + 1);
        }
        return map;
      })
      .catch(() => new Map<string, number>()),
  ]);

  const [testCounts, trainingCounts] = counts;

  return rows.map((r) => ({
    ...r,
    yosh: calcAge(r.tugilgan),
    testCount: testCounts.get(r.id) ?? 0,
    trainingCount: trainingCounts.get(r.id) ?? 0,
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
