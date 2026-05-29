/**
 * Seed script — birinchi shifokor hisobini yaratadi.
 *
 * Foydalanish:
 *   npm run seed
 *   # yoki o'zgartirilgan qiymatlar bilan:
 *   SEED_EMAIL=doktor@klinika.uz SEED_PASSWORD=parol1234 SEED_NAME="Dr. Aliyev" npm run seed
 *
 * Bu skript `server-only` modullarni import qilmaydi (ular faqat Next.js
 * bundlerida ishlaydi), shu sabab o'z `db` + `betterAuth` instansiyasini
 * quradi. Parol hash better-auth bilan bir xil (scrypt) bo'ladi —
 * shu sabab keyin login ishlaydi.
 */

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/lib/db/schema";

const DATABASE_URL = process.env.DATABASE_URL;
const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET;

if (!DATABASE_URL) {
  console.error("✗ DATABASE_URL is not set. Fill .env.local first.");
  process.exit(1);
}
if (!BETTER_AUTH_SECRET) {
  console.error("✗ BETTER_AUTH_SECRET is not set. Fill .env.local first.");
  process.exit(1);
}

const email = process.env.SEED_EMAIL ?? "doktor@klinika.uz";
const password = process.env.SEED_PASSWORD ?? "doktor1234";
const name = process.env.SEED_NAME ?? "Doktor";
const clinic = process.env.SEED_CLINIC ?? null;

async function main() {
  const queryClient = postgres(DATABASE_URL as string, { prepare: false, max: 1 });
  const db = drizzle({ client: queryClient, schema });

  const auth = betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    secret: BETTER_AUTH_SECRET,
    emailAndPassword: { enabled: true, minPasswordLength: 8 },
  });

  // Mavjudligini tekshirish
  const existing = await db.select().from(schema.user).where(eq(schema.user.email, email)).limit(1);
  if (existing.length > 0) {
    console.log(`ℹ Foydalanuvchi allaqachon mavjud: ${email}`);
    await queryClient.end();
    return;
  }

  const res = await auth.api.signUpEmail({ body: { name, email, password } });
  if (!res?.user?.id) {
    console.error("✗ Hisob yaratilmadi.");
    await queryClient.end();
    process.exit(1);
  }

  await db.insert(schema.doctorProfile).values({
    userId: res.user.id,
    fullName: name,
    clinic,
    role: "admin", // birinchi foydalanuvchi — admin
  });

  console.log("✓ Birinchi shifokor hisobi yaratildi:");
  console.log(`   email:  ${email}`);
  console.log(`   parol:  ${password}`);
  console.log("   rol:    admin");
  console.log("\n  http://localhost:3000/uz/login orqali kiring.");

  await queryClient.end();
}

main().catch((err) => {
  console.error("✗ Seed xatosi:", err);
  process.exit(1);
});
