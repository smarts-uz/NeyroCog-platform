"use server";

import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { doctorProfile, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cache } from "react";

export interface DoctorProfile {
  fullName: string;
  email: string;
  title: string | null;
  clinic: string | null;
  phone: string | null;
  role: string;
}

/** Joriy shifokor profilini o'qiydi (user + doctor_profile birlashmasi). */
export const getDoctorProfile = cache(async (): Promise<DoctorProfile | null> => {
  const session = await getSession();
  if (!session) return null;

  const [row] = await db
    .select({
      name: user.name,
      email: user.email,
      fullName: doctorProfile.fullName,
      title: doctorProfile.title,
      clinic: doctorProfile.clinic,
      phone: doctorProfile.phone,
      role: doctorProfile.role,
    })
    .from(user)
    .leftJoin(doctorProfile, eq(doctorProfile.userId, user.id))
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (!row) return null;
  return {
    fullName: row.fullName ?? row.name,
    email: row.email,
    title: row.title,
    clinic: row.clinic,
    phone: row.phone,
    role: row.role ?? "doctor",
  };
});

export type UpdateProfileState =
  | { ok: true }
  | { ok: false; error: "UNAUTHORIZED" | "VALIDATION" | "UNKNOWN" };

/**
 * Shifokor profilini yangilaydi. Email better-auth tomonidan boshqariladi
 * (login identifikatori) — bu yerda o'zgartirilmaydi.
 */
export async function updateDoctorProfile(input: {
  fullName: string;
  title?: string | null;
  clinic?: string | null;
  phone?: string | null;
}): Promise<UpdateProfileState> {
  const session = await getSession();
  if (!session) return { ok: false, error: "UNAUTHORIZED" };

  const fullName = input.fullName?.trim();
  if (!fullName) return { ok: false, error: "VALIDATION" };

  const clean = (v?: string | null) => {
    const s = (v ?? "").trim();
    return s.length ? s.slice(0, 64) : null;
  };
  const title = clean(input.title);
  const clinic = clean(input.clinic);
  const phone = (input.phone ?? "").trim().slice(0, 32) || null;
  const now = new Date();

  try {
    await db
      .update(user)
      .set({ name: fullName, updatedAt: now })
      .where(eq(user.id, session.user.id));

    await db
      .insert(doctorProfile)
      .values({ userId: session.user.id, fullName, title, clinic, phone })
      .onConflictDoUpdate({
        target: doctorProfile.userId,
        set: { fullName, title, clinic, phone, updatedAt: now },
      });

    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "UNKNOWN" };
  }
}
