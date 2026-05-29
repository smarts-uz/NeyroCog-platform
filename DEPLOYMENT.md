# NeyroCog — Production deployment

Next.js 15 (App Router) + Supabase Postgres + Drizzle + better-auth. Tavsiya
etilgan hosting: **Vercel** (frontend/SSR) + **Supabase** (DB/auth storage).

## 1. Supabase (ma'lumotlar bazasi)

1. Supabase loyihasini yarating (yoki mavjudini ishlating — joriy: `wstyvthqcygkdnfvkhsy`).
2. Ulanish satrlarini oling: **Project Settings → Database → Connection string**.
   - `DATABASE_URL` — pooler (6543) yoki direct (5432). App `prepare:false` bilan ishlaydi.
   - `DATABASE_URL_DIRECT` — direct (5432), migratsiyalar uchun.
3. Sxemani qo'llang:
   ```bash
   npm run db:push          # drizzle-kit push — schema.ts → DB
   ```
4. Drizzle boshqarmaydigan production hardeningni qo'llang (RLS, hardening):
   ```bash
   psql "$DATABASE_URL_DIRECT" -f scripts/db-hardening.sql
   ```
5. Birinchi shifokorni yarating:
   ```bash
   npm run seed             # doktor@klinika.uz — keyin parolini almashtiring!
   ```
6. (Ixtiyoriy) Haqiqiy kohort ma'lumotlarini import qiling:
   ```bash
   npm run import:dataset
   ```

## 2. Vercel (ilova)

1. Repozitoriyni Vercel'ga ulang. Framework: **Next.js** (avto-aniqlanadi).
2. **Environment Variables** (Production + Preview) — `.env.local.example`'dagi barchasi:

   | O'zgaruvchi | Izoh |
   |---|---|
   | `DATABASE_URL` | Supabase Postgres (pooler/direct) |
   | `DATABASE_URL_DIRECT` | Direct (migratsiyalar) |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase API URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon kalit |
   | `SUPABASE_SERVICE_ROLE_KEY` | Faqat server |
   | `BETTER_AUTH_SECRET` | `openssl rand -base64 32` (32+ belgi) |
   | `BETTER_AUTH_URL` | Real domen, masalan `https://neyrocog.uz` |
   | `AUTH_TRUSTED_ORIGINS` | (ixtiyoriy) qo'shimcha originlar, vergul bilan |

3. Build: `next build` (default). Node 20+.
4. Domen ulagach `BETTER_AUTH_URL`'ni shu domenga o'rnating va qayta deploy qiling.

## 3. Deploydan keyingi tekshiruv

- `GET /api/health` → `{"status":"ok","db":"up"}` (uptime monitoring shu yerga).
- `/uz/login` ochiladi, seed shifokor bilan kirish ishlaydi.
- Supabase **Advisors** (Security + Performance) — 0 ta critical/warn bo'lsin
  (RLS yoqilgan, FK indekslar mavjud — `scripts/db-hardening.sql` + `db:push`).
- Mobil qurilmada `/uz/bemorlar` — gorizontal scroll yo'q, PWA o'rnatish mumkin.

## 4. Xavfsizlik holati

- **RLS** better-auth jadvallarida yoqilgan; app `postgres` owner roli orqali
  ishlaydi (RLS'ni chetlab o'tadi). Anon kalit ma'lumotlarga kira olmaydi.
- **Security headers** (`next.config.ts`): HSTS, X-Frame-Options, nosniff,
  Referrer-Policy, Permissions-Policy, CSP frame-ancestors.
- **Env validation** (`src/lib/env.ts`): noto'g'ri/yetishmayotgan konfiguratsiyada
  ishga tushishda to'xtaydi (fail-fast).
- Seed shifokor parolini **albatta** almashtiring (default zaif).

## 5. Hali ochiq (ixtiyoriy keyingi qadamlar)

- **TOTP 2FA** — `better-auth` `twoFactor()` plugini (auth/server.ts'da TODO).
- **Parol tiklash** — Resend + `RESEND_API_KEY`.
- **Observability** — `error.tsx` / `global-error.tsx`'dagi `console.error`'ni
  Sentry kabi loggerga ulash.
