-- ============================================================
-- PTX Summer Cup 2026 — Initial schema (M01)
-- Target architecture per docs/migration/r25-source-to-target-map.md
-- and docs/migration/r25-data-reconciliation-plan.md.
--
-- Key departures from the legacy runtime model (all deliberate,
-- see r25-parity-matrix.md):
--   - No stored goals/assists/mvp/score counters: these are derived
--     from match_events via views, never independently edited
--     (Architecture v1.3 §6 Standings source-of-truth rule, extended
--     to player/tournament stats per reconciliation plan §3).
--   - hall_of_fame stores nullable FKs, not placeholder text.
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- profiles — mirrors auth.users, adds role for RBAC (M02)
-- ------------------------------------------------------------
create table public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    username text unique,
    display_name text,
    role text not null default 'viewer' check (role in ('admin', 'viewer')),
    created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- teams — legacy_id 'p'/'t'/'x' kept as the primary key (small,
-- stable, human-readable set; see r25-data-inventory.md §1.1)
-- ------------------------------------------------------------
create table public.teams (
    id text primary key,
    name text not null,
    full_name text not null,
    icon text,
    color text not null,
    captain_name text,
    stats jsonb not null default '{"attack":80,"defense":80,"speed":80,"power":80}',
    ovr integer not null default 80,
    logo_path text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- players
-- ------------------------------------------------------------
create table public.players (
    id uuid primary key default gen_random_uuid(),
    legacy_id integer unique,
    name text not null,
    team_id text not null references public.teams (id) on delete cascade,
    position text not null check (position in ('FW', 'MF', 'DF', 'GK')),
    avatar_path text,
    rating integer not null default 70,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index players_team_id_idx on public.players (team_id);

-- ------------------------------------------------------------
-- matches — home_score/away_score are NOT stored; derive from
-- match_events (see v_match_scores view in the next migration).
-- ------------------------------------------------------------
create table public.matches (
    id uuid primary key default gen_random_uuid(),
    legacy_id integer unique,
    home_team_id text not null references public.teams (id),
    away_team_id text not null references public.teams (id),
    match_date date not null,
    start_time time not null,
    end_time time not null,
    status text not null default 'scheduled' check (status in ('scheduled', 'live', 'finished', 'postponed')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint matches_distinct_teams check (home_team_id <> away_team_id)
);

create index matches_status_idx on public.matches (status);

-- ------------------------------------------------------------
-- match_events — the structured replacement for R25's pipe-string
-- result encoding (r25-data-inventory.md §1.4).
-- ------------------------------------------------------------
create table public.match_events (
    id uuid primary key default gen_random_uuid(),
    match_id uuid not null references public.matches (id) on delete cascade,
    team_id text not null references public.teams (id),
    player_id uuid references public.players (id),
    event_type text not null check (event_type in ('goal', 'own_goal', 'assist', 'yellow_card', 'red_card')),
    minute integer not null check (minute >= 0 and minute <= 120),
    metadata jsonb,
    created_by uuid references public.profiles (id),
    created_at timestamptz not null default now()
);

create index match_events_match_id_idx on public.match_events (match_id);
create index match_events_player_id_idx on public.match_events (player_id);

-- ------------------------------------------------------------
-- hall_of_fame — nullable FKs for undetermined positions
-- (r25-data-inventory.md §1.6 — legacy used placeholder text,
-- target uses NULL + UI-level "TBD" rendering instead).
-- ------------------------------------------------------------
create table public.hall_of_fame (
    id uuid primary key default gen_random_uuid(),
    year integer not null unique,
    champion_team_id text references public.teams (id),
    runner_up_team_id text references public.teams (id),
    third_place_team_id text references public.teams (id),
    golden_boot_player_id uuid references public.players (id),
    mvp_player_id uuid references public.players (id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- gallery_media
-- ------------------------------------------------------------
create table public.gallery_media (
    id uuid primary key default gen_random_uuid(),
    year integer not null,
    category text not null check (category in ('opening', 'matchday', 'awards', 'fan', 'operations', 'branding')),
    storage_path text not null,
    caption text,
    uploaded_by uuid references public.profiles (id),
    likes integer not null default 0,
    created_at timestamptz not null default now()
);

create index gallery_media_year_idx on public.gallery_media (year);

-- ------------------------------------------------------------
-- predictions — anonymous, ticket-code based (preserves the
-- legacy "no login required" UX per r25-parity-matrix.md §1).
-- ------------------------------------------------------------
create table public.predictions (
    id uuid primary key default gen_random_uuid(),
    display_name text not null,
    ticket_code text not null unique,
    picks jsonb not null,
    mvp_player_id uuid references public.players (id),
    golden_boot_player_id uuid references public.players (id),
    points integer,
    submitted_by uuid references public.profiles (id),
    created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- tournament_settings — single-row config table
-- (replaces ptx_slogan/ptx_msg/ptx_date/ptx_location).
-- ------------------------------------------------------------
create table public.tournament_settings (
    id boolean primary key default true constraint tournament_settings_singleton check (id = true),
    slogan text,
    message text,
    event_date text,
    location text,
    updated_at timestamptz not null default now()
);

insert into public.tournament_settings (id) values (true);
