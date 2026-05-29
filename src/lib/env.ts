import "server-only";

import { z } from "zod";

/**
 * Server muhit o'zgaruvchilarini ishga tushishda (fail-fast) tekshiradi.
 * Noto'g'ri/yetishmayotgan konfiguratsiya production'da jim ishlamaslik o'rniga
 * aniq xato bilan to'xtatadi. Faqat serverda import qilinadi (`server-only`).
 */
const serverSchema = z.object({
  // Supabase Postgres ulanish satri (Drizzle / postgres-js)
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL kerak")
    .refine((s) => s.startsWith("postgres://") || s.startsWith("postgresql://"), {
      message: "DATABASE_URL postgres:// yoki postgresql:// bo'lishi kerak",
    }),
  // better-auth maxfiy kaliti — production'da 32+ belgi tavsiya etiladi
  BETTER_AUTH_SECRET: z.string().min(16, "BETTER_AUTH_SECRET kamida 16 belgi bo'lsin"),
  // Auth/callback bazaviy URL — production'da real https domen
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
  // Ixtiyoriy: qo'shimcha ishonchli originlar (vergul bilan ajratilgan)
  AUTH_TRUSTED_ORIGINS: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

function loadEnv() {
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.flatten().fieldErrors;
    // eslint-disable-next-line no-console
    console.error("\n❌ Noto'g'ri server muhit o'zgaruvchilari:\n", issues);
    throw new Error(
      "Server muhit o'zgaruvchilari noto'g'ri yoki yetishmaydi. .env.local.example'ga qarang.",
    );
  }
  return parsed.data;
}

export const env = loadEnv();

export const isProd = env.NODE_ENV === "production";

/** better-auth uchun ishonchli originlar ro'yxati. */
export function trustedOrigins(): string[] {
  const set = new Set<string>([env.BETTER_AUTH_URL]);
  if (env.AUTH_TRUSTED_ORIGINS) {
    for (const o of env.AUTH_TRUSTED_ORIGINS.split(",")) {
      const t = o.trim();
      if (t) set.add(t);
    }
  }
  return [...set];
}
