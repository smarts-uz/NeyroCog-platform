"use server";

import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import { auditLog, patient, trainingSession } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type { ExerciseId } from "./meta";

export type SaveTrainingState =
  | { ok: true }
  | { ok: false; error: "UNAUTHORIZED" | "NOT_FOUND" | "UNKNOWN" };

/**
 * Reabilitatsiya seansini saqlaydi. accuracy 0–1 oraliqda keladi, DB'ga
 * foiz (0–100 integer) sifatida yoziladi.
 */
export async function saveTrainingSession(input: {
  patientId: string;
  exerciseId: ExerciseId;
  score: number;
  accuracy: number; // 0–1
  duration: number; // ms
  level?: number;
  raw?: Record<string, unknown>;
}): Promise<SaveTrainingState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { ok: false, error: "UNAUTHORIZED" };

  const [p] = await db
    .select({ id: patient.id })
    .from(patient)
    .where(
      and(
        eq(patient.id, input.patientId),
        eq(patient.doctorId, session.user.id),
        isNull(patient.archivedAt),
      ),
    )
    .limit(1);

  if (!p) return { ok: false, error: "NOT_FOUND" };

  try {
    await db.insert(trainingSession).values({
      patientId: input.patientId,
      doctorId: session.user.id,
      exerciseId: input.exerciseId,
      score: Math.round(input.score),
      accuracy: Math.round(Math.max(0, Math.min(1, input.accuracy)) * 100),
      duration: Math.round(input.duration / 1000),
      level: input.level ?? 1,
      raw: input.raw ?? null,
      completedAt: new Date(),
    });

    await db
      .insert(auditLog)
      .values({
        actorUserId: session.user.id,
        patientId: input.patientId,
        action: "training.complete",
        context: { exerciseId: input.exerciseId, score: input.score },
      })
      .catch(() => {});

    revalidatePath("/[locale]/bemorlar/[id]", "page");
    return { ok: true };
  } catch {
    return { ok: false, error: "UNKNOWN" };
  }
}
