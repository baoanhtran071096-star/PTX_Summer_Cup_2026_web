-- ============================================================
-- Row Level Security (M02 Auth+RBAC groundwork, enforced from M01
-- onward per docs/architecture §9 — service role is not the default
-- admin path; every admin write is gated by profiles.role='admin').
-- ============================================================

-- security definer so policies can check role without recursing into
-- profiles' own RLS (standard Supabase pattern).
create function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
    select exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'admin'
    );
$$;

alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.match_events enable row level security;
alter table public.hall_of_fame enable row level security;
alter table public.gallery_media enable row level security;
alter table public.predictions enable row level security;
alter table public.tournament_settings enable row level security;

-- ------------------------------------------------------------
-- profiles — self read/update; admin reads all.
-- ------------------------------------------------------------
create policy "profiles: self can read own" on public.profiles
    for select using (id = auth.uid() or public.is_admin());

create policy "profiles: self can update own" on public.profiles
    for update using (id = auth.uid()) with check (id = auth.uid());

-- ------------------------------------------------------------
-- Public tournament content — public read, admin write.
-- ------------------------------------------------------------
create policy "teams: public read" on public.teams for select using (true);
create policy "teams: admin write" on public.teams for all using (public.is_admin()) with check (public.is_admin());

create policy "players: public read" on public.players for select using (true);
create policy "players: admin write" on public.players for all using (public.is_admin()) with check (public.is_admin());

create policy "matches: public read" on public.matches for select using (true);
create policy "matches: admin write" on public.matches for all using (public.is_admin()) with check (public.is_admin());

create policy "match_events: public read" on public.match_events for select using (true);
create policy "match_events: admin write" on public.match_events for all using (public.is_admin()) with check (public.is_admin());

create policy "hall_of_fame: public read" on public.hall_of_fame for select using (true);
create policy "hall_of_fame: admin write" on public.hall_of_fame for all using (public.is_admin()) with check (public.is_admin());

create policy "gallery_media: public read" on public.gallery_media for select using (true);
create policy "gallery_media: admin write" on public.gallery_media for all using (public.is_admin()) with check (public.is_admin());

create policy "tournament_settings: public read" on public.tournament_settings for select using (true);
create policy "tournament_settings: admin write" on public.tournament_settings for update using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------
-- predictions — anonymous submission preserved (r25-parity-matrix.md
-- §1): anyone can submit and read (leaderboard), nobody can edit/delete
-- another visitor's entry; admins can moderate.
-- ------------------------------------------------------------
create policy "predictions: public read" on public.predictions for select using (true);
create policy "predictions: public insert" on public.predictions for insert with check (true);
create policy "predictions: admin update/delete" on public.predictions for update using (public.is_admin()) with check (public.is_admin());
create policy "predictions: admin delete" on public.predictions for delete using (public.is_admin());
