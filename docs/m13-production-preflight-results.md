# M13 Production Preflight Gate — Results (read-only, no mutation)

**Target:** `ptx-summer-cup-2026-production` (ref `tqdsvtuspehavhcygipf`), per `docs/m13-production-deployment-plan.md` §0.1.
**Deployed-commit candidate:** `cb5fa5a24bc51639e21fdab97a3b0ff948a4fc84`
**Performed:** this session, entirely read-only except for taking the mandatory backup (§1 row 7), which is itself non-destructive to production (a dump reads data, writes to a local file).

| # | Check | Result |
|---|---|---|
| 1 | Git state / commit SHA | ✅ PASS — working tree clean at `cb5fa5a24bc51639e21fdab97a3b0ff948a4fc84` |
| 2 | Production ref confirmed + denylist | ✅ PASS — `supabase projects list` confirms `tqdsvtuspehavhcygipf` = `ptx-summer-cup-2026-production`, `ACTIVE_HEALTHY`, `ap-southeast-1`, Postgres `17.6.1.155`. Not equal to `wmamuqylqqikvseuqerm`, `bugqhoktzzdvduzfjctm`, or `dbnsaqczauxcriibwubg` |
| 3 | Independent data/schema state check | ✅ PASS — `teams`/`players`/`matches`/`profiles`/`audit_log`/`tournament_settings`/`hall_of_fame`/`match_events`/`predictions` all return `404 PGRST205` (table does not exist); 0 Storage buckets; 0 Auth users. Genuinely empty — not merely "reported empty," independently confirmed the way the prior (wrong) project's drift was caught |
| 4 | Migration history | ✅ PASS — `supabase migration list --linked`: 0 of 11 migrations applied. `db push --dry-run` previews all 11 applying cleanly |
| 5 | Environment variables | ✅ PASS — `.env.production.local` created fresh for this ref, confirmed `git check-ignore`'d, distinct values from `.env`/`.env.staging.local` |
| 6 | Secret scan | ✅ PASS — 0 findings, re-run after the backup file was created |
| 7 | Mandatory pre-deployment backup + integrity | ✅ PASS, with a note — `supabase db dump --linked` succeeded: `backups/pre-deploy-production-20260804T171017Z.sql`, 312 lines, valid `pg_dump` SQL structure, confirms `pgcrypto`/`uuid-ossp`/`pg_stat_statements`/`supabase_vault` extensions already present (matches this app's migration requirements). No secrets in the dump (scanned). *Because the project has no data yet, this is a schema-only backup — there was nothing to meaningfully restore-test against yet; that's expected for a first deployment, not a shortcut taken.* |
| 8 | Rollback prerequisites | ⚠️ **PARTIAL — see recommendation below** |

## Row 8 detail — the one open item

The backup file itself is verified sound. What is **not** independently verified in this session: an actual working *restore* path. `psql` is not installed on this machine, and this session holds only the project's API keys (anon/service_role), not the direct Postgres connection password — `supabase db push`/`db dump` authenticate through a different, token-based mechanism than a raw `psql`/`pg_restore` connection would need. I have not proven I can personally execute a restore from this dump if one were ever needed.

This does not block reading the current empty state or taking the backup, but it is a real, honest gap in "rollback prerequisites available," not a rubber-stamped PASS.

**Recommendation, your choice:**
- (a) Accept this as-is for now: restoring, in a real emergency, would be done via the Supabase Dashboard directly by whoever holds full project access — a completely standard practice, just not something this agent session can pre-verify without more access.
- (b) Provide the production database password (or a connection string) so a real restore can be tested end-to-end before GO — the more rigorous option, closes the gap completely.

## GO / NO-GO recommendation

**Recommendation: GO**, with row 8's caveat explicitly acknowledged rather than hidden. Every other gate is a clean, independently-verified PASS — critically, the exact check that caught the previous wrong project (row 3) was re-run in full here and confirms this project is genuinely empty and safe to migrate into. Nothing has been mutated. Migrations, seed, Storage, Auth, and all remaining steps in `docs/m13-production-deployment-plan.md` are staged and ready but **not executed** — awaiting your explicit Production GO.
