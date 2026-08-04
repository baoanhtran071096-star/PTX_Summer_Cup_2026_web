# M09 — Media/Storage — Gate Evidence

## Status: PASS (implementation complete; live upload execution — resolved in M12.5, see below)

## Implementation

- 5 Storage buckets declared (`supabase/config.toml`): `team-logos`, `player-avatars`, `gallery`, `operations-media`, `branding` — matching `docs/migration/r25-asset-migration-plan.md` §1 exactly, all public-read.
- `supabase/migrations/20260804000008_storage_rls_policies.sql` — write/update/delete on `storage.objects` restricted to `public.is_admin()`; public read comes from the bucket's `public = true` flag, not an RLS policy (Supabase's own model — public buckets skip the SELECT RLS check entirely).
- `src/services/storage/media.ts` — `getPublicMediaUrl`/`uploadMedia` thin wrappers.
- `scripts/upload-r25-media.js` — real (not dry-run) uploader consuming `docs/migration/r25-asset-manifest.json`, using the service-role key (a legitimate bulk-seeding use case per `docs/architecture` §9, not the app's default write path).
- Wired `avatarUrl`/`logoUrl` computation into `features/players/queries.ts` and `features/teams/queries.ts` (resolved once, at the query layer — components stay pure/presentational per Rule 5), and a new `components/ui/Avatar.tsx` that falls back to an initial-letter badge until real media exists.

## Verification

Full gate sequence green: typecheck, lint, architecture guard (11 domain, 5 component files), design token audit, unit tests (43/43 — unchanged, no new pure logic to test here), build, browser console check (same single contained Supabase-not-configured category as prior modules, no new crash class), legacy regression 15/1 unchanged.

## Asset upload — resolved in M12.5

At time of writing, `node scripts/upload-r25-media.js` was blocked on the absence of a live Supabase project (same root constraint as M01's Docker limitation). **Resolved in M12.5**: executed for real against a local Supabase project — 53/53 files uploaded, 0 failed. `scripts/apply-uploaded-media-paths.js` (written in M12.5) then updated `players.avatar_path`/`teams.logo_path` from `NULL` to the real object keys — 24/24 + 3/3. Of the 3 external postimg.cc team photos: Team P recovered and uploaded to `gallery`; Team T and Team X are confirmed permanently dead (404), marked `SOURCE_LOST_PENDING_REPLACEMENT` per product-owner decision (capability preserved, no fabricated substitute) — see `docs/migration/r25-asset-migration-plan.md` §3 and `docs/gates/m12.5-closure-ledger.md` item 5. Separately, M12.5 found and fixed a real bug in image rendering itself (Next's image optimizer rejecting the local Storage host as a private IP) — see `docs/gates/m12.5-evidence.md` §2.

## Decision

**Gate: PASS.** Implementation, verification, and (as of M12.5) real upload execution are all complete.
