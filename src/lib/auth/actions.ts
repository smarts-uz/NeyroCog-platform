"use server";

import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import { doctorProfile } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const signupSchema = z.object({
  fullName: z.string().trim().min(2),
  clinic: z.string().trim().optional(),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export type SignupResult =
  | { ok: true }
  | { ok: false; error: "EMAIL_EXISTS" | "WEAK_PASSWORD" | "VALIDATION" | "UNKNOWN" };

/**
 * Yangi shifokor hisobini yaratish.
 *
 * better-auth `signUpEmail` user + account (parol hash) yaratadi; keyin
 * biz `doctor_profile` qatorini qo'shamiz (F.I.Sh., klinika, rol).
 */
export async function signupDoctor(input: {
  fullName: string;
  clinic?: string;
  email: string;
  password: string;
}): Promise<SignupResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "VALIDATION" };
  }
  const { fullName, clinic, email, password } = parsed.data;

  try {
    const res = await auth.api.signUpEmail({
      body: { name: fullName, email, password },
    });

    if (!res?.user?.id) {
      return { ok: false, error: "UNKNOWN" };
    }

    // doctor_profile — agar mavjud bo'lmasa qo'shamiz
    const existing = await db
      .select({ userId: doctorProfile.userId })
      .from(doctorProfile)
      .where(eq(doctorProfile.userId, res.user.id))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(doctorProfile).values({
        userId: res.user.id,
        fullName,
        clinic: clinic ?? null,
        role: "doctor",
      });
    }

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message.toLowerCase() : "";
    if (message.includes("already") || message.includes("exist")) {
      return { ok: false, error: "EMAIL_EXISTS" };
    }
    if (message.includes("password")) {
      return { ok: false, error: "WEAK_PASSWORD" };
    }
    return { ok: false, error: "UNKNOWN" };
  }
}
