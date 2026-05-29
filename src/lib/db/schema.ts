/**
 * Drizzle schema — Pediatrik Kognitiv Test Tizimi (KTT)
 *
 * Konvensiya:
 * - Hamma jadval `snake_case`, Drizzle `camelCase` accessor bilan
 * - Bemor obyekti CLAUDE.md'dagi shaklga mos keladi
 * - `premorbid` har doim 0 yoki 1 (binary, smallint)
 * - Vaqt belgilari `timestamptz` (timezone-aware)
 * - RLS Supabase migratsiyalarida alohida o'rnatiladi (raw SQL)
 *
 * better-auth tomonidan boshqariladigan jadvallar:
 *   user, session, account, verification
 *   — bularning struktura `better-auth generate` orqali avtomatik
 *     yaratiladi; bu yerda biz qo'shimcha qatorlar yozmaymiz, faqat
 *     fk ulanish uchun id'sini eksport qilamiz.
 */

import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// ──────────────────────────────────────────────────────────────
// better-auth core tables
// (struktura: https://www.better-auth.com/docs/concepts/database)
// ──────────────────────────────────────────────────────────────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("account_provider_unique").on(t.providerId, t.accountId),
    index("account_user_idx").on(t.userId),
  ],
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ──────────────────────────────────────────────────────────────
// Domain — doctor (klinik foydalanuvchi profili)
// `user` jadvalini extend qiladi
// ──────────────────────────────────────────────────────────────

export const doctorProfile = pgTable("doctor_profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  clinic: text("clinic"),
  // Roller: "doctor" (oddiy shifokor), "admin" (klinika boshlig'i) — kirish darajasi
  role: varchar("role", { length: 16 }).notNull().default("doctor"),
  // Lavozim / mutaxassislik (Nevropatolog, Pediatr, ...) — profil ko'rsatkichi
  title: varchar("title", { length: 64 }),
  // Aloqa telefoni
  phone: varchar("phone", { length: 32 }),
  // Til afzalligi (uz / ru / en), null bo'lsa browser locale ishlatiladi
  preferredLocale: varchar("preferred_locale", { length: 4 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ──────────────────────────────────────────────────────────────
// Domain — bemor (asosiy klinik subyekt)
// ──────────────────────────────────────────────────────────────

export const patient = pgTable(
  "patient",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    // Bemor qaysi shifokorga biriktirilgan (creator/owner)
    doctorId: text("doctor_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),

    fish: text("fish").notNull(), // F.I.Sh.
    jinsi: varchar("jinsi", { length: 8 }).notNull(), // "Erkak" | "Ayol"
    tugilgan: timestamp("tugilgan", { withTimezone: false, mode: "date" }).notNull(),

    // Premorbid nevrologik fon — HAR DOIM 0 yoki 1 (CLAUDE.md qoidasi)
    premorbid: smallint("premorbid").notNull().default(0),

    // Amaliyot vaqtlari va davomiyligi
    boshlanish: timestamp("boshlanish", { withTimezone: true }),
    tugash: timestamp("tugash", { withTimezone: true }),
    davom: integer("davom").notNull(), // daqiqada — tugash − boshlanish

    // Anestetik preparatlar soni
    prep: smallint("prep").notNull(),

    // Ro'yxatga olingan sana
    sana: timestamp("sana", { withTimezone: true }).notNull().defaultNow(),

    // Soft-delete uchun
    archivedAt: timestamp("archived_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("patient_doctor_idx").on(t.doctorId),
    index("patient_fish_idx").on(t.fish),
    index("patient_sana_idx").on(t.sana),
  ],
);

// ──────────────────────────────────────────────────────────────
// Domain — diagnostic test natijasi
// Bitta bemor uchun bitta test bir necha marta o'tkazilishi mumkin
// (PreOp, PostOp, PostTx) — `timepoint` farqlaydi
// ──────────────────────────────────────────────────────────────

export const testResult = pgTable(
  "test_result",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patient.id, { onDelete: "cascade" }),
    doctorId: text("doctor_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),

    // "Stroop" | "TMT" | "DST" | "LMWT" | "NS" | "EEG" | "Audio"
    test: varchar("test", { length: 16 }).notNull(),
    // "PreOp" | "PostOp" | "PostTx"
    timepoint: varchar("timepoint", { length: 16 }).notNull().default("PreOp"),

    // KNBT engine input: test-specific xom javoblar va vaqtlar
    // (Stroop: { correct, errors, rtMean, ... }, TMT: { time, errors }, ...)
    raw: jsonb("raw").notNull(),

    // KNBT engine output: { cogScore, zScore, label, ... }
    scored: jsonb("scored").notNull(),

    completedAt: timestamp("completed_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("test_result_patient_idx").on(t.patientId),
    index("test_result_test_idx").on(t.test, t.timepoint),
    index("test_result_doctor_idx").on(t.doctorId),
  ],
);

// ──────────────────────────────────────────────────────────────
// Domain — reabilitatsiya seansi (2-Dastur)
// ──────────────────────────────────────────────────────────────

export const trainingSession = pgTable(
  "training_session",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patient.id, { onDelete: "cascade" }),
    doctorId: text("doctor_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),

    // 50 ta mashq id'sidan biri (meta.ts ExerciseId union) — masalan
    // "visualSearch", "att_stroop", "em_breathe". DB-darajada CHECK
    // qo'yilmaydi: qiymat ilova qatlamida (TypeScript union) validatsiya
    // qilinadi (eski training_exercise_valid CHECK olib tashlangan).
    exerciseId: varchar("exercise_id", { length: 24 }).notNull(),
    score: integer("score").notNull(),
    accuracy: integer("accuracy").notNull(), // 0-100 (foiz)
    duration: integer("duration").notNull(), // soniyalar
    level: smallint("level").notNull().default(1),

    // Mashqqa xos qo'shimcha ma'lumotlar (trials, RT, hit rate, ...)
    raw: jsonb("raw"),

    completedAt: timestamp("completed_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("training_patient_idx").on(t.patientId),
    index("training_exercise_idx").on(t.exerciseId),
    index("training_doctor_idx").on(t.doctorId),
  ],
);

// ──────────────────────────────────────────────────────────────
// Audit log — klinik audit talablari uchun
// (kim, qachon, qaysi bemor, qaysi action)
// ──────────────────────────────────────────────────────────────

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    actorUserId: text("actor_user_id").references(() => user.id, { onDelete: "set null" }),
    patientId: uuid("patient_id").references(() => patient.id, { onDelete: "set null" }),

    // "patient.create" | "patient.update" | "patient.archive"
    // "test.complete" | "training.complete" | "report.export"
    action: varchar("action", { length: 64 }).notNull(),

    // Action-ga xos kontekst (eski va yangi qiymatlar, hisobot turi, va h.k.)
    context: jsonb("context"),

    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("audit_actor_idx").on(t.actorUserId),
    index("audit_patient_idx").on(t.patientId),
    index("audit_created_idx").on(t.createdAt),
  ],
);

// ──────────────────────────────────────────────────────────────
// Type exports — Drizzle inferentsiya
// ──────────────────────────────────────────────────────────────

export type User = typeof user.$inferSelect;
export type Patient = typeof patient.$inferSelect;
export type NewPatient = typeof patient.$inferInsert;
export type TestResult = typeof testResult.$inferSelect;
export type NewTestResult = typeof testResult.$inferInsert;
export type TrainingSession = typeof trainingSession.$inferSelect;
export type NewTrainingSession = typeof trainingSession.$inferInsert;
export type AuditLog = typeof auditLog.$inferSelect;
export type DoctorProfile = typeof doctorProfile.$inferSelect;

// _meta — `primaryKey` helper'i ishlatish kerak bo'lsa
export const _meta = { primaryKey };
