"use server";

import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import { auditLog, patient, testResult } from "@/lib/db/schema";
import { summarizeTest } from "@/lib/engines/knbt";
import type { EnginePatient, RawByTest, TestName, Timepoint } from "@/lib/engines/types";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export type SaveTestResultState =
  | { ok: true; cogScore: number | null; zScore: number | null }
  | { ok: false; error: "UNAUTHORIZED" | "NOT_FOUND" | "UNKNOWN" };

/**
 * Diagnostik test natijasini saqlaydi.
 *
 * 1. Sessiya + bemorga egalik tekshiriladi
 * 2. KNBT engine `raw` → `scored` (CogScore, Z, label, ISPOCD)
 * 3. test_result jadvaliga yoziladi + audit log
 */
export async function saveTestResult<T extends TestName>(input: {
  patientId: string;
  test: T;
  timepoint?: Timepoint;
  raw: RawByTest[T];
}): Promise<SaveTestResultState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { ok: false, error: "UNAUTHORIZED" };

  const { patientId, test, raw } = input;
  const timepoint: Timepoint = input.timepoint ?? "PreOp";

  // Bemorga egalik + demografiya (yosh score uchun kerak)
  const [p] = await db
    .select()
    .from(patient)
    .where(
      and(
        eq(patient.id, patientId),
        eq(patient.doctorId, session.user.id),
        isNull(patient.archivedAt),
      ),
    )
    .limit(1);

  if (!p) return { ok: false, error: "NOT_FOUND" };

  const now = new Date();
  const enginePatient: EnginePatient = {
    yosh: calcAge(p.tugilgan),
    jinsi: p.jinsi === "Ayol" ? "Ayol" : "Erkak",
    premorbid: (p.premorbid > 0 ? 1 : 0) as 0 | 1,
    davom: p.davom,
    prep: p.prep,
  };

  const summary = summarizeTest(test, raw, timepoint, enginePatient);

  try {
    await db.insert(testResult).values({
      patientId,
      doctorId: session.user.id,
      test,
      timepoint,
      raw: raw as Record<string, unknown>,
      scored: summary as unknown as Record<string, unknown>,
      completedAt: now,
    });

    await db
      .insert(auditLog)
      .values({
        actorUserId: session.user.id,
        patientId,
        action: "test.complete",
        context: { test, timepoint, cogScore: summary.cogScore },
      })
      .catch(() => {});

    revalidatePath("/[locale]/bemorlar/[id]", "page");
    return { ok: true, cogScore: summary.cogScore, zScore: summary.zScore };
  } catch {
    return { ok: false, error: "UNKNOWN" };
  }
}

function calcAge(birth: Date): number {
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return Math.max(0, age);
}
