-- ============================================================
-- M12.5: fixes a real, critical bug found via live verification —
-- creating a Supabase Auth user (via /auth/v1/admin/users) produced
-- NO corresponding public.profiles row, since no trigger existed to
-- create one. getCurrentProfile() (services/auth/session.ts) would
-- therefore return null for every real user, forever, including any
-- legitimately created admin — the entire M02 Auth+RBAC flow was
-- unusable end-to-end until this trigger existed. This is the
-- standard Supabase "new user -> profile row" pattern, omitted in M01.
--
-- New profiles default to role='viewer' — never auto-admin. The very
-- first admin must still be promoted via a direct, service-role SQL
-- statement during initial provisioning (a one-time manual
-- bootstrap step, documented in docs/migration/r25-auth-transition-plan.md
-- and docs/gates/m12.5-evidence.md) — this is standard, expected RBAC
-- bootstrapping (nobody can grant the first admin role from inside
-- the app, since no one has admin yet to do the granting).
-- ============================================================

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, username, role)
    values (new.id, new.email, 'viewer');
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
