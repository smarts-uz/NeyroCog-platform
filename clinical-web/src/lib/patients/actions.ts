"use server";

import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import { auditLog, patient } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { newPatientSchema } from "./schema";

export async function createPatient(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { ok: false as const, error: "UNAUTHORIZED" };
  }

  const parsed = newPatientSchema.safeParse({
    fish: formData.get("fish"),
    jinsi: formData.get("jinsi"),
    tugilgan: formData.get("tugilgan"),
    premorbid: Number(formData.get("premorbid")) > 0 ? 1 : 0,
    boshlanish: formData.get("boshlanish"),
    tugash: formData.get("tugash"),
    prep: formData.get("prep"),
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      error: "VALIDATION",
      issues: parsed.error.flatten(),
    };
  }

  const v = parsed.data;
  const start = new Date(v.boshlanish);
  const end = new Date(v.tugash);
  const davom = Math.round((end.getTime() - start.getTime()) / 60000);

  const [created] = await db
    .insert(patient)
    .values({
      doctorId: session.user.id,
      fish: v.fish,
      jinsi: v.jinsi,
      tugilgan: new Date(v.tugilgan),
      premorbid: v.premorbid,
      boshlanish: start,
      tugash: end,
      davom,
      prep: v.prep,
    })
    .returning({ id: patient.id });

  if (created) {
    await db
      .insert(auditLog)
      .values({
        actorUserId: session.user.id,
        patientId: created.id,
        action: "patient.create",
        context: { fish: v.fish, jinsi: v.jinsi, davom, prep: v.prep },
      })
      .catch(() => {
        // audit log xatoligi asosiy operatsiyani bekor qilmaydi
      });
  }

  revalidatePath("/[locale]/bemorlar", "page");
  return { ok: true as const, id: created?.id };
}

export async function updatePatient(patientId: string, formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { ok: false as const, error: "UNAUTHORIZED" };
  }

  // Egalik tekshiruvi
  const [owned] = await db
    .select({ id: patient.id })
    .from(patient)
    .where(
      and(
        eq(patient.id, patientId),
        eq(patient.doctorId, session.user.id),
        isNull(patient.archivedAt),
      ),
    )
    .limit(1);
  if (!owned) {
    return { ok: false as const, error: "NOT_FOUND" };
  }

  const parsed = newPatientSchema.safeParse({
    fish: formData.get("fish"),
    jinsi: formData.get("jinsi"),
    tugilgan: formData.get("tugilgan"),
    premorbid: Number(formData.get("premorbid")) > 0 ? 1 : 0,
    boshlanish: formData.get("boshlanish"),
    tugash: formData.get("tugash"),
    prep: formData.get("prep"),
  });
  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION", issues: parsed.error.flatten() };
  }

  const v = parsed.data;
  const start = new Date(v.boshlanish);
  const end = new Date(v.tugash);
  const davom = Math.round((end.getTime() - start.getTime()) / 60000);

  await db
    .update(patient)
    .set({
      fish: v.fish,
      jinsi: v.jinsi,
      tugilgan: new Date(v.tugilgan),
      premorbid: v.premorbid,
      boshlanish: start,
      tugash: end,
      davom,
      prep: v.prep,
      updatedAt: new Date(),
    })
    .where(eq(patient.id, patientId));

  await db
    .insert(auditLog)
    .values({
      actorUserId: session.user.id,
      patientId,
      action: "patient.update",
      context: { fish: v.fish, davom, prep: v.prep },
    })
    .catch(() => {});

  revalidatePath("/[locale]/bemorlar", "page");
  revalidatePath("/[locale]/bemorlar/[id]", "page");
  return { ok: true as const };
}
