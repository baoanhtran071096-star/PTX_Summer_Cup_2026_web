# M13 Production One-Shot Deployment — BLOCKED

## Status: BLOCKED — no mutation performed

**Deployed commit (prepared, never applied):** `2871a11e8b5446538a19f05fe050818800c512d1`
**Attempted at:** this session, immediately following the Production One-Shot Directive
**Confirmed production ref:** `wmamuqylqqikvseuqerm` (name `ptx-summer-cup-2026`, org `dpgiiwquogbgskyjeetv`) — matches the locked decision in `docs/m13-production-deployment-plan.md` §0.1 exactly; identity guard passed; not the staging ref (`bugqhoktzzdvduzfjctm`) or the unrelated third project (`dbnsaqczauxcriibwubg`).

## What happened

Per `docs/m13-production-deployment-plan.md` and the directive's explicit instruction to "independently re-verify the production project identity and current database state" before any mutation, the following read-only checks were performed **before** touching anything:

1. `supabase projects list` — re-confirmed the production ref independently of prior-session memory. Matches.
2. `supabase link --project-ref wmamuqylqqikvseuqerm --yes` — linked; re-verified via `supabase/.temp/project-ref` against the allowlist-of-one and the blocklist. Passed.
3. `supabase migration list --linked` — **0 of 11 migrations have ever been applied via the Supabase CLI's migration tracking** to this project.
4. Fetched production API keys securely (written directly to gitignored `.env.production.local`, never printed to any visible output; raw key-dump file deleted immediately after).
5. **Read-only** REST checks against `public.teams`, `public.players`, `public.matches`, `public.profiles`, `public.audit_log`, `public.tournament_settings`, and `auth.v1.admin.users`.

## What was found — unexpected pre-existing data and schema drift

The confirmed production project **already contains a table named `teams`, `players`, and `matches` — but with a completely different schema and dataset than this application's**, created outside any migration in this repository:

| Table | Row count | Evidence it does not belong to this application |
|---|---|---|
| `public.teams` | 8 | Rows named "Đội Gamma", "Đội Delta", "Đội Epsilon" (Greek-letter placeholder names — this app's teams are "TEAM P/T/X", Phoenix/Tiger/Xiphias). Schema has `short_name`/`logo_url` columns; this app's schema has `full_name`/`logo_path`/`stats` jsonb/`ovr`/`captain_name` — none present here. Primary keys are UUIDs; this app's `teams.id` is `text` (`'p'`/`'t'`/`'x'`). |
| `public.players` | 13 | Example row: `"Nguyễn Văn B (Cáp)"`, team `"Đội Alpha"` — a fourth/different team name never seen anywhere in this project's data. Schema has `jersey_num`/`profile`/`goals`/`assists`/`yellow_cards`/`red_cards` stored directly on the row; this app's schema stores none of these (goals/assists are derived from `match_events`, not columns on `players`). |
| `public.matches` | 8 | Example row: `matchday: 1`, `home_goals: 3`, `away_goals: 1`, `status: "finished"`, dated `2026-08-05` — a match dated *after* the current session date (2026-08-04) already marked "finished," which is internally inconsistent and strongly suggests placeholder/scaffold data, not a real completed match. This app never stores `home_goals`/`away_goals` directly (derived from `match_events` via `v_match_scores`). |
| `public.profiles`, `public.audit_log`, `public.tournament_settings` | — | Do not exist (`404 PGRST205`) — confirms this is not a partially-applied version of this app's schema; it is a **different schema entirely**, coexisting with 3 unrelated tables that happen to share generic names. |
| `auth.users` | 0 | No real user accounts exist. |

**This directly matches the directive's explicit stop condition:** *"If unexpected production data or schema drift is detected, STOP rather than destroying or silently transforming unknown data."*

Applying this application's `20260804000001_initial_schema.sql` (`create table public.teams (...)` with no `IF NOT EXISTS`) against this project would either **fail outright** (table already exists, different schema) or, if any future migration were ever written more permissively, could **silently corrupt or collide with real unrelated data**. Neither outcome is acceptable, and per the directive this decision is not this agent's to make.

## What was NOT done

- **No migration was applied.** No `db push` was run.
- **No backup was taken**, because backups are meaningless to record as "pre-deployment" evidence for a deployment that must not proceed — taking one now would not resolve the identity question.
- **No seed data was written.**
- **No Storage buckets were created, no assets uploaded.**
- **No Auth/RBAC changes.** No signup, no promotion.
- **No Realtime test.**
- **Nothing was deleted, altered, or transformed.** Every check performed against production in this session was a read-only `SELECT`/`GET`.

## Immediate cleanup performed

- `.env.production.local` (containing real production keys) remains on disk, gitignored, not committed, not printed — kept only because further investigation may require it; will be deleted once the identity/data question below is resolved one way or the other.
- No other artifact was created or modified on the production project.

## Required resolution before this plan may proceed

This is a genuine open question only the product owner can answer — this agent will not guess:

1. **Is `wmamuqylqqikvseuqerm` actually the correct production target for this application?** The existing data (generic Greek-letter team names, a schema that looks like a quick AI/no-code scaffold, zero real users) is inconsistent with "PTX Summer Cup 2026" being deployed here before — it looks like an unrelated prototype or leftover scaffold that happens to live in the same Supabase organization under a similarly-named project.
2. **If yes, this is intentional and safe to overwrite:** an explicit instruction to drop/ignore the existing `teams`/`players`/`matches` tables (naming them explicitly, confirming they are disposable scaffold data with no real value) is required before this agent will touch them. This is not implied by the original Production One-Shot Directive, which assumed an empty project.
3. **If no, a different ref is the real production target:** provide the correct ref and this plan will re-run its full identity/state verification against it before proceeding.

## Terminal state

**PRODUCTION DEPLOYMENT — BLOCKED/FAILED**

No production mutation occurred. No rollback is needed (nothing was changed). Awaiting explicit resolution of the identity/data-ownership question above before this directive can be re-attempted.
