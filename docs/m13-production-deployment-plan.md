# M13 — Production Deployment Plan (NOT YET AUTHORIZED)

> **Status: STOP.** This plan is prepared and ready per the M13 Staging Readiness directive. Every command below targets the **production** Supabase project (`ptx-summer-cup-2026`, ref `wmamuqylqqikvseuqerm`) and the live site. **None of it has been executed.** Do not run any command in this document without explicit, separate human authorization for *that specific step* — passing M13 staging does not itself authorize production.

Prerequisite reading: `docs/gates/m13-staging-evidence.md` (what was verified and how), `docs/gates/m12.5-evidence.md` (the certified RC baseline this plan deploys).

## 0. Pre-deployment decisions required from the product owner (not resolvable by this process)

1. **Enable Point-in-Time Recovery / physical backups on the production project before cutover.** Staging currently has `pitr_enabled: false` — confirm production's plan tier includes this, and enable it, before go-live. Without it, there is no automated rollback path if a migration or bad write corrupts production data; the only fallback would be re-deriving state from the R25 legacy source data, which is lossy for anything created after cutover (real predictions, real admin edits).
2. **Confirm production project identity.** This plan assumes `ptx-summer-cup-2026` (ref `wmamuqylqqikvseuqerm`) is the correct, sole production target — verify this explicitly before step 2 below; it was inferred from `supabase projects list` (no `-staging` suffix, org `dpgiiwquogbgskyjeetv`) but was never addressed by any command in this session and its actual current DB state (empty vs. already containing something) is unknown to this process.
3. **Custom domain / DNS / hosting target** for the Next.js app itself is out of scope for this plan (Supabase is the backend; hosting the Next.js app — Vercel or otherwise — needs its own separate go/no-go and is not addressed here).
4. **Team T/X group photos** — still `SOURCE_LOST_PENDING_REPLACEMENT` (docs/migration/r25-asset-migration-plan.md §3). Decide whether production launches without them (current default) or waits for replacement photos.

## 1. Pre-flight checks (read-only, safe to run any time)

```bash
npx supabase projects list
```
Confirm the production ref by name one more time immediately before step 2 — names can be renamed, refs cannot. Abort if the name doesn't exactly match what the product owner confirmed in §0.2.

```bash
npx supabase backups list --project-ref <PRODUCTION_REF>
```
Confirm `pitr_enabled: true` (per §0.1) before proceeding. If `false`, **stop and resolve §0.1 first.**

## 2. Link to production (read-only until step 3)

```bash
npx supabase link --project-ref <PRODUCTION_REF> --yes
cat supabase/.temp/project-ref   # must print exactly <PRODUCTION_REF> — abort otherwise
```

## 3. Migrate schema

```bash
npx supabase db push --linked --dry-run   # review the exact migration list before applying
npx supabase db push --linked --yes
npx supabase migration list --linked      # confirm local == remote, all 11 entries
```

**Do not use `--include-seed` here.** `supabase/seed.sql` contains the R25 legacy roster data intended for the *initial* production dataset — running it is a deliberate, one-time content decision, not an automatic side effect of every deploy. Confirm with the product owner whether production launches with this seed data or with different/no initial content before running the seed step separately:

```bash
npx supabase db push --linked --include-seed --yes   # only after explicit confirmation
```

## 4. Provision Storage buckets

Do **not** run `supabase config push` (it would also push `[auth]` `site_url`/`additional_redirect_urls` from `config.toml`, which are local-dev values — production needs its own real site URL configured separately, see §6). Instead, create the 5 buckets directly via the Storage Admin API, matching `config.toml`'s declarations exactly (same script pattern used for staging, adjusted to the production URL/service-role key — see `docs/gates/m13-staging-evidence.md` §5 for the exact bucket list/settings).

## 5. Upload real assets (only if seeding real content in step 3)

```bash
node --env-file=.env.production.local scripts/upload-r25-media.js --out=docs/migration/r25-production-upload-result.json
node --env-file=.env.production.local scripts/apply-uploaded-media-paths.js
node --env-file=.env.production.local scripts/verify-data-parity.js   # must print PARITY OK before proceeding
```

`.env.production.local` must never be committed (matches the `.gitignore` `.env.*.local` pattern already in place) and must be deleted from any local machine immediately after use, same discipline as `.env.staging.local` in this phase.

## 6. Configure production-specific Auth settings

Unlike Storage buckets, `[auth]` settings (`site_url`, `additional_redirect_urls`) **do** need to be set correctly for production — but manually, to the real production domain, not via a blanket `config.toml` push (which still contains `127.0.0.1` dev values). Set these via the Supabase dashboard or Management API to the actual production URL before enabling public signups.

## 7. First admin bootstrap

Production starts with zero admin users, same as staging/local. One-time bootstrap: the first real admin signs up normally through the app, then is promoted via a single service-role `PATCH` to `profiles.role = 'admin'` (identical mechanism verified in `docs/gates/m13-staging-evidence.md` §4) — this is the only point where a service-role credential touches a real user record outside the app's own code path, and it should be run once, by a human with production service-role access, not automated into a script that could be re-run accidentally.

## 8. Post-deploy verification (mirrors M13 staging gates exactly, against production)

Run the same checks as `docs/gates/m13-staging-evidence.md` §3 (RLS anon read/write), §5 (a handful of real image URLs, not a full 53-file reupload if step 5 already ran), §6 (Realtime, using a low-impact test row you immediately revert), before announcing go-live.

## Rollback plan

**If a migration fails partway through step 3:** `supabase db push` applies migrations one at a time in order and stops on first error — check `supabase migration list --linked` to see exactly which ones landed. Because every migration in this codebase is additive/idempotent-safe (no destructive `DROP` of user data), a partial application is not catastrophic; fix the failing migration file, and re-run `db push --linked` to continue from where it stopped.

**If a deployed migration causes a data-correctness problem discovered after go-live:**
1. First choice, once §0.1 is resolved: restore from the automated PITR backup to a point before the bad migration, via `supabase backups restore --project-ref <PRODUCTION_REF>` (see `supabase backups restore --help` for exact flags — not reproduced here since it was never run against a real project in this session; read the current `--help` output before using it for real).
2. If PITR is unavailable: write a new, additive compensating migration (never edit or delete an already-applied migration file) and deploy it through the same `db push` path. This codebase does not maintain hand-authored "down" migrations — schema changes are forward-only by design (see `supabase/migrations/`), matching Supabase's own recommended migration model.

**If Storage upload partially fails:** `scripts/upload-r25-media.js` uses `upsert: true` per file and reports `uploaded/failed` counts — safe to re-run; it will only re-upload, never duplicate or corrupt already-succeeded files.

**If the app itself needs to roll back to a previous release** (unrelated to the database): that is a Next.js hosting-platform rollback (e.g., Vercel's instant rollback to a previous deployment) — out of scope for this Supabase-focused plan, and depends on the hosting decision in §0.3.

## Explicit stop

This plan is **prepared, not executed.** No command above has been run against `ptx-summer-cup-2026` (production) in this session. Resuming from here requires the product owner to: (a) resolve §0's open decisions, and (b) explicitly authorize proceeding to production deployment.
