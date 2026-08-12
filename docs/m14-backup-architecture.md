# M14 — Automated Production Backup Architecture

> **Status: GitHub Actions artifacts evaluated and found sufficient — see the finding below. Workflow authored as a draft; blocked only on the repository actually existing on GitHub (same blocker as the Vercel Git connection) and two secrets requiring the product owner's own accounts.**

## Finding: do private GitHub Actions artifacts satisfy the locked policy? — **Yes, verified against GitHub's own documentation, not assumed**

Fetched directly from GitHub's docs (`configuring-the-retention-period-for-github-actions-artifacts-and-logs`), not recalled from memory:

- **Default artifact retention: 90 days.**
- **Maximum configurable retention: 90 days for public repositories, but up to 400 days for private repositories.**

This changes the original proposal. A private repo's 400-day ceiling **exceeds** the locked policy's longest requirement (1-year / 365-day weekly retention) with room to spare, and comfortably covers the 30-day daily tier too. Access control for artifacts follows GitHub's standard repository-permission model — on a private repo, only accounts with read access to the repo can download them, which is a reasonable, sufficient access-control boundary for this use case (the same trust boundary already relied on for the source code itself).

**Conclusion: private GitHub Actions artifacts alone satisfy the locked retention/security requirements. External object storage (S3/GCS/etc.) is not required to close this gate — it remains a reasonable future enhancement (e.g. for redundancy independent of GitHub itself), never a blocker.**

### Follow-up finding (M14 continuation phase): the 500 MB Free-plan artifact *storage* quota — checked, not assumed

The prior finding verified retention **days** only. It did not check the separate **storage size** quota GitHub applies to Actions artifacts on the Free plan for private repositories. Re-fetched directly from GitHub's docs (`actions/reference/limits`) this phase:

- **GitHub Free plan, private repos: 500 MB total Actions artifact storage**, 2,000 included minutes/month, 10 GB Actions cache, 20 concurrent jobs, 6h per-job / 35-day per-workflow-run ceiling.

This is a real quota this design must fit inside, so it was checked against the actual dump size rather than assumed safe. Both existing local dump files from the M13 restore-test phase (`backups/pre-deploy-production-....sql`, `backups/pre-migration-production-....sql`) are **~4 KB each** — consistent with the current production data volume (3 teams, 24 players, 3 matches, 1 settings row). At that size, 90 days of daily dumps retained simultaneously total **≈ 270 KB** — roughly 0.05% of the 500 MB cap. **The storage quota is not a constraint at the current data scale**, with over 1,800x headroom before it would need reconsideration. If the dataset grows by orders of magnitude in the future, this should be re-checked; it is not a concern today.

**One condition this finding depends on:** the GitHub repository for this project must be **private**, not public. This is not yet decided — see "What's authored now vs. what's pending" below.

## Architecture

```
GitHub Actions (scheduled, daily + manual dispatch)
        │
        ├─ supabase db dump --linked  (against ptx-summer-cup-2026-production, ref tqdsvtuspehavhcygipf)
        │
        ├─ integrity check (non-empty, valid SQL header, extension markers present)
        │
        └─ upload as a GitHub Actions artifact, retention-days: 90
           (well within the private-repo 400-day ceiling; raise later if a
           longer single-tier window is wanted — no external storage needed)
```

The workflow authenticates to Supabase using a **Personal Access Token** (not the database password), the same mechanism this session's CLI has used throughout M13/M14 — `supabase link --project-ref <ref>` plus `SUPABASE_ACCESS_TOKEN` in the environment, no direct Postgres connection string needed. This mirrors exactly how every `db push`/`db dump` in M13 already worked.

## Secrets required (GitHub repo → Settings → Secrets and variables → Actions)

| Secret name | Value | Notes |
|---|---|---|
| `SUPABASE_ACCESS_TOKEN` | A Supabase **Personal Access Token** scoped to this account, generated via the Supabase Dashboard (Account → Access Tokens) | This agent cannot generate this on the product owner's behalf — it requires interactive dashboard access under the product owner's own Supabase account identity |
| `SUPABASE_PROJECT_REF` | `tqdsvtuspehavhcygipf` | Not secret by itself, but stored as a secret/variable for single-source-of-truth consistency with the workflow |

**No external storage credentials are needed** — the finding above removes that requirement. **These secrets will never be requested in chat or written to any tracked file** — entered directly into GitHub's own Secrets UI by whoever has repo admin access.

## Retention policy (revised, using the verified 400-day private-repo ceiling)

- Single tier: daily dumps as GitHub Actions artifacts, `retention-days: 90` (a safe, generous default well inside the private-repo maximum) — no separate long-term/short-term split needed, since 90 days already exceeds the originally-proposed 30-day short tier, and the private-repo ceiling (400 days) is available to extend to a full year later with a one-line change if wanted.
- This is a proposed default, adjustable at any time by editing `retention-days` in the workflow — no infrastructure change required, unlike an external-storage lifecycle policy would need.

## Integrity verification (per run)

Each workflow run will:
1. Confirm the dump file is non-empty.
2. Confirm it starts with a valid `pg_dump` header (`SET statement_timeout`, etc. — matches the structure already verified twice in M13).
3. Confirm at least the 4 expected `CREATE EXTENSION` statements are present (a cheap, fast structural sanity check without a full restore-test on every single run).
4. Fail the workflow run (and surface a visible GitHub Actions failure) if any of the above don't hold — never silently upload a corrupt or empty file.

A **full restore-test** (the disposable-Docker-container method proven in M13) is recommended periodically (e.g. monthly) rather than on every single daily run, to avoid the overhead of spinning up a scratch Postgres container every day. This can be a separate, lower-frequency workflow once the daily one is live.

## Restoration procedure (already proven, reused)

Identical to the mechanism verified end-to-end in M13 (`docs/m13-production-preflight-results.md`, "Row 8"):

```bash
# 1. Launch an isolated scratch instance matching production's Postgres build
docker run -d --name restore-verify -e POSTGRES_PASSWORD=<throwaway> -p 55432:5432 public.ecr.aws/supabase/postgres:17.6.1.155

# 2. Copy the chosen dump in and restore
docker cp <dump-file>.sql restore-verify:/tmp/restore.sql
docker exec restore-verify psql -U postgres -f /tmp/restore.sql

# 3. Verify structurally (not just "it parsed")
docker exec restore-verify psql -U postgres -c "select extname from pg_extension order by extname;"

# 4. Destroy the scratch target
docker rm -f restore-verify
```

For an actual production disaster-recovery restore (not a drill), the destination is the real production project, and doing so requires the production database's direct connection credentials — held separately, per the same principle already established: this agent does not hold the production DB password, only its Management-API-token-based access.

## What's authored now vs. what's pending

- ✅ **Storage destination — resolved.** Private GitHub Actions artifacts, no external account/billing needed.
- ✅ **Repository now exists and is confirmed private** — `baoanhtran071096-star/PTX_Summer_Cup_2026_web_R25`, pushed and verified this phase (unauthenticated API access returns 404). The 400-day retention ceiling this design relies on applies.
- ✅ `.github/workflows/production-backup.yml.draft` — updated to upload as an artifact directly (`actions/upload-artifact`, `retention-days: 90`).
- ✅ **Permissions audited** (per this phase's explicit instruction, before considering activation): the workflow had no explicit `permissions:` block, meaning it would have inherited whatever default `GITHUB_TOKEN` scope the repo/org happens to have — not a least-privilege posture for a workflow that only needs to read the repo and upload an artifact. Added an explicit `permissions: contents: read` block.
- ⏳ **One blocker remains:** `SUPABASE_ACCESS_TOKEN` — requires the product owner's own Supabase Dashboard access (Account → Access Tokens) to generate; this agent cannot generate it.

Once the token is added to GitHub Secrets, this agent will: rename the `.draft` file to `.yml`, confirm the first scheduled/manual run succeeds, and verify a real artifact is produced and passes integrity checks — closing this gate with real evidence, not configuration inspection alone.

## Pre-execution audit (read-only inspection of the current draft, this phase)

| # | Check | Result |
|---|---|---|
| 1 | Target is exactly `tqdsvtuspehavhcygipf` | Hardcoded in the `Link to production` step; the step aborts (`exit 1`) if the linked ref differs |
| 2 | Staging not targeted | No other ref appears anywhere in the workflow |
| 3 | Denylisted project cannot be targeted | Same guard as #1 — only one ref is ever referenced or possible |
| 4 | Dumps cannot enter Git history | Workflow never runs `git add`/`commit`/`push`; the dump exists only in the ephemeral runner workspace and is explicitly `rm -f`'d in a final `if: always()` step |
| 5 | Least-privilege permissions | Explicit `permissions: contents: read` at workflow level — no write, no other scope |
| 6 | Secrets cannot be echoed | `SUPABASE_ACCESS_TOKEN` only ever appears in `env:` blocks passed to the Supabase CLI, never interpolated into an `echo`/printed string; GitHub's built-in log redaction is a backstop, not the only control |
| 7 | Artifact cannot contain unnecessary credentials | `upload-artifact` `path:` is scoped to exactly one file (`$BACKUP_FILE`) — not a directory, so no risk of `supabase/.temp/` or other CLI state being swept in |
| 8 | Retention satisfies verified policy | `retention-days: 90` — within the 400-day private-repo ceiling and, per the storage-quota finding above, ≈270 KB of real total artifact storage at 90 days of daily dumps vs. the 500 MB Free-plan cap |
| 9 | Failure cannot mutate Production | Every Supabase CLI call in this workflow is read-only (`link`, `db dump`) — there is no `db push`/migration/write command anywhere in the file |
| 10 | Appropriate for manual first execution | `workflow_dispatch: {}` is present alongside the cron schedule |

**All 10 checks pass on static inspection.** This is a configuration/design audit, not execution evidence — per the locked policy, the Backup Gate cannot be marked PASS from this alone; a real run producing a real, verified artifact is still required (see "What's authored now vs. what's pending" above).
