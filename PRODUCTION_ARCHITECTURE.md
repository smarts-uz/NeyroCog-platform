# KTT v2 — Production architecture (Next.js 15 stack)

> Sizning prototip ilovangizning **production-grade qayta yozilishi** uchun blueprint.
> Stack: Next.js 15 + TypeScript strict + Tailwind v4 + shadcn/ui + Drizzle + Supabase + better-auth + next-intl + TanStack Query + RHF + Zod + Recharts + Vitest + Biome.

## 🚨 MAJBURIY: Mobile-first / To'liq adaptiv

**Web app to'liq mobile adaptive bo'lishi shart** (Research Plan asosida):

- **Breakpoints:** mobil 360px → planshet 768px → desktop 1280px+
- **Tailwind responsive:** `sm:`, `md:`, `lg:`, `xl:` har komponentda
- **Touch events:** test ekranlari `onPointerDown` (mouse + touch unified)
- **Hit target:** tugmalar min `h-11` (44×44px)
- **Modallar:** mobil'da to'liq ekran (`size="full"` shadcn'da), desktop'da Dialog
- **Tables:** mobil'da → Card list, desktop'da → DataTable
- **Sticky chrome:** header sticky, tab bar mobil'da pastda (bottom nav style)
- **Recharts:** ResponsiveContainer + `aspect` orqali mobil'ga moslashishi shart
- **Test ekranlari:** SVG board scaling (TMT, Stroop) — mobil'da to'liq ekran
- **Audio test:** mobil ovozni boshqarish + pop-up "Quloqchin tutkazing"

## Stack tanlovi sabablari

---

## 1. Loyihani boshlash

```bash
pnpm create next-app@latest ktt-app --typescript --tailwind --app --src-dir --import-alias "@/*"
cd ktt-app

# Tailwind v4
pnpm add tailwindcss@next @tailwindcss/postcss@next
# shadcn/ui
pnpm dlx shadcn@latest init -d
# State / data
pnpm add @tanstack/react-query drizzle-orm postgres
pnpm add @supabase/supabase-js @supabase/ssr
# Auth
pnpm add better-auth
# i18n
pnpm add next-intl
# Forms / validation
pnpm add react-hook-form @hookform/resolvers zod
# Charts + dates
pnpm add recharts date-fns
# Icons
pnpm add lucide-react
# Dev
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
pnpm add -D @biomejs/biome drizzle-kit
```

---

## 2. Papka strukturasi

```
ktt-app/
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── (auth)/login/page.tsx
│   │   │   ├── (clinical)/
│   │   │   │   ├── layout.tsx                  ← shell
│   │   │   │   ├── patients/
│   │   │   │   │   ├── page.tsx                ← jadval
│   │   │   │   │   ├── new/page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx            ← bemor kartochkasi
│   │   │   │   │       ├── tests/[test]/page.tsx
│   │   │   │   │       ├── training/[ex]/page.tsx
│   │   │   │   │       └── report/page.tsx
│   │   │   │   ├── analytics/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── roc/page.tsx
│   │   │   │   │   ├── treatment/page.tsx
│   │   │   │   │   └── reports/page.tsx
│   │   │   │   └── settings/page.tsx
│   │   │   └── layout.tsx                      ← NextIntlClientProvider
│   │   ├── api/
│   │   │   ├── auth/[...all]/route.ts          ← better-auth
│   │   │   └── export/csv/route.ts
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                                 ← shadcn primitives
│   │   ├── shell/                              ← AppHeader, UserMenu, LocaleSwitcher
│   │   ├── patient/                            ← PatientCard, PatientForm
│   │   ├── tests/                              ← StroopTest, TMTBoard, NSForm
│   │   ├── training/                           ← VisualSearch, NBack, Tracking
│   │   ├── analytics/                          ← KPI, ROCChart, ConfusionMatrix
│   │   └── forecast/                           ← PNBForecastCard
│   ├── db/
│   │   ├── schema.ts                           ← Drizzle tables
│   │   ├── client.ts                           ← drizzle client
│   │   └── migrations/
│   ├── lib/
│   │   ├── knbt/{scoring,norms,types}.ts
│   │   ├── prediction/{lr,mlr,coefficients}.ts
│   │   ├── stats/{core,roc,recovery}.ts
│   │   ├── supabase/{server,client}.ts
│   │   ├── auth.ts                             ← better-auth config
│   │   ├── i18n.ts
│   │   └── utils.ts                            ← cn()
│   ├── messages/{uz,ru,en}.json                ← uz default
│   ├── server/                                 ← Server actions
│   │   ├── patients.ts
│   │   ├── results.ts
│   │   ├── training.ts
│   │   └── analytics.ts
│   └── hooks/                                  ← TanStack Query wrappers
├── drizzle.config.ts
├── biome.json
├── vitest.config.ts
├── tailwind.config.ts
├── middleware.ts                               ← next-intl + auth
└── CLAUDE.md
```

---

## 3. Database schema (`src/db/schema.ts`)

```ts
import { pgTable, uuid, text, integer, smallint, timestamp, jsonb, boolean, real } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role", { enum: ["doctor", "researcher", "admin"] }).default("doctor"),
  totpEnabled: boolean("totp_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const patients = pgTable("patients", {
  id: uuid("id").primaryKey().defaultRandom(),
  fish: text("fish").notNull(),
  jinsi: text("jinsi", { enum: ["Erkak", "Ayol"] }).notNull(),
  tugilgan: text("tugilgan").notNull(),
  yosh: integer("yosh").notNull(),
  premorbid: smallint("premorbid").notNull().default(0),  // 0 | 1
  davom: integer("davom").notNull(),
  prep: smallint("prep").notNull(),
  boshlanish: timestamp("boshlanish", { mode: "string" }),
  tugash: timestamp("tugash", { mode: "string" }),
  sana: text("sana").notNull(),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const testResults = pgTable("test_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id").references(() => patients.id, { onDelete: "cascade" }),
  testCode: text("test_code", { enum: ["Stroop", "TMT", "DST", "LMWT", "NS", "EEG", "Audio"] }).notNull(),
  timepoint: text("timepoint", { enum: ["PreOp", "PostOp", "PostTx"] }).default("PreOp"),
  raw: jsonb("raw").notNull(),
  cogScore: real("cog_score"),
  zScore: real("z_score"),
  ispcd: boolean("ispcd"),
  completedAt: timestamp("completed_at").defaultNow(),
});

export const trainingSessions = pgTable("training_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id").references(() => patients.id, { onDelete: "cascade" }),
  exerciseId: text("exercise_id", {
    enum: ["visualSearch", "nback", "taskSwitch", "reactionTime", "tracking"],
  }).notNull(),
  score: integer("score").notNull(),
  accuracy: real("accuracy").notNull(),
  duration: integer("duration").notNull(),
  level: integer("level"),
  meta: jsonb("meta"),
  completedAt: timestamp("completed_at").defaultNow(),
});
```

---

## 4. Zod schemas + Server actions

`src/lib/knbt/types.ts`:
```ts
import { z } from "zod";

export const PatientSchema = z.object({
  fish: z.string().min(3),
  jinsi: z.enum(["Erkak", "Ayol"]),
  tugilgan: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  premorbid: z.number().int().min(0).max(1),
  davom: z.number().int().positive(),
  prep: z.number().int().min(0),
  boshlanish: z.string().optional(),
  tugash: z.string().optional(),
});
export type Patient = z.infer<typeof PatientSchema>;
```

`src/server/patients.ts`:
```ts
"use server";
import { db } from "@/db/client";
import { patients } from "@/db/schema";
import { PatientSchema } from "@/lib/knbt/types";
import { revalidatePath } from "next/cache";

export async function createPatient(input: unknown) {
  const data = PatientSchema.parse(input);
  const yosh = calculateAge(data.tugilgan);
  await db.insert(patients).values({
    ...data, yosh, sana: new Date().toISOString().slice(0, 10),
  });
  revalidatePath("/patients");
}
```

---

## 5. Design tokens — Tailwind v4 (`globals.css`)

```css
@import "tailwindcss";

@theme {
  --color-primary: #0F766E;
  --color-primary-hover: #115E59;
  --color-ink: #0F172A;
  --color-bg: #F1F5F9;
  --font-sans: "Outfit", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", monospace;
  --radius-md: 0.625rem;
}

:root {
  --primary: 175 76% 26%;
  --primary-foreground: 0 0% 100%;
}
```

shadcn'da **New York preset** + **Slate base** tanlang, teal accent qo'shing.

---

## 6. Auth (better-auth)

```ts
// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/client";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: { enabled: true },
  // TOTP qo'shilganda: plugins: [twoFactor()]
});
```

---

## 7. Middleware (i18n + protected routes)

```ts
// middleware.ts
import createMiddleware from "next-intl/middleware";

export default createMiddleware({
  locales: ["uz", "ru", "en"],
  defaultLocale: "uz",
});

export const config = { matcher: ["/((?!api|_next|.*\\..*).*)"] };
```

---

## 8. Vitest sinovlari

Eng birinchi — **statistik formulalar testlari**:

```ts
// src/lib/knbt/scoring.test.ts
import { computeCogScore } from "./scoring";
import { expect, test } from "vitest";

test("Stroop — to'liq aniq trial → score > 80", () => {
  const r = computeCogScore("Stroop",
    { correct: 40, errors: 0, skipped: 0, totalTimeSec: 60, totalTrials: 40 },
    { yosh: 10 });
  expect(r).toBeGreaterThan(80);
});

test("PNB Logistic Regression — yuqori xavf profili", () => {
  // dur=150, drugs=6, age=8, prem=1 → > 70%
});
```

---

## 9. Migratsiya rejasi (prototipdan → production)

| Bosqich | Vaqt | Mazmuni |
|---------|------|---------|
| 1. Skeleton | 2-3 kun | Next.js + Drizzle + Supabase + better-auth + shell |
| 2. Bemor moduli | 2-3 kun | PatientForm, PatientsTable, PatientCard + server actions |
| 3. Testlar | 1 hafta | 7 ta test komponenti + scoring engine + Vitest |
| 4. Bashorat | 2 kun | LR + MLR + PNBForecast server component |
| 5. Reabilitatsiya | 3-4 kun | 5 ta mashq + Web Audio hooks |
| 6. Tahlil | 3-4 kun | Recharts ROC + Treatment + CSV/PDF eksport |
| 7. Polish + Deploy | 2 kun | RU/EN, Vitest coverage, Biome, Vercel + Supabase prod, TOTP |

**Jami:** ~3-4 hafta full-time.

---

## 10. Prototip vs Production farqlari

| Prototip | Production |
|----------|------------|
| Inline JSX + Babel | TypeScript strict compiled |
| `window.X = X` | ES imports |
| `localStorage` | PostgreSQL (Supabase) |
| Hech qanday auth | better-auth + Supabase RLS |
| Faqat uz | uz/ru/en (next-intl) |
| Inline styles | Tailwind v4 + shadcn tokens |
| SVG charts hand-rolled | Recharts |
| `window.print()` PDF | Vercel edge PDF generator |
| 0 test | Vitest formulalar coverage |
| Inline scriptlar | Server components + RSC |

---

## 11. Tavsiyam

1. **Hozir bu yerda prototipni davom etib tugating** — klinik feedback olish kerak
2. Excel formulalari va biznes logikasi to'g'rilangach — **PRODUCTION_ARCHITECTURE.md + README.md + CLAUDE.md** ni Claude Code'ga bering
3. Yuqoridagi 7 bosqich bo'yicha **3-4 hafta** ichida production'ga olib chiqing
4. Yo'lda yangi feature kerak bo'lsa — har bosqichdan keyin foydalanuvchilar bilan demo qiling

Statistik enginelarning hammasini bu yerdan (`prediction.js`, `stats.js`, `knbt.js`) to'g'ridan-to'g'ri TypeScript'ga ko'chirib olsangiz bo'ladi — formula va koeffitsientlar bir xil.
