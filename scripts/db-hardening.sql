-- Production DB hardening — NOT managed by drizzle-kit (RLS, constraint drops,
-- function search_path are outside the Drizzle schema). Re-apply these after a
-- fresh `drizzle-kit push` to bring a new database in line with production.
--
-- Applied to production (project wstyvthqcygkdnfvkhsy) on 2026-05-30 via the
-- Supabase migration API.

-- 1) Drop the stale exercise_id CHECK. It only allowed the old 5 PascalCase
--    ids (VisualSearch/NBack/TaskSwitch/ReactionTime/Tracking), which never
--    matched the app's camelCase ids and blocked the 50-exercise rehab module.
--    exercise_id is validated at the app layer (meta.ts ExerciseId union).
ALTER TABLE public.training_session DROP CONSTRAINT IF EXISTS training_exercise_valid;

-- 2) Enable RLS on the better-auth tables. They hold password hashes (account),
--    emails (user) and session tokens (session) and were reachable via the
--    public anon key. The app accesses them only through the privileged
--    `postgres` owner role (Drizzle / postgres-js), which bypasses non-forced
--    RLS, so enabling RLS with no policies blocks anon/authenticated while the
--    app keeps working. Add policies only if you ever expose these via the
--    Supabase anon/authenticated client (the app does not).
ALTER TABLE public.account      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."user"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification ENABLE ROW LEVEL SECURITY;

-- 3) Pin the updated_at trigger function's search_path (Supabase linter 0011).
--    The body only calls now() (pg_catalog), so an empty search_path is safe.
ALTER FUNCTION public.set_updated_at() SET search_path = '';
