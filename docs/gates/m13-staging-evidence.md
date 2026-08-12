# M13 — Pre-Production/Staging Readiness — Gate Evidence

## Status: PASS

Verified the certified M12.5 Release Candidate against a **real, non-production Supabase Cloud project** — `ptx-summer-cup-2026-staging` (ref `bugqhoktzzdvduzfjctm`, org `dpgiiwquogbgskyjeetv`, region `ap-southeast-1`) — not the local Docker stack. The M12.5 local baseline (`.env`, committed migrations, seed, evidence) was **not modified**; this phase only adds new evidence and two new artifacts (`docs/migration/r25-staging-upload-result.json`, this document, the deployment/rollback plan).

## 0. Project identity verification (performed before every mutating command)

`supabase projects list` was used to resolve the name `ptx-summer-cup-2026-staging` → ref `bugqhoktzzdvduzfjctm` once, at the start of this phase. That literal ref was hardcoded into every subsequent guard check (`cat supabase/.temp/project-ref` compared against it, aborting on mismatch) before any `link`, `db push`, `db reset`, or destructive operation. The org also contains `ptx-summer-cup-2026` (ref `wmamuqylqqikvseuqerm`, no `-staging` suffix — the production project) and an unrelated inactive project — neither was ever addressed by any command in this phase. No command in this phase took a `--project-ref` value from anywhere other than this one verified, hardcoded string.

## 1. Migrations

| Check | Result |
|---|---|
| `supabase link --project-ref bugqhoktzzdvduzfjctm --yes` | ✅ Linked; confirmed via `supabase/.temp/project-ref` |
| `supabase db push --linked --dry-run` | ✅ All 11 migrations pending (fresh project, 0 previously applied) |
| `supabase db push --linked --yes` (real) | ✅ All 11 migrations applied cleanly |
| `supabase migration list --linked` | ✅ Local and remote migration history match exactly, all 11 entries |

## 2. Seed / data parity

| Check | Result |
|---|---|
| `supabase db push --linked --include-seed --yes` | ✅ `supabase/seed.sql` applied |
| `node scripts/verify-data-parity.js` (against staging) | ✅ **PARITY OK** — teams 3/3, players 24/24, matches 3/3, all fields match the frozen M-02 extraction manifest exactly |

## 3. PostgreSQL grants + RLS (behavioral, not just policy review)

| Check | Result |
|---|---|
| Anon read `teams` | ✅ 200, 3 rows |
| Anon write `teams` (PATCH) | ✅ RLS silently rejects — 0 rows matched, no data changed (confirmed via service-role re-read) |
| Anon write `players` | ✅ Same — no-op |
| Anon write `matches` | ✅ Same — no-op |
| Anon write `profiles` (attempted self-promotion to admin) | ✅ Same — no-op |
| Anon read `audit_log` | ✅ `[]` — admin-only RLS enforced |

Confirms migration `20260804000010_grant_table_privileges.sql` (the M12.5-discovered missing-GRANTs fix) and all RLS policies are correctly active on the real cloud Postgres instance, not just locally.

## 4. Auth → Profile / RBAC (real signup, not a fixture)

1. Created a real test user via the Auth Admin API (`/auth/v1/admin/users`, `email_confirm: true` — avoids depending on GoTrue's hosted email-deliverability validation, which rejects non-MX-verifiable domains like `.invalid`/`example.com` that work fine against local Supabase).
2. **Trigger fired**: `public.profiles` row auto-created, `role = 'viewer'` — confirms migration `20260804000011_auto_create_profile_on_signup.sql` works on the real hosted Auth service, not just local.
3. Signed in as this user via `/auth/v1/token?grant_type=password` — real session, real JWT.
4. Promoted to `admin` via the legitimate one-time service-role bootstrap PATCH (same pattern as local/M12.5 — no one has admin yet to grant it through the app).
5. **Using the promoted user's own real JWT** (not service_role): successfully wrote to `teams` — proves RLS grants access based on the real `profiles.role` value, not merely bypassing via service_role.
6. Logged in through the actual app UI (`/dang-nhap`) as this account, edited Team P via `/admin/teams`, and confirmed a real `audit_log` row appeared on `/admin/audit-log` — the full application-level flow (Server Action → DB write → audit write → RLS-gated read → UI render), not just raw REST calls.

## 5. Storage

| Check | Result |
|---|---|
| Buckets provisioned (`team-logos`, `player-avatars`, `gallery`, `operations-media`, `branding`) | ✅ Created via Storage Admin API, matching `supabase/config.toml` exactly (file size limits, allowed MIME types) — **not** via `supabase config push`, since that would also overwrite staging's `[auth]` `site_url`/`additional_redirect_urls` with local-dev values (`127.0.0.1`), which is wrong for a real shared environment |
| `scripts/upload-r25-media.js` (real, against staging) | ✅ 53/53 files uploaded, 0 failed |
| `scripts/apply-uploaded-media-paths.js` | ✅ 24/24 player + 3/3 team paths updated |
| Real public image fetch | ✅ `https://bugqhoktzzdvduzfjctm.supabase.co/storage/v1/object/public/player-avatars/xuan-su.webp` → `200 OK`, `image/webp`, 24144 bytes |
| Next.js image optimizer against the real host | ✅ `/_next/image?url=https://bugqhoktzzdvduzfjctm.supabase.co/...` → `200 OK` — confirms the M12.5 `images.unoptimized` local-IP-only workaround correctly does **not** engage against a real hostname; full Next.js image optimization is active, exactly as it will be in production |
| Team T/X group photos | Not re-attempted this phase (already confirmed permanently dead in M12.5, `SOURCE_LOST_PENDING_REPLACEMENT`, product-owner approved) — Team P's recovered photo was re-uploaded to staging `gallery` for consistency |

## 6. Realtime

Subscribed to `postgres_changes` on `public.matches`, triggered a real `UPDATE` (status → `live`) via service_role, and received the event with the correct payload within seconds; reverted to `scheduled` and received that event too. Confirmed the reverted state persisted correctly. Proves migration `20260804000007_enable_realtime.sql`'s publication config works against the real hosted Realtime service.

## 7. E2E + Accessibility

The app was pointed at staging via a temporary `.env.local` (Next.js's built-in override file, gitignored, never committed) — the certified `.env` (local M12.5 baseline) was never edited. Full Playwright suite re-run against the live staging-backed dev server:

**24/24 passing** — identical spec set to M12.5 (`navigation.spec.ts`, `theme.spec.ts`, `accessibility.spec.ts` incl. the 9 real-data routes, `live-data.spec.ts`). No new violations; the M12.5 OVR-badge contrast fix holds against staging-rendered content too.

`.env.local` was deleted after this phase and the local dev server restarted — confirmed via network inspection that it now serves from `127.0.0.1:54321` (local stack) again, not staging.

## 8. Full regression gate (re-run against staging config)

| Gate | Result |
|---|---|
| `npm run typecheck` | ✅ 0 errors |
| `npm run lint` | ✅ 0 errors |
| `npm run verify:architecture` | ✅ 11 domain, 7 component files, 0 violations |
| `npm run verify:design-tokens` | ✅ 0 hardcoded colors |
| `npm run verify:secrets` | ✅ 284 tracked files, 0 findings |
| `npm run test:unit` | ✅ 51/51 |
| `npm run build` | ✅ succeeds, 22 routes, correct static/dynamic split, image optimizer active (no `unoptimized` bypass) |
| `npm run test:legacy` | ✅ 15/15 (1 known non-blocking harness artifact, unchanged since M-01 baseline — not Supabase-related, this suite tests the frozen legacy static site) |

## 9. Security review

- `.env.staging.local` and `.env.local` (both containing real staging keys during this phase) are covered by existing `.gitignore` patterns (`.env.*.local`) — confirmed via `git check-ignore` before and after use.
- Raw secret material was never printed to a visible tool-output stream: API keys were fetched via `supabase projects api-keys --reveal --output json`, redirected straight to a local file, parsed by a script that only logs boolean presence checks, then the raw dump file was deleted.
- `git status`/`git diff` reviewed at the end of this phase: no secret ever entered a tracked file; the only untracked addition is `docs/migration/r25-staging-upload-result.json` (bucket/key/path metadata, no secrets — same shape as the already-committed local equivalent).
- RLS/grants behavior re-verified directly against staging (§3), not assumed from local results.
- **Self-caught issue**: an early RLS test (`captain_name` write) passed Vietnamese diacritics through a bash `-d` argument, which silently corrupted them (`"Anh Trương"` → `"Anh Truong"`) due to a Windows/Git-Bash argument-encoding quirk — not a Supabase or app bug. Caught by inspecting raw response bytes rather than trusting terminal rendering, and fixed immediately via a Node script (correct UTF-8 handling). Lesson applied for the rest of this phase: never pass non-ASCII text through bash command-line arguments in this environment.

## 10. Rollback / restore readiness

- `supabase backups list --project-ref bugqhoktzzdvduzfjctm` → **`pitr_enabled: false`, `backups: []`**. This Supabase Cloud project currently has **no automated physical backups or Point-in-Time Recovery** — this is a plan-tier feature (typically requires a paid compute add-on), not something this session can enable, and not something to silently assume exists.
- What **is** proven and real: this exact environment (schema + seed + Storage assets + path wiring) has now been built from source **twice** in this project's history (once locally for M12.5, once here for staging) via the identical, fully-scripted, deterministic pipeline: `supabase db push` → `supabase db push --include-seed` → `scripts/upload-r25-media.js` → `scripts/apply-uploaded-media-paths.js` → `scripts/verify-data-parity.js`. Both times, 0 manual/undocumented steps were needed and parity was exact.
- A live destructive rollback drill (e.g., `db reset --linked --last 1` to test rolling back one migration) was considered and deliberately **not** performed this phase: with PITR disabled, there is no safety net if something went wrong mid-drill on the only available non-production project, and the reproducibility pipeline above already constitutes real, demonstrated proof of "rebuild from source" recovery — repeating it destructively would add risk without adding new information.
- **Concrete recommendation carried into the deployment plan** (`docs/m13-production-deployment-plan.md`): enable PITR/physical backups on the production project *before* cutover, and treat the scripted rebuild pipeline as the documented "roll forward from source" fallback for staging/dev, never for production.

## Decision

**Gate: PASS.** All staging verification requested — migrations, grants, RLS, Auth/RBAC, Storage, Realtime, data parity, E2E, accessibility, security, full regression — passed against the real `ptx-summer-cup-2026-staging` project, with no gate weakened or bypassed. One real infrastructure gap was found (no PITR/backups on the current plan tier) and is carried forward transparently, not hidden. Per the explicit instruction, execution **STOPS here** — see `docs/m13-production-deployment-plan.md` for the deployment plan, rollback plan, and exact commands, pending explicit human authorization before any of it is executed against the production project.
