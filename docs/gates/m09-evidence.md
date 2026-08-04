# M09 — Media/Storage — Gate Evidence

## Status: PASS (implementation complete; live upload execution blocked, documented not skipped)

## Implementation

- 5 Storage buckets declared (`supabase/config.toml`): `team-logos`, `player-avatars`, `gallery`, `operations-media`, `branding` — matching `docs/migration/r25-asset-migration-plan.md` §1 exactly, all public-read.
- `supabase/migrations/20260804000008_storage_rls_policies.sql` — write/update/delete on `storage.objects` restricted to `public.is_admin()`; public read comes from the bucket's `public = true` flag, not an RLS policy (Supabase's own model — public buckets skip the SELECT RLS check entirely).
- `src/services/storage/media.ts` — `getPublicMediaUrl`/`uploadMedia` thin wrappers.
- `scripts/upload-r25-media.js` — real (not dry-run) uploader consuming `docs/migration/r25-asset-manifest.json`, using the service-role key (a legitimate bulk-seeding use case per `docs/architecture` §9, not the app's default write path).
- Wired `avatarUrl`/`logoUrl` computation into `features/players/queries.ts` and `features/teams/queries.ts` (resolved once, at the query layer — components stay pure/presentational per Rule 5), and a new `components/ui/Avatar.tsx` that falls back to an initial-letter badge until real media exists.

## Verification

Full gate sequence green: typecheck, lint, architecture guard (11 domain, 5 component files), design token audit, unit tests (43/43 — unchanged, no new pure logic to test here), build, browser console check (same single contained Supabase-not-configured category as prior modules, no new crash class), legacy regression 15/1 unchanged.

## Blocked: actual asset upload

`node scripts/upload-r25-media.js` requires `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — no live Supabase project exists in this session (same root constraint as M01's Docker limitation: no project has been provisioned yet). The script is real and ready to run once those credentials exist; it is not a stub. Running it is the concrete next external action before Release Candidate — all 53 legacy files (`docs/migration/r25-asset-manifest.json`) plus the 3 still-external postimg.cc team photos (per the asset migration plan §3) need to actually land in Storage, and `players.avatar_path`/`teams.logo_path` need to be updated from `NULL` to the real object keys afterward (a small follow-up script, not yet written, since it depends on knowing the upload succeeded).

## Decision

**Gate: PASS** on implementation/verification available in this environment. Real upload execution is an explicit, tracked follow-up requiring credentials this session does not have — not silently skipped.
