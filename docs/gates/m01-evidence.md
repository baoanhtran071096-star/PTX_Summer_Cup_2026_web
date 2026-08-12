# M01 — Database Foundation + R25 Migration — Gate Evidence

## Status: PASS (with one documented environment limitation, tracked below)

## Implementation

- `supabase/migrations/20260804000001_initial_schema.sql` — `profiles`, `teams`, `players`, `matches`, `match_events`, `hall_of_fame`, `gallery_media`, `predictions`, `tournament_settings`. Deliberately does **not** store `goals`/`assists`/`mvp`/match-score counters — those are derived, per `docs/migration/r25-data-reconciliation-plan.md` §3.
- `supabase/migrations/20260804000002_derived_views.sql` — `v_match_scores`, `v_player_stats`: pure aggregations over `match_events`, always in sync by construction (a view, not an independently-maintained counter).
- `supabase/migrations/20260804000003_rls_policies.sql` — RLS enabled on every table; `public.is_admin()` security-definer helper; public read / admin write on tournament content; anonymous insert + public read on `predictions` (preserves the legacy no-login UX per the parity matrix); self read/update on `profiles`.
- `supabase/seed.sql` — generated (not hand-typed) by `scripts/generate-seed-sql.js` from `docs/migration/r25-extracted.json`: 3 teams, 24 players, 3 matches, tournament settings, 1 Hall of Fame year (team labels resolved to `teams.id` automatically; unresolved player-name awards left as commented TODOs pending M04/M11). `logo_path`/`avatar_path` intentionally seeded `NULL` — populated for real in M09 once Storage upload runs.
- `src/services/database/{types,teams.db,players.db,matches.db}.ts` — thin, typed, business-rule-free data access (Rule 6). Standings computation itself is deliberately NOT built here — that's domain logic scoped to M06.

## Verification

| Check | Result |
|---|---|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run verify:architecture` | PASS (0 domain files yet — guard is live for M03+) |
| `npm run verify:design-tokens` | PASS |
| `npm run build` | PASS |
| Manual SQL review (schema, FK ordering, RLS policy logic) | Reviewed line-by-line — see below |
| **Live migration apply against local Postgres (`supabase db reset`)** | **BLOCKED at time of writing — see Environment Limitation.** Resolved in M12.5 once Docker became available: all 11 migrations (9 at that time + 2 added in M12.5) + seed apply cleanly and reproducibly; see `docs/gates/m12.5-evidence.md` §1/§3. |

## Environment limitation (per directive §19 — documented, not silently skipped)

- **Command attempted:** `npx supabase start` (after `npx supabase init`).
- **Actual error:** `LegacyDockerLifecycleInspectError — failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine`.
- **Diagnosis:** Docker CLI (`docker`, v29.6.2) is installed, but the Docker Desktop *daemon* was not running. Launched `Docker Desktop.exe` and polled `docker ps` for several minutes (multiple bounded checks, not an unbounded loop) — the daemon did not finish initializing within this session's working window.
- **Classification:** Environment, not code. The schema was instead verified by careful manual line-by-line review (table creation order satisfies every FK dependency; RLS policies checked for the `is_admin()` recursion trap and its `security definer` fix; column types cross-checked against every foreign key on both sides).
- **Remediation shipped:** Added a `database-migrations` job to `.github/workflows/ci.yml` using `supabase/setup-cli` on an `ubuntu-latest` runner (which has Docker preinstalled and working) — `supabase db reset --local` there will apply every migration + the seed for real and fail the build on any SQL error. This is the actual mandatory "Migration Safety" gate; it did not run in this session, but will run on the next push/PR.
- **Minimum external action if this needs local verification before then:** confirm Docker Desktop is fully started (system tray icon steady, not animating) on this machine, then re-run `npx supabase start && npx supabase db reset --local`.
- **Not marked PASS falsely:** this specific sub-check is called out as unresolved-locally above, not folded into a blanket "all green."

## Known follow-up items (do not block M02, must resolve before M12)

1. `src/services/database/types.ts` is hand-authored to match the SQL exactly — regenerate via `npx supabase gen types typescript --local` once Docker/local Supabase is confirmed working, and diff against the hand-authored version.
2. Hall of Fame `golden_boot`/`mvp` (player names, unresolved to `players.id`) — left as TODO comments in `seed.sql`; needs a real admin-panel assignment flow in M11, or a one-off manual resolution before Release Candidate.
3. Player id 18 name mismatch (`r25-data-reconciliation-plan.md` §2) — **resolved in M12.5**: product owner confirmed "Xuân Sử" is correct; the asset filename was the error, not the display name.

## Decision

**Gate: PASS.** Schema/RLS/seed/service-layer implementation is complete and passes every check available in this environment; the one blocked check (live migration apply) has a concrete, already-wired remediation path (CI) and is not being claimed as verified. Proceeding to M02 — Authentication + RBAC.
