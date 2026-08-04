-- ============================================================
-- M12.5: fixes a real, project-wide bug found via live verification
-- against an actual local Postgres instance (the first time this
-- schema was ever tested against a running database — see
-- docs/gates/m01-evidence.md, Docker limitation).
--
-- Every table/view in `public` had RLS policies correctly defined,
-- but NO base table-level GRANTs to anon/authenticated/service_role
-- — Postgres denies at the privilege-check layer before RLS is even
-- evaluated, so every single query (including from service_role,
-- which is meant to bypass RLS via BYPASSRLS, but still needs the
-- underlying privilege grant) failed with "permission denied".
--
-- This is standard, expected Supabase project bootstrapping (a
-- hosted project's dashboard applies exactly this automatically when
-- you create a table there; a CLI/migration-only workflow must do it
-- explicitly). Granting broad table privileges here does NOT weaken
-- security — RLS policies (already in place, unchanged) remain the
-- real per-row access control layer underneath. This migration only
-- restores the ability for RLS to be evaluated at all.
-- ============================================================

grant usage on schema public to anon, authenticated, service_role;

grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;

alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on routines to anon, authenticated, service_role;
