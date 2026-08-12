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
| 7 | Mandatory pre-deployment backup + integrity | ✅ PASS — `supabase db dump --linked` succeeded: `backups/pre-deploy-production-20260804T171017Z.sql`, 312 lines, valid `pg_dump` SQL structure, confirms `pgcrypto`/`uuid-ossp`/`pg_stat_statements`/`supabase_vault` extensions already present (matches this app's migration requirements). No secrets in the dump (scanned). |
| 8 | Rollback prerequisites | ✅ **PASS — closed via a real, isolated restore test.** See below. |

## Row 8 — closed: restore verified against a disposable scratch target

Per the product owner's explicit choice: **no production database password or connection string was requested or used.** Instead, the restore test used only the backup file already on disk plus a brand-new, fully isolated, disposable Postgres container — never connected to production, never connected to staging, never connected to the local dev stack used for the certified M12.5 baseline.

**Procedure (exact commands run):**
```bash
# 1. Launch an isolated scratch instance matching production's exact Postgres build
docker run -d --name m13-restore-scratch \
  -e POSTGRES_PASSWORD=<randomly generated, held only in this shell's memory, never written to any file> \
  -p 55432:5432 public.ecr.aws/supabase/postgres:17.6.1.155

# 2. Copy the backup into it and restore
docker cp backups/pre-deploy-production-20260804T171017Z.sql m13-restore-scratch:/tmp/restore-test.sql
docker exec m13-restore-scratch psql -U postgres -f /tmp/restore-test.sql

# 3. Verify structurally — not just "it parsed"
docker exec m13-restore-scratch psql -U postgres -c "select extname from pg_extension order by extname;"
docker exec m13-restore-scratch psql -U postgres -c "select nspname, obj_description(oid) from pg_namespace where nspname='public';"

# 4. Destroy the scratch target
docker rm -f m13-restore-scratch
```

**Result:** the restore executed with zero errors — every `SET`, `COMMENT ON SCHEMA`, `CREATE EXTENSION` (×4), `CREATE FUNCTION`, `ALTER FUNCTION`, `ALTER PUBLICATION`, `GRANT` (×3), and `ALTER DEFAULT PRIVILEGES` (×5) statement in the dump applied successfully. Post-restore query confirmed all 4 extensions genuinely present in the restored instance (`pgcrypto`, `uuid-ossp`, `pg_stat_statements`, `supabase_vault`) and the `public` schema comment intact — proof the dump is **actually recoverable**, not merely syntactically valid text. The scratch container was destroyed immediately after (`docker rm -f`), confirmed removed via `docker ps -a`.

**Credential handling:** the scratch container's own throwaway password was generated fresh for this test, used only to initialize that disposable container, never written to any file (tracked or untracked), and ceased to matter the moment the container was destroyed. No production credential of any kind was needed for this test, because the object under test was the backup file itself, not a live connection to production.

**RPO/RTO implications, now demonstrated rather than assumed:** the locked §0.2 policy's RTO (≤2h manual restore) is now backed by a proven mechanism — restore the most recent `.sql` dump via `psql -f` against a target Postgres instance — rather than an untested assumption. **Remaining limitation, stated plainly:** this test proves the *mechanism* works against a disposable target of the same Postgres version; it does not by itself prove a restore *into the live production project* would be equally fast/smooth (that would require the production DB password, which was deliberately not requested per this turn's constraint #1). If a real restore into production is ever needed, it goes through the Supabase Dashboard or the production database's own credentials, held by whoever has that access at the time — the mechanism (plain-SQL `psql -f` restore) is now proven, not merely theorized.

**Native `psql` install (requested for reference, not required for the above — Docker's own `psql` was used instead):**
- **Winget (simplest, `winget` already confirmed available on this machine):** `winget install PostgreSQL.PostgreSQL.17`
- **Official installer:** download from `https://www.postgresql.org/download/windows/` (EDB installer), select "Command Line Tools" during setup — this installs `psql` under `C:\Program Files\PostgreSQL\17\bin`, which then needs adding to `PATH`.
- **Chocolatey (if installed):** `choco install postgresql17 --params '/Password:not-used'`
None of these were run — the Docker-based approach above fully satisfied the verification requirement without adding a new tool to the host.

## GO / NO-GO recommendation

**Recommendation: GO.** Every Preflight Gate row is now a clean, independently-verified PASS with no acknowledged gaps. Re-confirmed a second time before this recommendation: production ref unchanged (`tqdsvtuspehavhcygipf`, `ACTIVE_HEALTHY`), staging remains a separate project, the protected project (`wmamuqylqqikvseuqerm`) remains untouched (`INACTIVE`, unchanged), 0/11 migrations applied, `teams`/`profiles` still return 404 (genuinely empty), secret scan clean. Nothing has been mutated against production at any point. Migrations, seed, Storage, Auth, and all remaining steps in `docs/m13-production-deployment-plan.md` are staged and ready but **not executed** — awaiting your explicit Production GO.
