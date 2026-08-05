# M14 — Consolidated Production Activation Evidence Report

> Consolidates all M14 evidence to date. Does not repeat work already proven in prior phases — re-verifies only what changed (the deployment identity) or what this directive explicitly required re-checked rather than assumed.

## GitHub

| Item | Evidence |
|---|---|
| Repository identity | `baoanhtran071096-star/PTX_Summer_Cup_2026_web_R25` |
| Visibility | Private — confirmed via unauthenticated `GET https://api.github.com/repos/...` → `404` (re-confirmed this phase, unchanged) |
| Canonical branch | `master` — preserved, never renamed to `main` |
| Local/remote SHA parity | Local `HEAD` = `4ea6de1...` = remote `refs/heads/master` (re-confirmed via `git ls-remote origin master` vs `git rev-parse HEAD`, exact match) |
| Secret-gate result | `npm run verify:secrets`: 0 findings. `.env`/`.env.local`/`.env.production.local`/`.env.staging.local` confirmed never tracked, in current state or full history. No JWT-shaped secret anywhere in history. One benign `${POSTGRES_PASSWORD}`-style template found and inspected — not a real credential |

## Vercel

| Item | Evidence |
|---|---|
| Existing project identity | `ptx-summer-cup-2026-production` (`prj_gIQyuyHeqhvkXLkGAuWizsDuFsoo`) — same ID throughout this entire phase; no duplicate project ever created |
| GitHub integration | Connected via `vercel git connect`; **proven working twice** — two real, non-fabricated commits (`bf7d2e1`, `4ea6de1`) each auto-triggered a build, confirmed via Vercel's own clone log naming the exact commit both times |
| Deployed commit SHA | `4ea6de1...` (current canonical alias target) — confirmed via `vercel inspect ... --logs` → `Cloning ... Commit: 4ea6de1` |
| Canonical production URL | `https://ptx-summer-cup-2026-production.vercel.app` — `200`, confirmed reachable this phase |
| Deployment provenance | Git-triggered (not CLI-uploaded) — confirmed by the presence of a git-branch-specific alias (`ptx-summer-cup-2026-git-5dc961-...`), which only Git-connected deployments receive |

## Supabase

| Item | Evidence |
|---|---|
| Exact Production ref | `tqdsvtuspehavhcygipf` — re-confirmed this phase via `supabase projects list` (`ACTIVE_HEALTHY`) and via the live app's own resolved image URLs (`tqdsvtuspehavhcygipf.supabase.co`, `200 image/jpeg`) |
| Environment binding verification | `vercel env ls production`: all 3 vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) scoped **exclusively** to Production, `Encrypted`. No staging credential present. `SUPABASE_SERVICE_ROLE_KEY` has no `NEXT_PUBLIC_` prefix — server-only by construction |
| Auth URL status | ✅ **Closed — Product Owner Dashboard evidence (not independently agent-verified).** PO reports directly inspecting Supabase Dashboard → `ptx-summer-cup-2026-production` → Authentication → URL Configuration: **Site URL** = `https://ptx-summer-cup-2026-production.vercel.app`, **redirect allow-list** = `https://ptx-summer-cup-2026-production.vercel.app/**`. This is recorded as PO-attested evidence because no safe independent verification path exists: `supabase config` has no read/pull subcommand (push-only, and `config push` was already proven this project to silently regress unrelated Auth security settings — never used against production), no Management API token is available to this agent, and a full source scan confirms the app has no password-reset/OAuth/email-confirmation flow that would exercise this setting functionally. **No CLI/API push was performed to "re-prove" this state, per instruction.** |
| Storage | Re-verified this phase against the current live deployment: player avatar and team logo both `200 image/jpeg` through the real `_next/image` proxy |
| Realtime | Re-verified this phase against the current live deployment, through a real open browser tab: a controlled `matches.status` change (`scheduled → live → scheduled`) on `legacy_id=1` updated the tab live with no manual refresh in both directions; confirmed reverted via REST afterward |
| Auth/RBAC/RLS | RLS matrix re-verified this phase: anon read `teams` → 200/3 rows; anon write `teams` (attempted `ovr:1`) → 0 rows changed, confirmed `ovr` still `89`; anon read `audit_log` → `[]` (admin-only enforced). Full Auth→Profile→RBAC chain (signup→trigger→login→promote→admin write→audit log) was proven end-to-end in the prior GO phase using a disposable account that was then **completely deleted** — no synthetic identity persists as a real admin |

## Backup

| Item | Evidence |
|---|---|
| Workflow identity | `.github/workflows/production-backup.yml.draft` — still a draft, **not promoted to `.yml`**, per instruction not to activate before the audit below is complete and the repo connection proven |
| Permissions/security audit | Completed prior phase: added explicit `permissions: contents: read` (previously relied on default `GITHUB_TOKEN` scope) |
| Production identity guard | Workflow hardcodes `tqdsvtuspehavhcygipf` and aborts if the linked ref differs — same guard pattern used throughout this project |
| Scheduled + manual dispatch | Both present (`schedule: cron '0 2 * * *'`, `workflow_dispatch: {}`) |
| Dump failure handling | `supabase db dump` runs under the job's default fail-fast shell; a failed dump fails the step |
| Integrity validation | Non-empty check, `pg_dump` header check, `CREATE EXTENSION` count check — all fail the run explicitly if not satisfied |
| Artifact upload / private accessibility | `actions/upload-artifact@v4` — private-repo artifacts are only downloadable by accounts with repo read access (confirmed private, above) |
| Retention | `retention-days: 90` — well within the private-repo 400-day ceiling (verified against GitHub's own docs in the prior phase, not assumed) |
| Restoration usability | Mechanism already proven end-to-end in M13 via a disposable Docker scratch container (restore succeeded, extensions verified present post-restore, scratch container destroyed) — not re-run this phase since nothing about the dump format has changed and re-running would not produce new information, per the instruction not to repeat completed work merely to generate new evidence |
| No backup artifact committed to Git | Confirmed via the same full-history secret/artifact scan above — nothing `.sql`/dump-shaped found in tracked files or history |
| **Execution result** | ⏳ **Not executed.** The workflow cannot run for real without `SUPABASE_ACCESS_TOKEN` in GitHub Secrets, which requires the product owner's own Supabase Dashboard access to generate. This agent cannot generate a Supabase Personal Access Token on the product owner's behalf. **This gate remains open** |

## Application

| Item | Evidence |
|---|---|
| E2E | Re-run this phase against the **current** live deployment (`baseURL` temporarily pointed at the real public URL, reverted via `git checkout` afterward): **24/24 passed** |
| Accessibility | Included in the same run — all 9 real-data page scans, 0 violations |
| Build/static gates | Re-run this phase: `typecheck` 0 errors, `lint` 0 errors, `verify:architecture` OK (11 domain/7 component files), `verify:design-tokens` OK, `test:unit` 51/51, `build` succeeds (22 routes), `verify:secrets` 0 findings, `test:legacy` 15/16 (the one known, pre-existing, already-documented M-01 baseline artifact — not re-investigated or "fixed" merely to reach 16/16, per explicit instruction) |
| Public production verification | `https://ptx-summer-cup-2026-production.vercel.app` → `200`; data parity re-confirmed (`teams 3/3, players 24/24, matches 3/3`) |

## Operations

| Item | Status |
|---|---|
| First-real-admin status | ✅ **PASS.** Real identity created by the PO via Supabase Dashboard; 8-point pre-promotion gate passed; one-time `viewer→admin` PATCH performed and 8-point post-promotion verification passed; PO logged in personally (session/password never seen by this agent); full runtime chain proven — `/admin` authorization, one real controlled Server Action (with a reported two-Save-attempts deviation, preserved exactly, entries for two different team entity IDs `x` and `p`), correctly-attributed `audit_log` entries, no RLS/RBAC/data regression. Full detail: `docs/m14-first-admin-promotion-evidence.md` |
| Production backup status | ⏳ **Audited, not yet executed.** Workflow (`production-backup.yml.draft`) passed a 10-point pre-execution audit (target guard, staging/denylist isolation, no dump in Git, least-privilege permissions, no secret echo, artifact scoped to one file, retention within verified quota, no-mutation-on-failure, manual dispatch present). GitHub Free-plan quotas re-verified via GitHub's own docs (not assumed): 500 MB artifact storage / 2,000 min/month — real dump size ≈4 KB, 90 days of daily retention ≈270 KB, ~1,800x under quota. **Blocked on `SUPABASE_ACCESS_TOKEN`**, an account-level secret only the PO can generate and provision. Full detail: `docs/m14-backup-architecture.md` |
| Production log-review status | ⏳ **Not completed.** Checklist ready at `docs/m14-log-review-checklist.md`. This agent has no CLI/API path to Auth/API/Storage/Realtime request-level logs; only the Supabase Dashboard's Logs Explorer has them. **This gate cannot be marked PASS without the product owner's explicit confirmation, per the checklist's own stated evidence requirement** |
| Remaining Product Owner actions | See below |

## Remaining Product Owner actions (exact, minimum)

1. ~~Auth Site URL / redirect config~~ — **done**, confirmed via Dashboard inspection (see Supabase table above).
2. ~~First real admin identity~~ — **done**, gate PASS (see Operations table above).
3. **`SUPABASE_ACCESS_TOKEN` for the backup workflow** — generate via Supabase Dashboard → Account → Access Tokens, add it to GitHub repo Settings → Secrets and variables → Actions, named exactly `SUPABASE_ACCESS_TOKEN`. Confirm to this agent once added — it has not yet been confirmed as provisioned.
4. **Log review** — review the Supabase Dashboard's Logs Explorer per `docs/m14-log-review-checklist.md` (Postgres/API/Auth/Storage/Realtime) and report findings, distinguishing expected test/4xx/RLS-denial activity from unexplained errors.

## Certification Rule Applied

Per the explicit instruction, M14 is **not** declared certified merely because GitHub, Vercel, Auth, and first-admin are individually sound. Two gates remain open with real, stated blockers (backup execution, log review). None of these are fabricated as PASS.

## Terminal State

# M14 PRODUCTION ACTIVATION — NOT YET CERTIFIED

**Remaining blockers, exactly:**
1. Backup workflow is fully designed and audited, but has never executed — blocked on one GitHub Secret (`SUPABASE_ACCESS_TOKEN`) requiring product-owner action, not yet confirmed as provisioned.
2. Production log review has not been performed/confirmed by the product owner.

Everything else in this report — GitHub connection, Vercel Git integration (proven twice with real commits), Supabase production binding, Auth URL (PO-attested), First Real Admin (PASS), Storage, Realtime, RLS, E2E, accessibility, static/build gates, and the backup architecture/audit — has real, evidence-backed status and is not blocking further progress once the two items above are resolved.
