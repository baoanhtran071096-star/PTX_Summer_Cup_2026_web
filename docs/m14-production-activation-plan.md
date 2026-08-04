# M14 — Production Activation & Operational Readiness Plan

> **Status: 4 decisions LOCKED by the product owner; hosting project/repo connection not yet created — see §1's exact next gate.** No hosting project has been created, no Auth configuration has been changed, no real admin has been created, and no public launch has occurred. M13's certified production baseline (`ptx-summer-cup-2026-production`, ref `tqdsvtuspehavhcygipf`, commit `296b905` deployed, certified at `3999c83`) remains unchanged.

## Locked decisions (product owner, this phase)

1. **Hosting:** Vercel. A Vercel-provided HTTPS URL is an acceptable initial canonical production URL — a custom domain is deferred, not a blocker, and will be its own separately-verified change later.
2. **First admin:** a real, product-owner-approved identity — never invented, seeded, or fabricated by this agent.
3. **Backups:** automated via a scheduled GitHub Actions workflow. Dumps are never committed to Git history; backup credentials live only in the appropriate secret store; storage destination must be private/off-site with explicit retention and integrity verification.
4. **Log review:** manual Supabase Dashboard Logs Explorer review by the product owner is the accepted human verification gate for service logs this agent cannot retrieve independently. This gate is not claimed PASS until the product owner explicitly confirms it.

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

## 1. Canonical production hosting/domain — **LOCKED: Vercel; one exact gate remains**

**Decision:** Vercel, with its default HTTPS URL as the initial canonical production URL. Custom domain deferred to a later, separately-verified change.

**Finding from this session's environment (not assumed — checked directly):** `npx vercel whoami` succeeded without this agent supplying any credentials — the environment already held a valid Vercel session, authenticated as **`baoanhtran071096-star`** (team `baoanhtran071096-stars-projects`). `npx vercel projects ls` (read-only) confirms this is a real, pre-existing account with 2 unrelated projects (`drive-master-ai`, `drive-master-ai-h9np`) and **no PTX Summer Cup project yet**. Nothing was created or modified by these two read-only checks.

**Exact next gate — the "external account authorization, repository connection" this plan was told to stop for, not bypass:**

| | |
|---|---|
| **Operation** | Create a new Vercel project for this repository and connect it to GitHub (`vercel link` + `vercel git connect`, or the equivalent via the Vercel dashboard's "Import Git Repository" flow) |
| **Target** | Vercel account/team `baoanhtran071096-stars-projects` |
| **Expected effect** | A new Vercel project is created (consumes one project slot on whatever plan this account is on); Vercel's GitHub App gets repository read access to `PTX_Summer_Cup_2026_web_R25` in order to build on every push; a first deployment builds automatically once connected |
| **Rollback** | Delete the Vercel project (Vercel dashboard → Project Settings → Delete), and/or revoke the GitHub App's repository access from GitHub's own Settings → Applications — both fully reversible, no data loss (this is a hosting/build pipeline, not the Supabase backend) |
| **Verification** | After connecting: confirm a production deployment builds successfully and serves the app at the assigned `*.vercel.app` URL, with `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY` set correctly (§2) |
| **Product Owner action required** | **Confirm explicitly that `baoanhtran071096-stars-projects` is the correct account to use, and authorize this agent to run `vercel link`/`vercel git connect` (or state you'll do the Import Git Repository step yourself via the Vercel dashboard instead).** Connecting GitHub's side of this (the Vercel GitHub App installation) may itself prompt a GitHub-side authorization screen the first time — if the CLI flow surfaces that prompt, this agent will stop and report it rather than attempting to click through it blindly. |

Nothing in §2, §3, §5, §6 can execute until this specific gate is resolved.

## 2. Production environment binding

Once §1 is answered:
- Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` as the hosting platform's own environment variables (e.g. Vercel's Project Settings → Environment Variables for the Production environment specifically, not Preview/Development) — **never** as a committed file, matching the discipline already used for `.env.production.local` throughout M13.
- `SUPABASE_SERVICE_ROLE_KEY` must be scoped to server-only execution context (Vercel does this automatically for non-`NEXT_PUBLIC_`-prefixed vars) — verify this is actually true on whatever platform is chosen, not assumed.
- Confirm the build succeeds on the hosting platform itself (a fresh build environment, not just this local machine) before considering this closed.

## 3. Supabase Auth `site_url` + allowed redirect URLs — **§1's URL now exists; found a real safety issue, stopped rather than proceeding**

Real production URL now live: `https://ptx-summer-cup-2026-production.vercel.app`. Attempted to update via `supabase config push` and, per this phase's own instruction to verify rather than assume, **tested the mechanism on staging first rather than risking it on production directly.**

**Finding:** `config push` is not a scoped, single-field tool — it pushes the *entire* `[auth]` section as a diff against whatever `supabase/config.toml` currently holds. Confirmed via a real staging test (fully reverted afterward): alongside `site_url`/`additional_redirect_urls`, it also silently changed **`enable_confirmations` (email confirmation requirement) from `true` to `false`**, loosened the email rate limit (`max_frequency` from `1m0s` to `1s`), changed `otp_length` (`8` → `6`), and disabled MFA TOTP enrollment/verification — none of which were asked for, and several of which are real security regressions (disabling required email confirmation on a real production project, in particular).

**This is exactly the "unresolved security issue" this phase's instructions said to stop for rather than silently proceed past.** `config push` was not run against production. Staging's settings were restored to their exact pre-test values (verified via a second `config push` back, and `config.toml` itself reverted via `git checkout`).

**Path forward, presented as the stop-and-report this phase asked for:**

| | |
|---|---|
| **Operation** | Update only `site_url` and `additional_redirect_urls` on the production Supabase project |
| **Target** | `ptx-summer-cup-2026-production` (`tqdsvtuspehavhcygipf`) → Authentication → URL Configuration |
| **Expected effect** | `site_url` becomes `https://ptx-summer-cup-2026-production.vercel.app`; that URL is added to the redirect allow-list; nothing else changes |
| **Rollback** | Revert both fields to their current values (`http://127.0.0.1:3000` / empty) via the same Dashboard screen |
| **Verification** | Re-check via the Auth settings REST endpoint (read-only) that only these two fields differ from before |
| **Product Owner action required** | This one is fast enough (two fields, one Dashboard screen: Authentication → URL Configuration) that doing it yourself avoids the blast-radius risk entirely — recommended. Alternatively, tell this agent to find/use a scoped Management API call instead of `config push` (this agent does not currently hold a raw Management API token it can use outside the CLI's own commands — the CLI's ambient authentication does not expose one for direct reuse), which would need to be verified equally carefully before running against production. |

No `localhost` value has been used as a final production `site_url` — the still-local-dev value remains until one of the two paths above is completed.

## 4. First real production administrator — **LOCKED policy; exact procedure prepared, execution waits on §1**

**Decision:** the identity is the product owner's to name — never invented, seeded, or fabricated by this agent. This agent will not create, guess, or select an email/identity on its own.

**Exact onboarding + RBAC verification procedure (ready to run once §1's app is live):**

1. **Product owner action:** visit the real public production URL's `/dang-nhap` (login) page and sign up with the real email address they want to use as the first admin, choosing their own real password. This agent will not ask the product owner to paste that password anywhere — signup happens directly in their own browser session.
2. **This agent verifies (read-only):** the `profiles` row auto-created by the trigger shows the new user with `role = 'viewer'` — confirms the same trigger already proven in M13 fired correctly for a real user, not a synthetic one.
3. **This agent performs the one-time promotion:** a single service-role `PATCH` setting that specific real user's `profiles.role = 'admin'` — the same, already-proven bootstrap mechanism from M13 §7/§8. This is the only point a service-role credential touches a real user record, run once, not scripted into anything re-runnable by accident.
4. **This agent verifies (through the real app, not raw REST):** log out; ask the product owner to log back in with their own credentials (this agent does not hold or request their password); confirm the admin UI (`/admin`) is reachable for that account and a real, idempotent admin action (e.g. viewing `/admin/teams`) succeeds.
5. **Stop condition:** if step 4 requires entering the product owner's password into any field this agent controls, this agent stops and asks the product owner to perform that specific interactive step themselves, exactly as password entry is always handled per this agent's standing rules.

No disposable/test account is created for this step — unlike M13's verification account (which existed solely to prove the mechanism and was fully deleted), this one is the real, permanent first admin and is meant to persist.

## 5. Public-URL browser/E2E/accessibility verification

Once §1–§4 are resolved, this agent will:
- Navigate the **real public HTTPS URL** (not `localhost`) via the Browser tool and confirm homepage/nav/teams/players/matches/standings/predictions render correctly against production data, exactly as the M13 smoke test did against `localhost` pointed at production — this time through the actual hosting + domain + TLS layer.
- Re-run the Playwright E2E + accessibility suite with `baseURL` pointed at the real public URL (not `localhost:3000`) — this requires a small, reversible edit to `playwright.config.ts`'s `use.baseURL` (or an env-var override) for this verification pass only, reverted afterward.
- This is the step that actually proves "configuration is correct" translates to "the real thing works," per the explicit instruction not to declare M14 complete from configuration inspection alone.

## 6. Production Storage and Realtime re-verification (through the real app)

- Re-confirm real image delivery (avatar/logo) renders correctly when fetched by the actual public app, not just via direct `curl` (already proven in M13, but doing it once more through the real hosted app closes the loop end-to-end).
- Re-confirm Realtime updates propagate to a real browser session hitting the public URL (e.g. open the public schedule page, trigger a controlled, reverted match-status change server-side, confirm the open browser tab updates live) — a stronger proof than the Node-script-only test done in M13.

## 7. Observability / log review — **LOCKED: manual PO Dashboard review is the accepted gate**

- **Real limitation, stated plainly:** this agent has no CLI/API path to Auth/API/Storage/Realtime request-level logs — only Supabase Dashboard access has that. `supabase inspect db *` gives DB-performance diagnostics (locks, bloat, slow queries, cache hit rates), which this agent will still run as a baseline health check, but it is not a substitute for the Dashboard's Logs Explorer.
- **Accepted protocol:** the product owner reviews the Dashboard's Logs Explorer directly, using the exact checklist in `docs/m14-log-review-checklist.md` (created this phase), and explicitly confirms completion. **This agent will not claim this gate PASS on the product owner's behalf** — it stays open until that explicit confirmation arrives, at which point it's recorded verbatim in the final certification report.

## 8. Backup scheduling, retention, and operational restore readiness — **Storage-destination question resolved; blocked only on the repo existing**

**Storage-destination evaluation (this phase's explicit instruction):** verified against GitHub's own documentation (not assumed) that private-repository GitHub Actions artifacts support up to **400 days** retention (public repos: 90 days) — this exceeds the locked policy's longest tier (1 year) with room to spare. **Conclusion: private GitHub Actions artifacts alone satisfy the locked retention/security requirements. No external object storage is needed.** Full reasoning: `docs/m14-backup-architecture.md`.

- **Workflow authored and updated** at `.github/workflows/production-backup.yml.draft` — uploads the dump directly as a GitHub Actions artifact (`retention-days: 90`, comfortably inside the private-repo ceiling), no external storage step.
- **Remaining blocker:** the GitHub repository itself doesn't exist yet (same blocker as §1's Git connection — no `git remote` configured, no `gh` CLI available in this environment) — this single blocker now covers both.
- **One condition:** the repository must be created as **private**, not public, for the 400-day ceiling to apply — public repos cap at 90 days, which is still enough for the 30-day daily tier but not the 1-year tier.
- **One remaining secret:** `SUPABASE_ACCESS_TOKEN`, which requires the product owner's own Supabase Dashboard access to generate.

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

## GO / NO-GO prerequisites — remaining, after this phase's 4 decisions

All 4 policy decisions are locked (see top of document). Two concrete actions remain before execution can proceed past preparation:

1. **§1 exact gate:** confirm the Vercel account (`baoanhtran071096-stars-projects`) and authorize creating the project + connecting the GitHub repo (or state you'll do the Import Git Repository step yourself).
2. **§8 exact gate:** decide where automated backup dumps should be stored (see `docs/m14-backup-architecture.md`) and provide/authorize the credentials for that destination.

Everything else authorized by this phase's decisions (admin-onboarding procedure prep, backup-workflow authoring as a draft, log-review checklist) is complete and does not need further sign-off to exist as prepared artifacts — only to go live.

## Current recommendation

**NO-GO for public launch still, but the blocking surface has narrowed to exactly two concrete actions (§1, §8) instead of an open-ended "no decision yet."** The certified M13 backend remains healthy, verified, and untouched throughout this phase's preparation work.
