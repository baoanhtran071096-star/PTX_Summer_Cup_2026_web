# M13 — Production Deployment Plan (NOT YET AUTHORIZED)

> **Status: STOP — awaiting explicit Production GO.** This plan is prepared per the M13 Final Production Requirements directive. Every command below targets the **production** Supabase project `ptx-summer-cup-2026-production` (ref `tqdsvtuspehavhcygipf`). **None of this plan has been executed.** Passing every gate in this document does not itself authorize execution — that requires a separate, explicit Production GO from the product owner (§15). Bypass/auto-approve permissions this agent may hold in its tooling are **not** a substitute for that human decision and must never be treated as one.

Prerequisite reading: `docs/gates/m13-staging-evidence.md` (what was verified on staging and how), `docs/gates/m12.5-evidence.md` (the certified RC baseline this plan deploys), `docs/m13-final-production-requirements-audit.md` (gap audit this version closes), `docs/m13-production-deployment-blocked-incident.md` (why the first candidate ref was invalidated and replaced).

## 0. Decisions — all 4 LOCKED

### 0.1 Production project identity — **LOCKED (re-locked after the prior ref was revoked)**

- **Approved production ref: `tqdsvtuspehavhcygipf`** (name `ptx-summer-cup-2026-production`, region Southeast Asia/Singapore) — explicitly confirmed by the product owner as a newly-created, dedicated project for this application, after the first candidate (`wmamuqylqqikvseuqerm`, matched only by a similar name) was found to belong to someone else.
- **Transcription correction on record:** the product owner's message first stated the ref as `tqdsvtuspehavhcygjpf` (one character off — `j` vs `i`). This was caught by comparing it character-for-character against the actual `supabase projects list` output rather than accepting it on trust, flagged back to the product owner, and explicitly corrected. **`tqdsvtuspehavhcygjpf` (with a `j`) does not correspond to any real project and must never be used** — it is neither the production ref nor on the denylist, it simply doesn't exist; any command that would target it should fail to resolve rather than silently hitting something unintended.
- **Permanent denylist — these refs must NEVER be a target of any PTX command, under any circumstance:**
  - `wmamuqylqqikvseuqerm` — **PROTECTED, permanently out of scope.** Confirmed by the product owner to belong to a different, unrelated project. No migration, seed, reset, truncate, delete, or any other mutating command may ever target this ref, regardless of what its name suggests.
  - `bugqhoktzzdvduzfjctm` — this project's own staging environment (`ptx-summer-cup-2026-staging`); valid for staging commands only, never for a production command.
  - `dbnsaqczauxcriibwubg` — unrelated inactive project, no known relationship to this work.
- **Every guard block in this plan checks the target ref against both the confirmed production ref AND this denylist.** A name match alone is not sufficient — the incident that revoked the first candidate ref happened precisely because a plausible name was trusted without independently checking the project's actual data/schema state. §1 row 3 (independent data/schema verification) is mandatory for `tqdsvtuspehavhcygipf` too, not skipped just because it's newly created and reported empty.

### 0.2 Backup & Disaster Recovery — LOCKED (alternative strategy, no PITR)

**Decision:** No PITR. The following alternative strategy is adopted, explicitly:

- **Cadence:** daily automated database dump, **plus** a mandatory dump immediately before every production deployment/migration, **plus** a mandatory dump immediately before any high-risk admin bulk change (e.g. a bulk teams/players edit, not routine single-row edits).
- **RPO:** ≤ 24h for normal day-to-day operation; **≈ 0** for controlled deployments/migrations and admin bulk changes, because those are always preceded by their own fresh dump.
- **RTO:** ≤ 2h (manual restore from the most recent valid dump).
- **Integrity requirements (all mandatory, not optional):** every dump is timestamped; stored **outside** the production database (a separate bucket/storage location, not co-located with what it's backing up); integrity-checked immediately after creation (e.g. verify the dump file is non-empty and restorable, not just "the command exited 0"); and periodically restore-tested on a non-production target (e.g. against a scratch project or local Supabase) to confirm the dump is actually usable, not just present.
- **Hard gate:** production deployment/migration is **BLOCKED** if the pre-deployment backup or its integrity verification fails. This is enforced in §1 (Preflight Gate) and §3 (a new mandatory pre-migration backup step) below — not left as a suggestion.
- **Risk formally accepted by the product owner:** up to 24h of data loss in an *un-managed* disaster scenario between scheduled dumps (mitigated to ≈0 for the deployment/migration/bulk-change scenarios that actually carry the highest risk), and up to 2h of downtime during a restore.

### 0.3 Production Seed Policy — LOCKED, accepted as-is

Verified factually against the current `supabase/seed.sql` (not asserted):

- **Allowlist — the only data this plan seeds into production:** 3 teams (`p`/`t`/`x`, from the certified R25 extraction), 24 players, 3 scheduled matches, 1 Hall of Fame year (2025), 1 tournament-settings row (slogan/message/date/location) — all traceable to `docs/migration/r25-extracted.json`, the frozen extraction manifest already parity-verified against local and staging.
- **Blocklist — confirmed absent from `seed.sql`, and must never be added:** `SAMPLE_PREDICTIONS` or any fake prediction data (approved-dropped per `docs/migration/r25-approved-deprecation-registry.md` entry #1); any test/demo/synthetic admin or user account (in particular, the M13 staging verification account `m13-staging-verification@ptxsummercup2026.test` is **staging-only** and must never be created in production); any record whose name/content contains `sample`, `demo`, `test`, or `fake` (verified via `grep -in` against `seed.sql` before every seed run, not just once here).

### 0.4 Team T/X lost assets — LOCKED, no change from M12.5

- Reconfirmed: no replacement photos have been supplied. Team T and Team X's legacy group-lineup photos remain permanently unrecoverable (`SOURCE_LOST_PENDING_REPLACEMENT`), the capability is preserved (not deprecated), no fabricated/placeholder image is ever substituted, and any future gallery UI must degrade gracefully (omit the slot, no broken `<img>`) until a real replacement is supplied.
- No gallery display page exists yet in the codebase (confirmed in M12.5 — M09 scoped only avatar/logo wiring), so there is nothing in the current UI that could render a broken image for these two assets. Production launches without them, as designed.

### 0.5 Other prerequisites (still open — not part of the 4 locked decisions)

- Custom domain / DNS / Next.js app hosting target — out of scope for this Supabase-focused plan; needs its own separate decision.
- Production `[auth]` `site_url`/redirect URLs must be set to the real domain (§9) — cannot be finalized without §0.5's hosting decision.

---

## 1. Preflight Gate (ALL must show PASS before step 2 — no exceptions)

| # | Check | Command / method | Pass condition |
|---|---|---|---|
| 1 | Git state matches an approved, reviewed commit | `git status --short` (must be empty or only expected untracked docs), `git log -1 --format=%H` (record the SHA being deployed) | Working tree clean; SHA recorded in this plan before proceeding |
| 2 | Production ref confirmed by name AND not on the permanent denylist | `npx supabase projects list`, compare against §0.1's confirmed ref, verify it is NOT `wmamuqylqqikvseuqerm`, `bugqhoktzzdvduzfjctm`, or `dbnsaqczauxcriibwubg` | Exact match to §0.1's confirmed ref; denylist check passes. **A name match is not sufficient on its own** — row 3 below must also pass before this row can be considered satisfied |
| 3 | Current database state independently verified to be empty/owned by this project — not just a name match | Read-only REST checks (service-role key) against `teams`, `players`, `matches`, `profiles`, and any other table this app's migrations would create; also check row counts and sample content, not just existence | Either 0 rows in every table (fresh project) or, if rows exist, they are verifiably this application's own previously-deployed data (schema and content match `docs/migration/r25-extracted.json`) — **any unexpected data or schema, no matter how plausible-looking, is an automatic STOP** (this is exactly the check that caught `wmamuqylqqikvseuqerm`) |
| 4 | Migration history is exactly what's expected | `npx supabase migration list --linked` (after linking in §2) compared against `ls supabase/migrations/` | Remote has either 0 migrations (fresh project) or a strict prefix of the local list — never a migration locally that isn't in the committed history, and never a remote migration absent locally |
| 5 | Environment variables present and correctly scoped | Confirm `.env.production.local` exists, is gitignored (`git check-ignore`), and is **not** the same file/values as `.env` or `.env.staging.local` | All three conditions true |
| 6 | Secret scan clean | `npm run verify:secrets` | 0 findings |
| 7 | Fresh pre-deployment backup taken and integrity-verified | Per §0.2's locked policy: take a dump, timestamp it, store it outside the production project, verify it's non-empty and restorable | Dump exists, timestamped, integrity check passes — **if this fails, STOP; do not proceed to step 2 under any circumstance** |
| 8 | Rollback prerequisites available | `psql -f <dump>` restore mechanism actually exercised against a disposable, isolated scratch Postgres container (never against production/staging/local-dev) — see `docs/m13-production-preflight-results.md` "Row 8" for the exact commands and result | ✅ Verified — restore executed with 0 errors; post-restore query confirmed all 4 extensions and the schema comment genuinely present, not just that the SQL parsed. Scratch container destroyed after. No production credential was used or needed for this test |

**If any row fails: STOP. Do not proceed to step 2.**

## 2. Link to production (identity-guarded)

```bash
npx supabase link --project-ref tqdsvtuspehavhcygipf --yes
LINKED=$(cat supabase/.temp/project-ref)
if [ "$LINKED" != "tqdsvtuspehavhcygipf" ] || [ "$LINKED" = "wmamuqylqqikvseuqerm" ] || [ "$LINKED" = "bugqhoktzzdvduzfjctm" ] || [ "$LINKED" = "dbnsaqczauxcriibwubg" ]; then
  echo "ABORT: linked ref ($LINKED) failed identity guard"; exit 1
fi
```
Re-run this exact guard block (re-reading `supabase/.temp/project-ref`, re-checking against both the confirmed ref and the full permanent denylist above, **including `wmamuqylqqikvseuqerm`**) immediately before every subsequent mutating command in this plan — not just once here. This mirrors the discipline already used and proven in the staging phase (`docs/gates/m13-staging-evidence.md` §0), strengthened after the incident recorded in `docs/m13-production-deployment-blocked-incident.md`: a name match is necessary but not sufficient — §1 row 3's independent data/schema check must also pass, every time, for whatever ref is linked.

## 3. Mandatory pre-migration backup (per the locked §0.2 policy — blocking, not optional)

Take a fresh dump **immediately before** running any migration, even if the Preflight Gate's dump (§1, row 7) was recent — migrations are exactly the "controlled deployment" scenario §0.2 targets for ≈0 RPO. Verify its integrity the same way as §1 row 7. **If this backup or its verification fails, STOP — do not proceed to §4.**

## 4. Migrate schema

```bash
npx supabase db push --linked --dry-run   # review the exact migration list before applying — must match supabase/migrations/ exactly
npx supabase db push --linked --yes
npx supabase migration list --linked      # confirm local == remote
```

## 5. Deterministic-migrations rule (no exceptions)

If a production-only issue is discovered at any point (before, during, or after this deployment) that appears to need a direct database change: **it must be authored as a new migration file, committed to this repository, reviewed, and deployed through this same `db push` mechanism.** A live `psql`/dashboard SQL-editor edit that isn't represented in `supabase/migrations/` is prohibited — it silently diverges production from the committed, staging-verified history and breaks the reproducibility this entire M12.5/M13 process was built to prove.

## 6. Seed production data (per the locked §0.3 policy only)

The pre-migration backup (§3) already covers this step — seeding happens in the same session immediately after migration, so no separate dump is needed here, only the same care:

```bash
grep -in "sample\|demo\|test\|fake" supabase/seed.sql   # must return nothing — re-verify immediately before use, not just once in this doc
npx supabase db push --linked --include-seed --yes
node --env-file=.env.production.local scripts/verify-data-parity.js   # must print PARITY OK
```

**If parity check fails: STOP.** Do not proceed to §7. Any record or asset that genuinely cannot migrate must be added to `docs/migration/r25-approved-deprecation-registry.md` with an explicit entry and rationale — never silently dropped or left unexplained.

## 7. Provision Storage + verify real delivery (not just "upload succeeded")

Create the 5 buckets via the Storage Admin API directly (not `supabase config push` — see the staging evidence, §5, for why: it would also overwrite `[auth]` site URLs with local-dev values).

```bash
node --env-file=.env.production.local scripts/upload-r25-media.js --out=docs/migration/r25-production-upload-result.json
node --env-file=.env.production.local scripts/apply-uploaded-media-paths.js
```

Then **actually fetch** at least one real object per bucket type used (not just trust the upload count):

```bash
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" "https://tqdsvtuspehavhcygipf.supabase.co/storage/v1/object/public/player-avatars/xuan-su.webp"
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" "https://tqdsvtuspehavhcygipf.supabase.co/storage/v1/object/public/team-logos/bieu-tuong-doi-p-phoenix-.webp"
```
Both must return `200` with the correct `content_type`. Also confirm bucket public/private access matches `config.toml` (all 5 buckets are `public = true`, read-only for anon — verify no bucket is accidentally left private or accidentally writable by anon).

## 8. Auth → Profile / RBAC production verification (exact chain, post-deploy)

1. First real admin signs up normally through the deployed app (not the Admin API shortcut used for staging's disposable test account — production's first admin should be a real person, per §10).
2. Confirm `public.profiles` row auto-created with `role = 'viewer'`.
3. Promote via **one** service-role `PATCH` to `role = 'admin'` — run once, by a human holding the production service-role key, not scripted into something re-runnable by accident.
4. Confirm login issues a real JWT; confirm admin UI is reachable.
5. Confirm the promoted admin's own JWT (not service_role) can perform an admin write (e.g. re-affirm a team's existing captain_name — a harmless, idempotent write, not a data change).
6. Confirm the resulting `audit_log` row appears on `/admin/audit-log`.
7. Confirm anon read/write matrix matches the RLS contract: anon can read public tables, cannot write any of them, cannot read `audit_log`.

## 9. Realtime production verification (controlled, reverted)

```bash
# Subscribe to postgres_changes on public.matches, then:
# 1. Trigger one harmless UPDATE (e.g. matches.status: 'scheduled' -> 'live' on a match that hasn't started)
# 2. Confirm the event arrives with the correct payload
# 3. Immediately revert (status back to 'scheduled')
# 4. Confirm the reverted state persisted — no test artifact left behind
```
Exact script pattern already proven against staging in `docs/gates/m13-staging-evidence.md` §6 — reuse it, pointed at the production connection.

## 10. Production-specific Auth configuration

Set `[auth]` `site_url` and `additional_redirect_urls` to the real production domain via the Supabase dashboard/Management API — never via a blanket `config.toml` push (still contains `127.0.0.1` dev values). Depends on §0.5's hosting decision being resolved first.

## 11. Full Production Certification Gate (categorized — do not run the wrong category against real data)

**Safe to run before deploy (static, no live data touched):**
```bash
npm run typecheck && npm run lint && npm run verify:architecture && npm run verify:design-tokens && npm run verify:secrets && npm run test:unit && npm run build
```

**Safe to run after deploy, read-only against real production data:**
- Accessibility scan (`@axe-core/playwright`) against the live production homepage and a couple of real content pages.
- Data-parity check (`scripts/verify-data-parity.js`) — read-only.
- RLS matrix checks (§8.7) — the anon-write attempts are read-only in effect (RLS rejects them; nothing is written), but confirm each one's response shows zero rows changed.

**Safe to run after deploy, ONLY with an immediate, verified revert:**
- The one Realtime probe (§9).
- The one admin-write probe (§8.5) — reaffirms an existing value, does not change data.

**Do NOT run against production as-is:**
- The local `tests/e2e/live-data.spec.ts` / prediction-submission flows unmodified — they were written to exercise a disposable local/staging dataset and would leave real, unwanted rows (test predictions, audit entries) in production. If E2E coverage against production is wanted, write a dedicated read-only smoke variant first (§12) rather than pointing the existing write-heavy specs at real data.
- Any script with `db reset` semantics, or anything that assumes a disposable database.

## 12. Post-Deployment Smoke Test (run immediately after §4–§10, before announcing go-live)

| Area | Check |
|---|---|
| Homepage | Loads, correct title, no console errors |
| Navigation | All primary nav links resolve (200, correct page) |
| Teams | `/doi` lists all 3 real teams with logos rendering |
| Players | `/cau-thu` lists all 24 real players; `/cau-thu/18` shows "Xuân Sử" correctly |
| Matches | `/lich-thi-dau` shows the 3 real scheduled matches |
| Standings | `/bang-xep-hang` shows all 3 teams, correct initial 0-played state |
| Predictions | `/du-doan` form renders with real matches/players (do not submit a real test prediction — this is production; reading the form rendering correctly is the check, not submitting) |
| Authentication | Login page reachable; the one real admin bootstrap (§8) succeeds |
| Admin critical paths | `/admin`, `/admin/teams`, `/admin/audit-log` reachable and render correctly for the real admin |
| Assets | At least one real avatar and one real team logo render with no broken-image icon |
| API/DB connectivity | A public REST read (e.g. `teams?select=id`) returns `200` with the expected row count |

## 13. Observability check (not just "the homepage opened")

Check, and record findings for, each of:
- **Supabase Postgres logs** (dashboard → Logs → Postgres) — no unexpected errors during/after migration+seed.
- **PostgREST/API logs** — no unexpected 5xx spikes during the smoke test.
- **Auth logs** — the one real signup + one promotion appear as expected, nothing else unexpected.
- **Storage logs** — the upload batch completed without unexpected failures.
- **Realtime logs** — the one test subscription/event appears and nothing else is misbehaving.
- **Application errors** — browser console + Next.js server logs during the smoke test, clean of new error classes (a known/expected error class must be named and justified, exactly as this project has done at every prior gate — never a blanket "looks fine").

## 14. Automatic STOP / rollback triggers

Any of the following, at any point during this plan's execution, means **stop immediately, do not proceed to the next step, and do not declare success**:

- Linked project ref does not exactly match §0.1's confirmed ref, or matches anything on the permanent denylist — **`wmamuqylqqikvseuqerm` above all**, confirmed to belong to a different project; no exception, no override, ever.
- Any table this application would create already contains data or a schema that doesn't match this application (§1 row 3) — regardless of how plausible the project's name looks.
- The mandatory pre-deployment or pre-migration backup (§1 row 7, §3), or its integrity verification, fails.
- Any migration fails to apply.
- `verify-data-parity.js` reports any mismatch.
- Any RLS/anon-write check succeeds when it should have been denied (a security regression).
- Any critical-path check in §12 fails.
- Auth/RBAC chain (§8) fails at any step.
- Asset upload/parity shows corruption (wrong file count, wrong content-type, wrong bytes).
- A secret is found printed, logged, or staged for commit at any point (`npm run verify:secrets` failing, or manual discovery).

## 15. Human Production Gate (restated)

Every step above through the Preflight Gate can be prepared and, where explicitly marked safe, executed by this agent. **No step that mutates the production project (§2 onward) may run without a separate, explicit, per-session Production GO from the product owner** — a general bypass-permissions or auto-approve setting in this agent's tooling is not that authorization and must never be interpreted as one.

## 16. Staging persists after go-live

`ptx-summer-cup-2026-staging` is **never deleted, downgraded, or repurposed** after production go-live. It remains the standing pre-release verification environment for every future change: Development → Local Supabase → Staging → Automated Gates → Human Production Gate → Production.

## 17. Architecture Freeze still applies

Everything in this plan is a deployment/operations procedure. It is **not** grounds to reopen Architecture v1.3: no migration to microservices, no stack change, no large refactor — unless a genuine technical blocker is discovered during execution that makes the frozen architecture provably unworkable (and even then, that would be escalated as a new decision, not silently done).

## Rollback plan

| Trigger | Exact response |
|---|---|
| Migration fails partway through §4 | `supabase migration list --linked` to see exactly which landed. **Correction from an earlier draft of this plan, verified by grepping all 11 files, not assumed:** 2 of the 11 migrations do contain destructive statements — `20260804000004_drop_unused_player_rating_column.sql` (`alter table players drop column rating`) and `20260804000006_drop_stored_prediction_points.sql` (`alter table predictions drop column points`). Both are safe **specifically because this is a first-time deployment to an empty production project** — the column is created earlier in the same 11-migration batch and dropped before any real row could ever populate it, so zero real data is lost. This reasoning stops applying the moment production has real data: any *future* migration must never `DROP COLUMN`/`DROP TABLE` against a table with real rows without an explicit, separately-authorized add→backfill→drop-in-a-later-release sequence (§5's rule). The other 9 migrations are additive only. Fix the failing migration file, re-run `db push --linked` to continue; a partial application is not catastrophic because nothing already-applied is destroyed. |
| Data-correctness problem found after go-live | Restore from the most recent valid dump — either the mandatory pre-migration dump (§3) if the problem stems from the deployment itself (≈0 data loss, since that dump was taken immediately before), or the most recent daily dump for anything unrelated to this deployment (accept up to 24h data loss per the locked §0.2 risk acceptance). Restore mechanism (`psql -f <dump>`) has been verified end-to-end against a disposable scratch target (Preflight §1 row 8, `docs/m13-production-preflight-results.md`) — restoring into the actual production project requires production database credentials, held separately by whoever performs the restore; this agent session deliberately never held them. After restore: re-run the full §11 "safe after deploy" gate set to confirm the restored state is healthy, and re-run `verify-data-parity.js`. |
| A migration itself is found to be destructive and not safely reversible (relevant to any *future* release once production holds real data) | **Do not deploy it.** Redesign it as a non-destructive, additive change (e.g., add-then-backfill-then-later-drop as three separate migrations across releases, not one), or explicitly escalate for a fresh risk-acceptance decision before this plan may include it. |
| Storage upload partially fails | `scripts/upload-r25-media.js` uses `upsert: true` per file and reports `uploaded/failed` counts — safe to re-run, never duplicates or corrupts already-succeeded files. |
| Application (Next.js) needs to roll back independent of the database | Hosting-platform rollback (e.g., Vercel's instant rollback to the previous deployment) — depends on §0.5's hosting decision, out of scope for this Supabase-focused plan. |
| Any §14 automatic-stop trigger fires | Stop the plan at the current step. Do not proceed. Do not announce go-live. Re-run the Preflight Gate (§1) — including a fresh backup — after the underlying issue is fixed before attempting again. |

**Post-rollback verification (mandatory after any restore):** re-run §11's post-deploy-safe gates in full, re-confirm the Preflight Gate's identity guard still resolves to the correct production ref, and re-run the Post-Deployment Smoke Test (§12) before re-declaring the system healthy.

## Explicit stop

This plan is **prepared, not executed.** No command in it has ever mutated any production project. §0.1's production identity was locked once against `wmamuqylqqikvseuqerm`, **revoked** after identity/state verification found that project already belonged to someone else (`docs/m13-production-deployment-blocked-incident.md`), and **re-locked** against a newly-created, dedicated project: `tqdsvtuspehavhcygipf` (`ptx-summer-cup-2026-production`).

Resuming past this point still requires:

1. §1's full Preflight Gate — **including row 3's independent data/schema check** against `tqdsvtuspehavhcygipf`, not just trusting that it's newly created — to pass in full.
2. A fresh, explicit, separate Production GO authorization from the product owner, given after reviewing the Preflight Gate results.

Staging (`ptx-summer-cup-2026-staging`) is unaffected and remains available for continued verification in the meantime. `wmamuqylqqikvseuqerm` remains permanently denylisted and out of scope regardless of any future instruction that doesn't explicitly and separately re-authorize touching it.
