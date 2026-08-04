# M13 — Production Deployment Plan (NOT YET AUTHORIZED)

> **Status: STOP.** This plan is prepared per the M13 Final Production Requirements directive. Every command below targets the **production** Supabase project. **None of it has been executed.** Passing every gate in this document does not itself authorize execution — that requires a separate, explicit Production GO from the product owner (§13). Bypass/auto-approve permissions this agent may hold in its tooling are **not** a substitute for that human decision and must never be treated as one.

Prerequisite reading: `docs/gates/m13-staging-evidence.md` (what was verified on staging and how), `docs/gates/m12.5-evidence.md` (the certified RC baseline this plan deploys), `docs/m13-final-production-requirements-audit.md` (gap audit this version closes).

## 0. Decisions that must be locked before this plan may be executed

These are not resolvable by this process — each needs an explicit product-owner answer, recorded here with a date and the answer, before step 1 may begin.

### 0.1 Production project identity

- **Approved production ref:** `<TO BE CONFIRMED — DO NOT ASSUME>`
- Inferred candidate from `supabase projects list`: name `ptx-summer-cup-2026`, ref `wmamuqylqqikvseuqerm` — **inferred, not confirmed**. This plan will not use this ref, or any ref, until the product owner states the exact ref string explicitly.
- **Known-wrong refs, hardcoded as a blocklist for every guard check in this plan** (never valid targets for any command below): `bugqhoktzzdvduzfjctm` (staging — `ptx-summer-cup-2026-staging`), `dbnsaqczauxcriibwubg` (unrelated inactive project).

### 0.2 Backup & Disaster Recovery

- **Current known state:** staging (`bugqhoktzzdvduzfjctm`) has `pitr_enabled: false`, `backups: []` — confirmed via `supabase backups list`. Production's status is unknown until checked (§1, step 2).
- **Decision required — one of:**
  - (a) **Enable PITR / physical backups** on the production project's plan tier before cutover. If chosen: state target RPO (maximum acceptable data loss window, e.g. "≤5 minutes" for PITR) and RTO (maximum acceptable time to restore, e.g. "≤1 hour"), and verify both are enabled and match before GO.
  - (b) **Accept an alternative backup strategy** if PITR is unavailable or not desired for cost reasons. Must state: the alternative mechanism (e.g. scheduled `pg_dump`/`supabase db dump` to external storage, on what cadence), the resulting RPO (= the cadence — e.g. daily dump means RPO ≈ 24h), the RTO (time to manually restore from that dump), and an explicit **risk acceptance**: "Product owner accepts up to `<RPO>` of data loss and `<RTO>` of downtime in a disaster scenario, in exchange for `<reason, e.g. cost>`."
  - **This plan does not proceed past §1 until one of (a) or (b) is recorded here with an explicit answer, not a placeholder.**

### 0.3 Production Seed Policy (locked allowlist/blocklist)

Verified factually against the current `supabase/seed.sql` (not asserted):

- **Allowlist — the only data this plan seeds into production:** 3 teams (`p`/`t`/`x`, from the certified R25 extraction), 24 players, 3 scheduled matches, 1 Hall of Fame year (2025), 1 tournament-settings row (slogan/message/date/location) — all traceable to `docs/migration/r25-extracted.json`, the frozen extraction manifest already parity-verified against local and staging.
- **Blocklist — confirmed absent from `seed.sql`, and must never be added:** `SAMPLE_PREDICTIONS` or any fake prediction data (approved-dropped per `docs/migration/r25-approved-deprecation-registry.md` entry #1); any test/demo/synthetic admin or user account (in particular, the M13 staging verification account `m13-staging-verification@ptxsummercup2026.test` is **staging-only** and must never be created in production); any record whose name/content contains `sample`, `demo`, `test`, or `fake` (verified via `grep -in` against `seed.sql` before every seed run, not just once here).
- **Sign-off required:** confirm this allowlist/blocklist is accepted as-is, or state changes, before §1.

### 0.4 Team T/X lost assets (carried forward from M12.5 — reconfirm, don't reopen)

- Locked in M12.5: Team T and Team X's legacy group-lineup photos are permanently unrecoverable (`SOURCE_LOST_PENDING_REPLACEMENT`), the capability is preserved (not deprecated), no fabricated/placeholder image is ever substituted, and any future gallery UI must degrade gracefully (omit the slot, no broken `<img>`) until a real replacement is supplied.
- No gallery display page exists yet in the codebase (confirmed in M12.5 — M09 scoped only avatar/logo wiring). This means there is currently nothing in the UI that could render a broken image for these two assets — the graceful-degradation requirement is recorded for whenever that page is built, not an active gap today.
- **Confirm:** no replacement photos have been supplied since M12.5. If they have, supply them now and this plan's asset-upload step will include them.

### 0.5 Other prerequisites (from the original v1 plan, still open)

- Custom domain / DNS / Next.js app hosting target — out of scope for this Supabase-focused plan; needs its own separate decision.
- Production `[auth]` `site_url`/redirect URLs must be set to the real domain (§9) — cannot be finalized without §0.5's hosting decision.

---

## 1. Preflight Gate (ALL must show PASS before step 2 — no exceptions)

| # | Check | Command / method | Pass condition |
|---|---|---|---|
| 1 | Git state matches an approved, reviewed commit | `git status --short` (must be empty or only expected untracked docs), `git log -1 --format=%H` (record the SHA being deployed) | Working tree clean; SHA recorded in this plan before proceeding |
| 2 | Production ref confirmed and not on the blocklist | `npx supabase projects list`, compare against §0.1's confirmed ref, verify it is NOT `bugqhoktzzdvduzfjctm` or `dbnsaqczauxcriibwubg` | Exact match to §0.1's confirmed ref; blocklist check passes |
| 3 | Migration history is exactly what's expected | `npx supabase migration list --linked` (after linking in §2) compared against `ls supabase/migrations/` | Remote has either 0 migrations (fresh project) or a strict prefix of the local list — never a migration locally that isn't in the committed history, and never a remote migration absent locally |
| 4 | Environment variables present and correctly scoped | Confirm `.env.production.local` exists, is gitignored (`git check-ignore`), and is **not** the same file/values as `.env` or `.env.staging.local` | All three conditions true |
| 5 | Secret scan clean | `npm run verify:secrets` | 0 findings |
| 6 | Backup/recovery readiness resolved | §0.2 answered with (a) or (b), not a placeholder | Explicit answer present |
| 7 | Rollback prerequisites available | Confirm the exact rollback commands in this plan's Rollback section are valid for the CLI version in use (`npx supabase --version`, `npx supabase backups restore --help` if §0.2(a) chosen) | Commands confirmed to exist and match this plan's usage |

**If any row fails: STOP. Do not proceed to step 2.**

## 2. Link to production (identity-guarded)

```bash
npx supabase link --project-ref <CONFIRMED_PRODUCTION_REF> --yes
LINKED=$(cat supabase/.temp/project-ref)
if [ "$LINKED" != "<CONFIRMED_PRODUCTION_REF>" ] || [ "$LINKED" = "bugqhoktzzdvduzfjctm" ] || [ "$LINKED" = "dbnsaqczauxcriibwubg" ]; then
  echo "ABORT: linked ref ($LINKED) failed identity guard"; exit 1
fi
```
Re-run this exact guard block (re-reading `supabase/.temp/project-ref`, re-checking against both the allowlist-of-one and the blocklist) immediately before every subsequent mutating command in this plan — not just once here. This mirrors the discipline already used and proven in the staging phase (`docs/gates/m13-staging-evidence.md` §0).

## 3. Migrate schema

```bash
npx supabase db push --linked --dry-run   # review the exact migration list before applying — must match supabase/migrations/ exactly
npx supabase db push --linked --yes
npx supabase migration list --linked      # confirm local == remote
```

## 4. Deterministic-migrations rule (no exceptions)

If a production-only issue is discovered at any point (before, during, or after this deployment) that appears to need a direct database change: **it must be authored as a new migration file, committed to this repository, reviewed, and deployed through this same `db push` mechanism.** A live `psql`/dashboard SQL-editor edit that isn't represented in `supabase/migrations/` is prohibited — it silently diverges production from the committed, staging-verified history and breaks the reproducibility this entire M12.5/M13 process was built to prove.

## 5. Seed production data (per the locked §0.3 policy only)

```bash
grep -in "sample\|demo\|test\|fake" supabase/seed.sql   # must return nothing — re-verify immediately before use, not just once in this doc
npx supabase db push --linked --include-seed --yes
node --env-file=.env.production.local scripts/verify-data-parity.js   # must print PARITY OK
```

**If parity check fails: STOP.** Do not proceed to step 6. Any record or asset that genuinely cannot migrate must be added to `docs/migration/r25-approved-deprecation-registry.md` with an explicit entry and rationale — never silently dropped or left unexplained.

## 6. Provision Storage + verify real delivery (not just "upload succeeded")

Create the 5 buckets via the Storage Admin API directly (not `supabase config push` — see the staging evidence, §5, for why: it would also overwrite `[auth]` site URLs with local-dev values).

```bash
node --env-file=.env.production.local scripts/upload-r25-media.js --out=docs/migration/r25-production-upload-result.json
node --env-file=.env.production.local scripts/apply-uploaded-media-paths.js
```

Then **actually fetch** at least one real object per bucket type used (not just trust the upload count):

```bash
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" "https://<PRODUCTION_REF>.supabase.co/storage/v1/object/public/player-avatars/xuan-su.webp"
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" "https://<PRODUCTION_REF>.supabase.co/storage/v1/object/public/team-logos/bieu-tuong-doi-p-phoenix-.webp"
```
Both must return `200` with the correct `content_type`. Also confirm bucket public/private access matches `config.toml` (all 5 buckets are `public = true`, read-only for anon — verify no bucket is accidentally left private or accidentally writable by anon).

## 7. Auth → Profile / RBAC production verification (exact chain, post-deploy)

1. First real admin signs up normally through the deployed app (not the Admin API shortcut used for staging's disposable test account — production's first admin should be a real person, per §9).
2. Confirm `public.profiles` row auto-created with `role = 'viewer'`.
3. Promote via **one** service-role `PATCH` to `role = 'admin'` — run once, by a human holding the production service-role key, not scripted into something re-runnable by accident.
4. Confirm login issues a real JWT; confirm admin UI is reachable.
5. Confirm the promoted admin's own JWT (not service_role) can perform an admin write (e.g. re-affirm a team's existing captain_name — a harmless, idempotent write, not a data change).
6. Confirm the resulting `audit_log` row appears on `/admin/audit-log`.
7. Confirm anon read/write matrix matches the RLS contract: anon can read public tables, cannot write any of them, cannot read `audit_log`.

## 8. Realtime production verification (controlled, reverted)

```bash
# Subscribe to postgres_changes on public.matches, then:
# 1. Trigger one harmless UPDATE (e.g. matches.status: 'scheduled' -> 'live' on a match that hasn't started)
# 2. Confirm the event arrives with the correct payload
# 3. Immediately revert (status back to 'scheduled')
# 4. Confirm the reverted state persisted — no test artifact left behind
```
Exact script pattern already proven against staging in `docs/gates/m13-staging-evidence.md` §6 — reuse it, pointed at the production connection.

## 9. Production-specific Auth configuration

Set `[auth]` `site_url` and `additional_redirect_urls` to the real production domain via the Supabase dashboard/Management API — never via a blanket `config.toml` push (still contains `127.0.0.1` dev values). Depends on §0.5's hosting decision being resolved first.

## 10. Full Production Certification Gate (categorized — do not run the wrong category against real data)

**Safe to run before deploy (static, no live data touched):**
```bash
npm run typecheck && npm run lint && npm run verify:architecture && npm run verify:design-tokens && npm run verify:secrets && npm run test:unit && npm run build
```

**Safe to run after deploy, read-only against real production data:**
- Accessibility scan (`@axe-core/playwright`) against the live production homepage and a couple of real content pages.
- Data-parity check (`scripts/verify-data-parity.js`) — read-only.
- RLS matrix checks (§7.7) — the anon-write attempts are read-only in effect (RLS rejects them; nothing is written), but confirm each one's response shows zero rows changed.

**Safe to run after deploy, ONLY with an immediate, verified revert:**
- The one Realtime probe (§8).
- The one admin-write probe (§7.5) — reaffirms an existing value, does not change data.

**Do NOT run against production as-is:**
- The local `tests/e2e/live-data.spec.ts` / prediction-submission flows unmodified — they were written to exercise a disposable local/staging dataset and would leave real, unwanted rows (test predictions, audit entries) in production. If E2E coverage against production is wanted, write a dedicated read-only smoke variant first (§11) rather than pointing the existing write-heavy specs at real data.
- Any script with `db reset` semantics, or anything that assumes a disposable database.

## 11. Post-Deployment Smoke Test (run immediately after §3–§9, before announcing go-live)

| Area | Check |
|---|---|
| Homepage | Loads, correct title, no console errors |
| Navigation | All primary nav links resolve (200, correct page) |
| Teams | `/doi` lists all 3 real teams with logos rendering |
| Players | `/cau-thu` lists all 24 real players; `/cau-thu/18` shows "Xuân Sử" correctly |
| Matches | `/lich-thi-dau` shows the 3 real scheduled matches |
| Standings | `/bang-xep-hang` shows all 3 teams, correct initial 0-played state |
| Predictions | `/du-doan` form renders with real matches/players (do not submit a real test prediction — this is production; reading the form rendering correctly is the check, not submitting) |
| Authentication | Login page reachable; the one real admin bootstrap (§7) succeeds |
| Admin critical paths | `/admin`, `/admin/teams`, `/admin/audit-log` reachable and render correctly for the real admin |
| Assets | At least one real avatar and one real team logo render with no broken-image icon |
| API/DB connectivity | A public REST read (e.g. `teams?select=id`) returns `200` with the expected row count |

## 12. Observability check (not just "the homepage opened")

Check, and record findings for, each of:
- **Supabase Postgres logs** (dashboard → Logs → Postgres) — no unexpected errors during/after migration+seed.
- **PostgREST/API logs** — no unexpected 5xx spikes during the smoke test.
- **Auth logs** — the one real signup + one promotion appear as expected, nothing else unexpected.
- **Storage logs** — the upload batch completed without unexpected failures.
- **Realtime logs** — the one test subscription/event appears and nothing else is misbehaving.
- **Application errors** — browser console + Next.js server logs during the smoke test, clean of new error classes (a known/expected error class must be named and justified, exactly as this project has done at every prior gate — never a blanket "looks fine").

## 13. Automatic STOP / rollback triggers

Any of the following, at any point during this plan's execution, means **stop immediately, do not proceed to the next step, and do not declare success**:

- Linked project ref does not exactly match §0.1's confirmed ref, or matches anything on the blocklist.
- Any migration fails to apply.
- `verify-data-parity.js` reports any mismatch.
- Any RLS/anon-write check succeeds when it should have been denied (a security regression).
- Any critical-path check in §11 fails.
- Auth/RBAC chain (§7) fails at any step.
- Asset upload/parity shows corruption (wrong file count, wrong content-type, wrong bytes).
- A secret is found printed, logged, or staged for commit at any point (`npm run verify:secrets` failing, or manual discovery).

## 14. Human Production Gate (restated)

Every step above through Preflight can be prepared and, where explicitly marked safe, executed by this agent. **No step that mutates the production project (§2 onward) may run without a separate, explicit, per-session Production GO from the product owner** — a general bypass-permissions or auto-approve setting in this agent's tooling is not that authorization and must never be interpreted as one.

## 15. Staging persists after go-live

`ptx-summer-cup-2026-staging` is **never deleted, downgraded, or repurposed** after production go-live. It remains the standing pre-release verification environment for every future change: Development → Local Supabase → Staging → Automated Gates → Human Production Gate → Production.

## 16. Architecture Freeze still applies

Everything in this plan is a deployment/operations procedure. It is **not** grounds to reopen Architecture v1.3: no migration to microservices, no stack change, no large refactor — unless a genuine technical blocker is discovered during execution that makes the frozen architecture provably unworkable (and even then, that would be escalated as a new decision, not silently done).

## Rollback plan

| Trigger | Exact response |
|---|---|
| Migration fails partway through §3 | `supabase migration list --linked` to see exactly which landed. **Correction from an earlier draft of this plan, verified by grepping all 11 files, not assumed:** 2 of the 11 migrations do contain destructive statements — `20260804000004_drop_unused_player_rating_column.sql` (`alter table players drop column rating`) and `20260804000006_drop_stored_prediction_points.sql` (`alter table predictions drop column points`). Both are safe **specifically because this is a first-time deployment to an empty production project** — the column is created earlier in the same 11-migration batch and dropped before any real row could ever populate it, so zero real data is lost. This reasoning stops applying the moment production has real data: any *future* migration must never `DROP COLUMN`/`DROP TABLE` against a table with real rows without an explicit, separately-authorized add→backfill→drop-in-a-later-release sequence (§4's rule). The other 9 migrations are additive only. Fix the failing migration file, re-run `db push --linked` to continue; a partial application is not catastrophic because nothing already-applied is destroyed. |
| Data-correctness problem found after go-live, §0.2(a) chosen (PITR enabled) | `npx supabase backups restore --project-ref <PRODUCTION_REF>` to a point before the bad change (read the live `--help` output for exact flags before use — never assume a flag shape from memory). After restore: re-run the full §10 "safe after deploy" gate set to confirm the restored state is healthy. |
| Data-correctness problem found after go-live, §0.2(b) chosen (alternative backup) | Restore from the most recent dump per the documented cadence in §0.2(b); accept the recorded RPO's worth of data loss. Re-run §10 after restore. |
| A migration itself is found to be destructive and not safely reversible | **Do not deploy it.** Redesign it as a non-destructive, additive change (e.g., add-then-backfill-then-later-drop as three separate migrations across releases, not one), or explicitly escalate for a fresh risk-acceptance decision before this plan may include it. |
| Storage upload partially fails | `scripts/upload-r25-media.js` uses `upsert: true` per file and reports `uploaded/failed` counts — safe to re-run, never duplicates or corrupts already-succeeded files. |
| Application (Next.js) needs to roll back independent of the database | Hosting-platform rollback (e.g., Vercel's instant rollback to the previous deployment) — depends on §0.5's hosting decision, out of scope for this Supabase-focused plan. |
| Any §13 automatic-stop trigger fires | Stop the plan at the current step. Do not proceed. Do not announce go-live. Re-run the Preflight Gate (§1) after the underlying issue is fixed before attempting again. |

## Explicit stop

This plan is **prepared, not executed.** No command in it has been run against any production project in this session. Resuming from here requires: (a) all of §0's decisions locked with real answers, (b) a fresh Preflight Gate pass (§1), and (c) an explicit, separate Production GO authorization.
