import "server-only";

import { db } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is not set. See .env.local.example.");
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),

  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",

  // ─── Email + password (asosiy provayder) ──────────────────────
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // MVP — keyinroq Resend bilan yoqamiz
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },

  // ─── Sessiya ──────────────────────────────────────────────────
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 kun
    updateAge: 60 * 60 * 24, // 1 kunda bir marta refresh
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 daqiqa edge cache
    },
  },

  // ─── Trust hosts (Next.js Server Actions uchun) ───────────────
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],

  // ─── Plugins ──────────────────────────────────────────────────
  plugins: [
    // nextCookies — barcha cookie'larni Server Actions'da to'g'ri o'rnatadi
    nextCookies(),
    // TODO: keyinroq qo'shamiz:
    //   - twoFactor() — TOTP 2FA
    //   - admin() — admin roli boshqaruvi
  ],
});

export type AuthSession = typeof auth.$Infer.Session;
export type AuthUser = typeof auth.$Infer.Session.user;
