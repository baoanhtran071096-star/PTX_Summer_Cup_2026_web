# M11 — Admin Control Center — Gate Evidence

## Status: PASS

## Implementation (matches the roadmap's M11 scope exactly)

- **Tournament settings**: `/admin/settings` — edit slogan/message/date/location.
- **Teams CRUD**: `/admin/teams` — edit captain + attributes (validated via `domain/team/rules.ts`'s existing `isValidTeamAttributes`).
- **Players CRUD**: `/admin/players` — edit name/team/position.
- **Match control**: `/admin/matches` — status transitions (reusing M05's `setMatchStatusAction`, which already enforces the state-machine rule) + event recording (reusing M05's `recordMatchEventAction`).
- **Predictions moderation**: `/admin/predictions` — leaderboard + delete.
- **Media**: `/admin/media` — functional upload form (bucket + target key + file) via `uploadMediaAction`, using M09's `services/storage/media.ts`.
- **Users/roles**: `/admin/users` — list profiles, toggle admin/viewer.
- **Audit trail**: new `audit_log` table (own migration), `services/database/audit.db.ts`. Every admin write in this module — plus retrofitted onto M05's match actions — records `{actor, action, entity_type, entity_id, metadata}`. Best-effort (an audit-log failure never blocks the action it's recording).
- `requireAdminUserId()` added to `services/auth/session.ts` as the shared admin guard + audit-actor-id source, replacing the repeated `isCurrentUserAdmin()` boolean checks from M05.

## Verification

Full gate sequence green: typecheck, lint, architecture guard (11 domain, 5 component files — unchanged, this module added no new domain logic beyond reusing M03/M05's), design token audit, unit tests 51/51 (added admin schema coercion/validation tests), production build (all 7 new `/admin/*` routes correctly dynamic). Browser console checked: homepage clean; `/admin` itself shows the layout's graceful "not configured" message with zero errors; `/admin/teams` (and by the same mechanism, every other admin sub-page with its own data query) surfaces the same single Supabase-not-configured error category as every public route in the app — confirmed this is Next.js's parallel-rendering behavior (a child page's own data fetch can start before its layout decides what to render), not a new crash class, since the layout's guard still fully protects `/admin` itself and any future page with no page-level query. Legacy regression 15/1, unchanged.

## Explicit scope note (not a silent gap)

The roadmap's M11 line item is exactly what's built here: Teams/Players CRUD, match control, predictions, media, users/roles, tournament settings, audit trail. **Not rebuilt**, and not part of this locked scope: R25's presentational/fun admin tools (Referee Digital Toolkit, Stadium DJ Soundboard, VAR Review Simulator, Infographic Generator, Official Match Report Exporter, 3D Trophy Rotate, Golden VIP Ticket Generator). These were classified PRESERVE in `docs/migration/r25-parity-matrix.md` as product-completeness items, but were never listed in the Part II roadmap's numbered M11 gate criteria — they remain tracked backlog for full R25 feature parity, to be resolved explicitly (build or approved-deprecate) before final Release Candidate sign-off, not silently dropped.

## Decision

**Gate: PASS.**
