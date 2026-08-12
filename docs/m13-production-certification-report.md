# Production Deployment Evidence / Production Certification Report

## Deployment identity

- **Deployed commit SHA:** `296b905cc529a14b42d480144ea9bf5173101b07` (state at which the Final Preflight Gate passed 8/8; no code changes were made between preflight and deployment)
- **Deployed by / authorized by:** Product owner, explicit "PRODUCTION GO — AUTHORIZED" directive
- **Production GO authorization:** received this session, following the 8/8 Preflight Gate pass at commit `296b905`
- **Production project ref (confirmed):** `tqdsvtuspehavhcygipf` (`ptx-summer-cup-2026-production`, org `dpgiiwquogbgskyjeetv`, region `ap-southeast-1`)
- **Deployment window:** this session, immediately following authorization

## §0 Decisions locked before deployment

- Production ref: `tqdsvtuspehavhcygipf` — re-confirmed independently via `supabase projects list` immediately before the first mutation, matched exactly
- Backup/DR strategy: alternative (no PITR) — daily + mandatory pre-deployment/pre-migration/pre-bulk-change dumps; RPO ≤24h normal / ≈0 controlled, RTO ≤2h; **restore mechanism proven end-to-end** via an isolated disposable Docker scratch container (see `docs/m13-production-preflight-results.md` "Row 8")
- Seed policy: accepted as-is — verified factually against `supabase/seed.sql` (3 teams, 24 players, 3 matches, 1 HOF year, 1 tournament-settings row; zero `sample`/`demo`/`test`/`fake` references)
- Team T/X assets: no change — still `SOURCE_LOST_PENDING_REPLACEMENT`, no fabricated substitute introduced

## Preflight Gate (§1) — re-verified immediately before first mutation

| # | Check | Result |
|---|---|---|
| 1 | Git state / commit SHA | ✅ Clean tree at `296b905`, unchanged from certified preflight |
| 2 | Production ref confirmed + denylist | ✅ `tqdsvtuspehavhcygipf` confirmed again; not `wmamuqylqqikvseuqerm`/`bugqhoktzzdvduzfjctm`/`dbnsaqczauxcriibwubg` |
| 3 | Independent data/schema state re-check | ✅ Still genuinely empty (`teams` → 404) immediately before mutating |
| 4 | Migration history re-check | ✅ Still 0/11 applied |
| 5 | Environment variables | ✅ `.env.production.local` present, gitignored, distinct |
| 6 | Secret scan | ✅ 0 findings |
| 7 | Backup/recovery readiness | ✅ Fresh pre-migration backup taken this session (see below) |
| 8 | Rollback prerequisites | ✅ Proven in the prior phase; unchanged |

**No discrepancy found between certified preflight state and re-verified state immediately before mutation.** Proceeded per the directive's explicit instruction.

## Migration result

- **Pre-migration backup:** `backups/pre-migration-production-20260804T172229Z.sql` (312 lines, gitignored, integrity spot-checked: valid `pg_dump` header, 4 `CREATE EXTENSION` statements present)
- **Command:** `supabase db push --linked --yes`
- **Result:** all 11 migrations applied with zero errors
- **Verification:** `supabase migration list --linked` afterward shows local == remote for all 11 entries, exact match, no drift

## Seed / Data parity result

- **Blocklist re-check immediately before seeding:** `grep -in "sample|demo|test|fake" supabase/seed.sql` → no matches
- **Command:** `supabase db push --linked --include-seed --yes` → seed applied successfully
- **Parity check:** `node scripts/verify-data-parity.js` → **PARITY OK** — teams 3/3, players 24/24, matches 3/3, all fields (identity, stats, ovr, captain_name, team assignment, position, schedule) match `docs/migration/r25-extracted.json` exactly. Re-run a second time at the very end of this deployment — still PARITY OK.

## Storage result

- 5 buckets created (`team-logos`, `player-avatars`, `gallery`, `operations-media`, `branding`) via the Storage Admin API directly (not `config push`, to avoid overwriting production `[auth]` settings with local-dev values) — matches `supabase/config.toml` exactly (file size limits, MIME types)
- `scripts/upload-r25-media.js`: **53/53 files uploaded, 0 failed** (`docs/migration/r25-production-upload-result.json`)
- `scripts/apply-uploaded-media-paths.js`: **24/24 player + 3/3 team paths updated**
- Real fetch verification: `player-avatars/xuan-su.webp` → `200 OK`, `image/webp`, 24144 bytes; `team-logos/bieu-tuong-doi-p-phoenix-.webp` → `200 OK`, `image/webp`, 19200 bytes
- All 5 buckets confirmed `public: true`, matching the config
- Team T/X group photos: **not introduced** — remain `SOURCE_LOST_PENDING_REPLACEMENT` per the locked policy; no fabricated substitute

## Auth / RBAC / RLS result

Full chain verified end-to-end **through the real deployed application** (not just raw REST), using a disposable verification account created, exercised, and then **completely deleted** afterward (zero permanent test artifacts):

1. Created via Auth Admin API → **profile auto-create trigger fired**, `role = 'viewer'` — confirms `20260804000011_auto_create_profile_on_signup.sql` works on real production Auth.
2. Signed in → real JWT issued.
3. Promoted to `admin` via one-time service-role bootstrap PATCH.
4. Logged into the actual deployed app at `/dang-nhap`, navigated to `/admin/teams`, submitted a real (idempotent, value-unchanged) edit via the app's Server Action.
5. Confirmed a real `audit_log` row appeared on `/admin/audit-log` — proves the full Server Action → DB write → audit write → RLS-gated read → UI render chain.
6. **Cleanup:** deleted the `audit_log` row (by `actor_id`) and the auth user (cascades to `profiles`). Re-verified afterward: `audit_log` empty, `profiles` empty, 0 auth users, `teams.captain_name` unchanged (`"Anh Trương"`, correct UTF-8).
7. RLS anon matrix, tested directly against production: anon read `teams` → 200, 3 rows; anon write `teams` (attempted `ovr: 999`) → 0 rows changed, confirmed unaffected (`ovr` still 89); anon read `audit_log` → `[]` (admin-only enforced).

**No demo/test/synthetic account persists in production.** The disposable verification account and all its side effects were fully removed.

## Realtime result

- Subscribed to `postgres_changes` on `public.matches` against production
- Triggered a real `UPDATE` (`status: 'scheduled' → 'live'`, match `legacy_id=1`) → event received with correct payload
- Reverted (`status: 'live' → 'scheduled'`) → event received again
- Re-verified via REST after the script exited: `matches.legacy_id=1.status = 'scheduled'` — confirmed reverted, no artifact left

## E2E / Accessibility / Regression results

- App pointed at production via a temporary, gitignored `.env.local` (never touching the certified `.env` local-dev baseline); removed immediately after this phase, local dev server confirmed restored to `127.0.0.1:54321` afterward
- Full Playwright suite (`navigation.spec.ts`, `theme.spec.ts`, `accessibility.spec.ts`, `live-data.spec.ts`) — all read-only, no write-heavy specs run against production: **24/24 passed**, including all 9 real-data accessibility scans (no violations — the M12.5 OVR-badge contrast fix holds against production-rendered content)
- Legacy regression (`npm run test:legacy`): **15/16 real assertions passing** — the 1 known failure is the pre-existing, pre-analyzed harness artifact unchanged since the M-01 baseline (`docs/legacy/r25-baseline-test-report.md`), unrelated to Supabase/production and not a new regression

## Static gates (pre-deploy)

| Gate | Result |
|---|---|
| `npm run typecheck` | ✅ 0 errors |
| `npm run lint` | ✅ 0 errors |
| `npm run verify:architecture` | ✅ 11 domain, 7 component files, 0 violations |
| `npm run verify:design-tokens` | ✅ 0 hardcoded colors |
| `npm run test:unit` | ✅ 51/51 |
| `npm run build` | ✅ succeeds, 22 routes, correct static/dynamic split |

## Post-Deployment Smoke Test

| Area | Result |
|---|---|
| Homepage | ✅ Loads, correct title, real tournament settings content (`Giải bóng đá truyền thống do Công đoàn PTX Group Việt Nam tổ chức`) |
| Navigation | ✅ All primary routes resolve (confirmed via E2E `navigation.spec.ts` + manual checks) |
| Teams | ✅ `/doi` — all 3 real teams, logos rendering, correct OVR/contrast |
| Players | ✅ `/cau-thu` — all 24 real players; `/cau-thu/18` → "Xuân Sử" correct |
| Matches | ✅ `/lich-thi-dau` — 3 real scheduled matches |
| Standings | ✅ `/bang-xep-hang` — all 3 teams, 0-played initial state |
| Predictions | ✅ `/du-doan` — form renders with real matches/players; leaderboard correctly empty (no real predictions exist, no synthetic data introduced) |
| Authentication | ✅ Login works; full admin bootstrap chain proven (then cleaned up) |
| Admin critical paths | ✅ `/admin`, `/admin/teams`, `/admin/audit-log` all reachable and correct |
| Assets | ✅ Real avatar + real team logo confirmed rendering (network-level fetch, 200 OK) |
| API/DB connectivity | ✅ Public REST reads return 200 with expected row counts throughout |

## Security / secret-scan result

- `npm run verify:secrets`: **0 findings**, run multiple times throughout this deployment (before migration, after Storage upload, after cleanup, at the very end) — always clean
- No production credential (service-role key, anon key, or any other secret) was ever printed to a visible output, logged, committed, or persisted outside gitignored local files (`.env.production.local`, created and removed from active use per-phase; the file itself remains locally for any follow-up operational needs, gitignored, never committed)
- `docs/migration/r25-production-upload-result.json` (bucket/key/path metadata only, no secrets) is the only new tracked artifact from this deployment

## Backup / rollback status

- Two backups taken this deployment: one during final preflight re-verification, one immediately pre-migration (`backups/pre-migration-production-20260804T172229Z.sql`) — both gitignored, both integrity spot-checked
- Restore mechanism proven end-to-end in the preceding phase (disposable scratch container, zero production/staging/local-dev impact) — see `docs/m13-production-preflight-results.md`
- **No rollback was invoked.** No hard gate failed at any point in this deployment.

## Warnings / deviations from the plan

- One transient, non-reproducing console message ("Failed to fetch RSC payload... Falling back to browser navigation") appeared once during the E2E run and did not recur on direct navigation to the same route immediately after — assessed as a dev-server prefetch race during Playwright's rapid navigation, not a production defect. Not counted as a regression.
- Direct Postgres/Auth/Storage/Realtime *service* logs (Supabase Dashboard's Logs Explorer) were **not** pulled — the CLI used throughout this session has no equivalent `logs` subcommand for cloud projects, and dashboard access was outside this agent's tooling. Observability for this report instead relies on: the Next.js dev server's own logs (checked clean, `preview_logs` — no server errors), and the fact that every operation performed via REST/Admin API/CLI throughout this deployment returned success responses with no errors surfaced. This is a real, stated limitation, not a fabricated PASS.
- Production `[auth]` `site_url`/redirect URL configuration (deployment plan §10) was **not** performed — it depends on a still-open hosting/domain decision (§0.5), out of scope for this Supabase-focused deployment. Public signups work at the Supabase Auth level; the app's own hosting/domain wiring is a separate, not-yet-authorized step.
- Team T/X group-lineup photos remain unresolved (`SOURCE_LOST_PENDING_REPLACEMENT`) by design — not a deviation, the locked decision.

## Final Production Certification Status

**M13 PRODUCTION DEPLOYMENT — CERTIFIED**

Every gate defined in `docs/m13-production-deployment-plan.md` that could be run in this environment passed with real, verified evidence — no field in this report is assumed or implicitly PASS. The two stated limitations (no direct dashboard log pull; `[auth]` site URL not configured) are explicit, scoped, and do not represent a failed gate — they are out-of-scope items correctly deferred to their own decisions rather than silently skipped.
