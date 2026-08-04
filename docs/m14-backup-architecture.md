# M14 — Automated Production Backup Architecture

> **Status: designed, workflow authored as a draft, not yet enabled.** Activation requires the one storage-destination decision below.

## Architecture

```
GitHub Actions (scheduled, daily + manual dispatch)
        │
        ├─ supabase db dump --linked  (against ptx-summer-cup-2026-production, ref tqdsvtuspehavhcygipf)
        │
        ├─ integrity check (non-empty, valid SQL header, extension markers present)
        │
        └─ upload to <STORAGE DESTINATION — see decision below>, never to Git
```

The workflow authenticates to Supabase using a **Personal Access Token** (not the database password), the same mechanism this session's CLI has used throughout M13/M14 — `supabase link --project-ref <ref>` plus `SUPABASE_ACCESS_TOKEN` in the environment, no direct Postgres connection string needed. This mirrors exactly how every `db push`/`db dump` in M13 already worked.

## Secrets required (GitHub repo → Settings → Secrets and variables → Actions)

| Secret name | Value | Notes |
|---|---|---|
| `SUPABASE_ACCESS_TOKEN` | A Supabase **Personal Access Token** scoped to this account, generated via the Supabase Dashboard (Account → Access Tokens) | This agent cannot generate this on the product owner's behalf — it requires interactive dashboard access under the product owner's own Supabase account identity |
| `SUPABASE_PROJECT_REF` | `tqdsvtuspehavhcygipf` | Not secret by itself, but stored as a secret/variable for single-source-of-truth consistency with the workflow |
| `<STORAGE DESTINATION credentials>` | Depends on the decision below | e.g. an S3-compatible bucket needs an access key + secret key; see options |

**None of these secrets will ever be requested in chat or written to any tracked file** — they are entered directly into GitHub's own Secrets UI by whoever has repo admin access, the same discipline already used for every Supabase/Vercel credential in this project.

## Storage destination decision — **blocks activation, PO decision required**

The dump file itself must land somewhere private, off-site, and durable. Options, none of which this agent can provision on its own (each needs an account/billing relationship):

1. **A private cloud storage bucket** (S3, Google Cloud Storage, Azure Blob, Backblaze B2, or Cloudflare R2) — the most standard choice for this exact purpose. Needs: an account, a bucket created with public access disabled, and an access key/secret pair added to GitHub Secrets.
2. **A private GitHub repository's release assets or a separate private backup repo** — no new external account needed (reuses GitHub, which is already in use), but GitHub's own storage isn't purpose-built for this and has practical size/retention caveats worth being aware of before committing to it long-term.
3. **Another destination the product owner already has** (e.g. existing cloud storage, a NAS with an accessible upload endpoint, etc.) — this agent will adapt the workflow's upload step to whatever is specified.

**Exact PO action needed:** state which option (or a specific alternative), and either provide the resulting credentials directly into GitHub Secrets yourself, or confirm this agent should walk through provisioning it together (still requires the product owner to hold the account/billing relationship — this agent cannot create the storage account itself).

## Retention policy (proposed, matching the locked §0.2 policy from M13)

- Daily dumps retained for **30 days** rolling (delete anything older automatically as part of the workflow, or via the storage provider's own lifecycle rules if it supports them — e.g. S3 lifecycle policies).
- **Weekly** dumps (e.g. every Sunday's daily dump) retained for **1 year**, for longer-horizon recovery scenarios.
- This is a proposed default, adjustable — confirm or adjust once the storage destination is chosen (retention mechanics differ slightly by provider).

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

- ✅ `.github/workflows/production-backup.yml.draft` — the workflow logic, ready to rename to `.yml` and enable once secrets exist.
- ⏳ Storage destination decision (above) — blocks activation.
- ⏳ `SUPABASE_ACCESS_TOKEN` generation — requires the product owner's own Supabase Dashboard access.
- ⏳ Storage destination credentials — requires the product owner's own account for whichever option is chosen.

Once these three are resolved, this agent will: rename the `.draft` file to `.yml`, confirm the first scheduled/manual run succeeds, and verify a real dump lands at the chosen destination and passes integrity checks — closing this gate with real evidence, not configuration inspection alone.
