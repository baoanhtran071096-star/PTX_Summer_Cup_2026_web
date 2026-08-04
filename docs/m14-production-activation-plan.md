# M14 — Production Activation & Operational Readiness Plan (AUDIT + PLAN ONLY — NOT EXECUTED)

> **Status: NOT STARTED.** This document is the audit and plan requested before any M14 execution. No hosting has been created, no Auth configuration has been changed, no real admin has been created, and no public launch has occurred. M13's certified production baseline (`ptx-summer-cup-2026-production`, ref `tqdsvtuspehavhcygipf`, commit `296b905` deployed, certified at `3999c83`) was re-verified read-only during this audit and confirmed **unchanged** — see §0.

## 0. Audit findings (real checks performed, not assumed)

| Check | Result |
|---|---|
| Production project identity | ✅ `tqdsvtuspehavhcygipf` / `ptx-summer-cup-2026-production` — `ACTIVE_HEALTHY`, unchanged since M13 certification |
| Protected project | ✅ `wmamuqylqqikvseuqerm` — still `INACTIVE`, unchanged, confirmed untouched |
| Staging | ✅ `bugqhoktzzdvduzfjctm` — still `ACTIVE_HEALTHY`, unaffected |
| Data parity (production) | ✅ Re-run: teams 3/3, players 24/24, matches 3/3 — exact match, unchanged since M13 |
| Secret scan | ✅ 0 findings |
| Hosting/deployment config in repo | ❌ **None exists.** No `vercel.json`, no `Dockerfile`, no `netlify.toml`/`fly.toml`/`render.yaml`, no CD workflow in `.github/workflows/` — only a CI workflow (`ci.yml`) that lints/tests/builds on push/PR and does a **local** migration-safety check; it never deploys anywhere |
| Env vars the app actually needs | Confirmed via `.env.example`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only), optional `AI_PROVIDER_*` — no hosting-specific vars required beyond these |
| `next.config.ts` image domains | ✅ Already generic (`*.supabase.co` wildcard) — no change needed for any real Supabase project, staging or production |
| `middleware.ts` | ✅ No hardcoded domain/host assumptions — purely relative-path redirects, host-agnostic |
| Automated backup job | ❌ **None exists.** M13 took two *manual, one-off* `supabase db dump` backups as pre-deployment safety steps. No scheduled cadence (the locked §0.2 policy: daily + pre-deployment/pre-migration/pre-bulk-change) has ever actually been automated |
| Dashboard-level service logs (Postgres/Auth/API/Storage/Realtime request logs) | ❌ **Not accessible via this session's tooling.** `supabase inspect db <subcommand>` (checked: `db-stats`, `table-stats`, `locks`, `blocking`, `outliers`, etc.) gives DB-performance diagnostics only, not Auth/API/Storage/Realtime request-level logs — those live exclusively in the Supabase Dashboard's Logs Explorer, which requires a human with dashboard access |
| First real production admin | ❌ **Does not exist.** M13 deliberately created, exercised, and fully deleted a disposable verification account — by design, production currently has 0 real users and 0 admins |
| Auth `[auth]` site_url / redirect URLs | ❌ **Still the local-dev default** (`http://127.0.0.1:3000` per `supabase/config.toml`) — was explicitly deferred in M13 pending a hosting decision |
| Team T/X assets | Unchanged — still `SOURCE_LOST_PENDING_REPLACEMENT`, no fabrication |
| Legacy regression | Unchanged — still 15/16, the one known pre-existing baseline artifact from M-01, not independently re-investigated or "fixed" for this audit |

## 1. Canonical production hosting/domain — **PO decision required, blocks everything below it**

Nothing else in this plan (§2, §3, §5) can be executed until this is answered. Options, not a recommendation to act on any of them without confirmation:
- **Vercel** (typical default for Next.js; zero-config for the App Router, but is a new account/billing relationship this agent cannot create)
- **Another platform** (Netlify, Fly.io, a self-managed VPS, etc.) — each has different env-var and build-config mechanics
- **Domain:** a real custom domain (e.g. `ptxsummercup2026.com`) vs. the hosting platform's default subdomain (e.g. `ptx-summer-cup-2026.vercel.app`) — affects §3's exact redirect URL value and whether DNS/SSL setup is a separate task

**This agent cannot create hosting accounts, purchase domains, or bind billing** (matches the same constraint already applied to Supabase project creation in M13). The product owner needs to either create the hosting project themselves and hand over deploy access, or explicitly direct which existing account/project to use.

## 2. Production environment binding

Once §1 is answered:
- Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` as the hosting platform's own environment variables (e.g. Vercel's Project Settings → Environment Variables for the Production environment specifically, not Preview/Development) — **never** as a committed file, matching the discipline already used for `.env.production.local` throughout M13.
- `SUPABASE_SERVICE_ROLE_KEY` must be scoped to server-only execution context (Vercel does this automatically for non-`NEXT_PUBLIC_`-prefixed vars) — verify this is actually true on whatever platform is chosen, not assumed.
- Confirm the build succeeds on the hosting platform itself (a fresh build environment, not just this local machine) before considering this closed.

## 3. Supabase Auth `site_url` + allowed redirect URLs

- Update via Supabase Dashboard or Management API to the real domain from §1 (e.g. `https://ptxsummercup2026.com` or the platform's assigned URL) — **not** via `supabase config push` (would also push unrelated local-dev `config.toml` values, per the standing rule already established in M13).
- `additional_redirect_urls` needs the real domain's auth callback path.
- **Cannot be finalized before §1.** Placeholder value only until then.

## 4. First real production administrator

- A real person (the product owner or their designated admin) signs up **through the real, publicly-hosted app** (not the Admin API shortcut used for M13's disposable verification account) — this is a genuine, permanent account, not something this agent fabricates.
- The one-time service-role promotion PATCH (`profiles.role = 'admin'`) should be run once by whoever holds the production service-role key at that time, mirroring the exact bootstrap mechanism already proven working in M13 §7/§8 — this agent can perform it if asked, but the account itself must belong to a real person, decided by the product owner, not invented.
- **PO decision needed:** who is this person, and what email should be used?

## 5. Public-URL browser/E2E/accessibility verification

Once §1–§4 are resolved, this agent will:
- Navigate the **real public HTTPS URL** (not `localhost`) via the Browser tool and confirm homepage/nav/teams/players/matches/standings/predictions render correctly against production data, exactly as the M13 smoke test did against `localhost` pointed at production — this time through the actual hosting + domain + TLS layer.
- Re-run the Playwright E2E + accessibility suite with `baseURL` pointed at the real public URL (not `localhost:3000`) — this requires a small, reversible edit to `playwright.config.ts`'s `use.baseURL` (or an env-var override) for this verification pass only, reverted afterward.
- This is the step that actually proves "configuration is correct" translates to "the real thing works," per the explicit instruction not to declare M14 complete from configuration inspection alone.

## 6. Production Storage and Realtime re-verification (through the real app)

- Re-confirm real image delivery (avatar/logo) renders correctly when fetched by the actual public app, not just via direct `curl` (already proven in M13, but doing it once more through the real hosted app closes the loop end-to-end).
- Re-confirm Realtime updates propagate to a real browser session hitting the public URL (e.g. open the public schedule page, trigger a controlled, reverted match-status change server-side, confirm the open browser tab updates live) — a stronger proof than the Node-script-only test done in M13.

## 7. Observability / log review

- **Real limitation, stated plainly:** this agent has no CLI/API path to Auth/API/Storage/Realtime request-level logs — only Supabase Dashboard access has that. `supabase inspect db *` gives DB-performance diagnostics (locks, bloat, slow queries, cache hit rates) which this agent *can* run and will include as a baseline health check, but it is not a substitute for the Dashboard's Logs Explorer.
- **Proposed protocol:** either (a) the product owner reviews the Dashboard's Logs Explorer directly after go-live and reports findings back, or (b) the product owner grants this agent session dashboard-level access (outside this agent's current tooling — not something achievable via the CLI used so far). Recommend (a) as the default, ongoing operational practice, not a one-time M14 gate.

## 8. Backup scheduling, retention, and operational restore readiness

- **Gap:** the locked §0.2 policy (daily automated dump + pre-deployment/pre-migration/pre-bulk-change dumps) has never been automated — only manual one-offs exist so far.
- **Proposed design:** a new scheduled GitHub Actions workflow (e.g. `.github/workflows/production-backup.yml`) running `supabase db dump --linked` daily against the production ref, using a `SUPABASE_ACCESS_TOKEN` + `SUPABASE_PROJECT_REF` stored as GitHub Actions secrets (never committed), uploading the resulting `.sql` file to a durable, access-controlled destination.
- **PO decision needed:** where should the actual dump files land? Options: a private cloud storage bucket (S3/GCS/Azure Blob — needs an account/credentials this agent doesn't have), a private GitHub Actions artifact (has a retention-days limit, not ideal for long-term retention), or another destination the product owner specifies. This agent can author the workflow once the destination and its credentials are decided, but cannot itself provision cloud storage or its billing.
- **Restore procedure:** the mechanism (`psql -f <dump>` against a target) is already proven end-to-end (M13, disposable Docker scratch container) — the same procedure applies to any future dump, automated or manual.

## 9. Production security and secret verification

- Re-run `npm run verify:secrets` as part of every future deploy (already true of the existing CI, minus an actual deploy step which doesn't exist yet — see §1/§2).
- Confirm whatever hosting platform is chosen never logs/exposes `SUPABASE_SERVICE_ROLE_KEY` in build logs or client bundles (verify via the platform's own build output once §1/§2 are real).
- Re-confirm RLS/anon-write-denial matrix once the app is live and receiving real public traffic (a repeat of M13 §7's matrix, at the real public URL).

## 10. Final public-launch certification

Only after §1–§9 are each closed with real evidence (not configuration inspection alone, per the explicit instruction) does this agent produce `docs/m14-public-launch-certification.md` and declare a terminal state.

---

## Operation classification (risk/reversibility, per operation type in this plan)

| Operation | Reversible? | Rollback path | Needs fresh explicit PO authorization beyond the current M14 directive? |
|---|---|---|---|
| Creating a hosting project/account | Depends on platform — usually deletable, but may have billing implications | Delete the hosting project | **Yes** — this agent cannot create hosting accounts/billing at all; the PO must do this themselves |
| Setting hosting env vars | Fully reversible (just values in a settings UI) | Change/remove the vars | No, once §1's platform is chosen and access is granted — covered by this directive's scope |
| Changing Supabase `site_url`/redirect URLs | Reversible (just a config value) | Revert to previous value | No — covered, once the real domain is known |
| Creating the first real admin account | Reversible in principle (can be deleted/demoted) but is a **real, permanent user identity**, not a disposable test account | Demote/delete if wrong | **Yes** — the PO must say who this person is; this agent will not invent an email/identity |
| Editing `playwright.config.ts baseURL` for the public-URL E2E pass | Fully reversible, trivial | `git revert`/edit back | No — small, reversible, temporary, reverted same-session |
| Authoring the backup-automation GitHub Actions workflow | Fully reversible (a new file, no effect until the destination credentials exist) | Delete the workflow file | No, for authoring the workflow itself. **Yes**, for actually provisioning wherever the dumps land (cloud storage account/billing) |
| Any further production Storage/Auth/Realtime writes for verification | Same discipline as M13: disposable, created-then-fully-deleted, no permanent artifact | Delete the specific test object/account created | No — same pattern already proven safe in M13, covered by this directive |
| Anything touching `wmamuqylqqikvseuqerm` | N/A | N/A | **Permanently out of scope, no authorization would ever cover this** |

## Automatic STOP conditions for M14 (same discipline as M13 §14)

- Production ref resolves to anything other than `tqdsvtuspehavhcygipf`, or to anything on the denylist (`wmamuqylqqikvseuqerm`, `bugqhoktzzdvduzfjctm`, the unrelated third project).
- Data parity check fails at any point (would mean the M13 baseline drifted — investigate before any further action, do not silently repair).
- Any schema/table found that doesn't match the certified migration set.
- A secret is found exposed anywhere (build logs, client bundle, committed file, chat).
- Any RLS/anon-write check that should be denied instead succeeds.
- Any hard gate in §1–§9 fails and cannot be immediately, safely remediated within the already-authorized scope.

## GO / NO-GO prerequisites — what's needed from the Product Owner before M14 execution can begin

1. **Hosting platform + domain decision** (§1) — the single blocking item; nothing else can start without it.
2. **Confirm who the first real admin is** (§4) — a real identity, not something this agent invents.
3. **Confirm backup-destination decision** (§8) — where automated dumps should be stored long-term, and provide/authorize the credentials for it.
4. **Acknowledge the observability limitation** (§7) — confirm the proposed protocol (PO reviews Dashboard Logs Explorer directly) is acceptable, or state an alternative.
5. Explicit authorization to proceed once 1–4 are answered — this plan does not execute anything on its own per your instruction.

## Current recommendation

**NO-GO for now — not due to any defect, but because §1 (hosting/domain) has no decision yet, and everything downstream depends on it.** The certified M13 backend remains healthy, verified, and untouched. This plan is ready to execute the moment the four items above are answered.
