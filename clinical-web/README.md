# clinical-web

Next.js 15 + TypeScript strict + Tailwind v4 + Supabase + better-auth + next-intl.

**Holat:** scaffold + birinchi 2 ta sahifa (Login + Bemorlar ro'yxati).

## Stack

- **Next.js 15** (App Router, Turbopack dev, Server Actions)
- **TypeScript strict** + `noUncheckedIndexedAccess`
- **Tailwind CSS v4** (`@theme inline` orqali tokenlar)
- **shadcn/ui** (Radix UI primitivlari, source code'da)
- **Drizzle ORM** + **Supabase Postgres**
- **better-auth** (email/parol; keyinroq TOTP)
- **next-intl** (uz / ru / en — har biri URL prefix bilan)
- **TanStack Query** + **React Hook Form** + **Zod**
- **Recharts** + **date-fns** + **Lucide React**
- **Vitest** (statistik engine testlari)
- **Biome** (lint + format)

## Birinchi marta ishga tushirish

```bash
# 1. Dependencies
npm install

# 2. .env.local — Supabase keys + better-auth secret
cp .env.local.example .env.local
# DATABASE_URL, BETTER_AUTH_SECRET ni to'ldiring
# `openssl rand -base64 32` orqali secret yarating

# 3. Schema yaratish (Supabase Postgres'ga)
npm run db:push

# 4. RLS + triggerlar + constraint'larni qo'shing
# supabase/migrations/0001_init.sql ni Supabase SQL Editor'da ishga tushiring

# 5. Dev server
npm run dev
# → http://localhost:3000/uz/login
```

## Komandalar

| Komanda | Tavsif |
|---------|--------|
| `npm run dev` | Turbopack dev server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | Biome check |
| `npm run lint:fix` | Biome check + write |
| `npm run test` | Vitest run (engine testlari) |
| `npm run test:watch` | Vitest watch mode |
| `npm run db:generate` | Drizzle: schema → SQL migration |
| `npm run db:push` | Drizzle: schema'ni DB'ga push (dev) |
| `npm run db:migrate` | Drizzle: migrationlarni run qilish |
| `npm run db:studio` | Drizzle Studio (UI) |

## Loyiha tuzilishi

```
clinical-web/
├── messages/                  # i18n catalog'lari (uz/ru/en.json)
├── public/fonts/              # Outfit family
├── src/
│   ├── app/
│   │   ├── api/auth/[...all]/ # better-auth route handler
│   │   ├── [locale]/
│   │   │   ├── (auth)/login/  # login screen
│   │   │   └── (app)/         # autentifikatsiyalangan zona
│   │   │       └── bemorlar/  # bemorlar ro'yxati
│   │   ├── globals.css        # Tailwind v4 @theme tokenlar
│   │   └── fonts.ts           # next/font Outfit
│   ├── components/
│   │   ├── ui/                # shadcn primitivlari (Button, Card, …)
│   │   ├── locale-switcher.tsx
│   │   └── providers.tsx      # TanStack Query
│   ├── i18n/                  # next-intl routing + request
│   ├── lib/
│   │   ├── auth/              # better-auth server + client
│   │   ├── db/                # Drizzle schema + client
│   │   ├── engines/           # KNBT, prediction, stats (+ tests)
│   │   ├── patients/          # queries, actions, schema
│   │   └── utils.ts           # cn() helper
│   └── middleware.ts          # next-intl middleware
├── supabase/migrations/       # RLS + constraint SQL
└── drizzle.config.ts
```

## Hozircha tayyor

- ✅ Skaffold + barcha config'lar
- ✅ Drizzle schema (`user`, `session`, `account`, `verification`, `doctor_profile`, `patient`, `test_result`, `training_session`, `audit_log`)
- ✅ better-auth email/parol + Drizzle adapter
- ✅ next-intl — **hozir faqat `uz`** (ru/en tarjima fayllar tayyor, oxirida yoqiladi)
- ✅ Tailwind v4 + design tokenlar (prototip `app.css`'dan to'liq ko'chirilgan)
- ✅ Statistik enginelar (knbt.ts, prediction.ts, stats.ts) + Vitest (52 test)
- ✅ Login + Signup sahifalari (better-auth) + `npm run seed` (birinchi shifokor)
- ✅ Bemorlar ro'yxati (Drizzle + jadval + statistika + qidiruv + bashoratli xavf%)
- ✅ "Yangi bemor" modal (Server Action + Zod validation)
- ✅ Bemor kartochkasi (`PatientView`) — 3 ta tab + 7 test launcher grid
- ✅ 7 ta diagnostik test (Stroop, TMT, DST interaktiv; LMWT, NS, EEG, Audio + Audio interaktiv)
- ✅ KNBT Composite (ISPOCD) paneli — stored natijalardan hisoblanadi
- ✅ PNB Forecast tab — LR/MLR vizualizatsiyasi (hero, kontribution barlar, per-instrument, tavsiyalar)
- ✅ Reabilitatsiya: RehabHub + 5 mashq (VisualSearch, NBack, TaskSwitch, ReactionTime, Tracking)
- ✅ Tahlil markazi (`/tahlil`) — Dashboard, ROC (+confusion matrix +DeLong), Treatment, Reports (CSV)
- ✅ Test/training natijalari Server Action orqali Supabase'ga yoziladi + audit log
- ✅ **Mobile-first / to'liq adaptiv** (CLAUDE.md mandate): viewport meta, 360→768→1280px breakpoint'lar, 44px touch hit-target tugmalar, mobil'da to'liq ekran modallar, jadval→Card ro'yxat (bemorlar), test/mashq ekranlari `onPointerDown` touch + SVG board scaling

## Ko'chiriladi (keyingi PR'lar)

- ⏳ PDF eksport (@react-pdf/renderer) — hozir CSV bor, PDF uchun `window.print`
- ⏳ RU/EN lokalni yoqish (`routing.ts` → `locales: ["uz","ru","en"]`) + klinik revisiya
- ⏳ Bemorni tahrirlash / arxivlash UI
- ⏳ Bir nechta timepoint (PreOp/PostOp/PostTx) tanlovi test o'tkazishda
- ⏳ 2FA (TOTP) — better-auth plugin
- ⏳ localStorage (`ktt_state_v1`) → Supabase import skripti

## ru/en tilni yoqish

`src/i18n/routing.ts`'da `locales: ["uz"]` → `["uz", "ru", "en"]` qiling.
Tarjima fayllar (`messages/ru.json`, `messages/en.json`) AI-draft — yoqishdan
oldin klinik atamalarni shifokor tasdiqlashi shart.

## Eslatmalar

- **Premorbid har doim 0 yoki 1** (CLAUDE.md qoidasi). Schema'da `check` constraint qo'yilgan.
- **Statistik koeffitsientlarni hech qachon o'zgartirmang** — Excel manbalardan keladi (`Statistics M-2/M-3 sheets`). Vitest testlari guard sifatida.
- **`zustand`/`redux` ishlatilmaydi** — Server Components + TanStack Query yetadi.
- **RU/EN tarjimalar AI-draft** — production'ga chiqishdan oldin klinik revisiya kerak.
