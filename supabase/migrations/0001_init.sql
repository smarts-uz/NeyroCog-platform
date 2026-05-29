-- ─────────────────────────────────────────────────────────────
-- 0001_init.sql — Pediatrik KTT initial schema + RLS
--
-- BU FAYLDAN FOYDALANISH:
--   `npm run db:push`   — Drizzle schema'ni avtomatik yaratadi
--                          (better-auth + domain jadvallari)
--   keyin pastdagi RLS qatorlari Supabase SQL editor'da
--   alohida ishga tushiriladi (yoki `supabase db push` orqali).
--
-- Drizzle schema'da tutilmagan tartib:
--   1. extension'lar yoqilishi
--   2. RLS policies
--   3. updated_at trigger
-- ─────────────────────────────────────────────────────────────

-- ── extensions ────────────────────────────────────────────────
create extension if not exists "pgcrypto";       -- gen_random_uuid()
create extension if not exists "pg_stat_statements";

-- ── updated_at trigger funksiyasi ─────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger'ni har bir jadvalga ulang (jadvalini Drizzle yaratgandan keyin)
do $$
declare
  t text;
begin
  for t in
    select table_name
    from information_schema.columns
    where table_schema = 'public'
      and column_name = 'updated_at'
      and table_name in (
        'user', 'session', 'account', 'verification',
        'doctor_profile', 'patient', 'test_result',
        'training_session'
      )
  loop
    execute format(
      'drop trigger if exists set_updated_at on %I; ' ||
      'create trigger set_updated_at before update on %I ' ||
      'for each row execute function public.set_updated_at();',
      t, t
    );
  end loop;
end $$;

-- ── RLS — Row Level Security ─────────────────────────────────
-- Foydalanuvchi faqat o'zining bemorlarini ko'radi va o'zgartiradi.
-- Admin rolidagi shifokorlar barcha bemorlarni ko'radi.
--
-- Esda tuting: better-auth Supabase Auth ishlatmaydi — JWT'ni
-- bizning serverimiz yaratadi. Shu sabab `auth.uid()` Supabase'dan
-- ishlamaydi. Buning o'rniga server-side queries `db` orqali
-- bo'ladi va RLS hozir IXTIYORIY himoya qatlami sifatida qoladi.
-- (Service role barcha qatorni boshqaradi.)

alter table public.patient enable row level security;
alter table public.test_result enable row level security;
alter table public.training_session enable row level security;
alter table public.audit_log enable row level security;
alter table public.doctor_profile enable row level security;

-- Service role uchun to'liq ruxsat (Drizzle queries shu rol bilan ishlaydi)
create policy "service_role_all_patient"
  on public.patient for all
  to service_role
  using (true)
  with check (true);

create policy "service_role_all_test_result"
  on public.test_result for all
  to service_role
  using (true)
  with check (true);

create policy "service_role_all_training_session"
  on public.training_session for all
  to service_role
  using (true)
  with check (true);

create policy "service_role_all_audit_log"
  on public.audit_log for all
  to service_role
  using (true)
  with check (true);

create policy "service_role_all_doctor_profile"
  on public.doctor_profile for all
  to service_role
  using (true)
  with check (true);

-- ── Premorbid binary constraint ──────────────────────────────
-- CLAUDE.md qoidasi: premorbid faqat 0 yoki 1 bo'lishi mumkin
alter table public.patient
  add constraint patient_premorbid_binary
  check (premorbid in (0, 1));

-- ── Davom musbat bo'lishi shart ──────────────────────────────
alter table public.patient
  add constraint patient_davom_positive
  check (davom > 0);

-- ── Jinsi enum-like check ────────────────────────────────────
alter table public.patient
  add constraint patient_jinsi_valid
  check (jinsi in ('Erkak', 'Ayol'));

-- ── Test enum-like check ─────────────────────────────────────
alter table public.test_result
  add constraint test_result_test_valid
  check (test in ('Stroop', 'TMT', 'DST', 'LMWT', 'NS', 'EEG', 'Audio'));

alter table public.test_result
  add constraint test_result_timepoint_valid
  check (timepoint in ('PreOp', 'PostOp', 'PostTx'));

-- ── Exercise enum-like check ─────────────────────────────────
alter table public.training_session
  add constraint training_exercise_valid
  check (exercise_id in (
    'VisualSearch', 'NBack', 'TaskSwitch', 'ReactionTime', 'Tracking'
  ));
