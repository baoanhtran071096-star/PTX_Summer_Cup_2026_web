# M14 — Hosting Deployment Evidence (Vercel Production Activation)

> Records the exact evidence for the Vercel hosting gate authorized this phase. Two items remain open and are called out explicitly below, not silently marked PASS.

## Vercel project identity

- **Account/team:** `baoanhtran071096-stars-projects` (confirmed correct by the product owner before this gate was authorized)
- **Project name:** `ptx-summer-cup-2026-production`
- **Project ID:** `prj_gIQyuyHeqhvkXLkGAuWizsDuFsoo`
- **Org ID:** `team_YAJBilyU7EasjRKHvqPoM6kp`
- **Created:** this session, via `npx vercel link --yes --project ptx-summer-cup-2026-production` (the default project name derived from the directory failed Vercel's naming rules — retried with an explicit valid name)

## Git repository binding — **not completed, explicit limitation**

`git remote -v` returns nothing for this local repository — no GitHub remote has ever been configured, and the `gh` CLI is not available in this environment (`gh: command not found`). **Git-based continuous deployment was not connected.** Instead, the deployment below was performed via direct Vercel CLI upload (`vercel --prod`), which does not require a Git connection. This is a real, stated deviation from "connect the GitHub repository" as literally instructed — the substance (a real, working Production deployment) was still delivered, but auto-deploy-on-push is not yet wired up. Closing this requires the product owner to either create a GitHub repository and hand this agent the URL, or connect it themselves via Vercel's "Import Git Repository" flow. This blocker is now shared with the backup-automation gate (§8 of the activation plan), which also needs a real GitHub repository to host its workflow.

## Production deployment URL

- **Canonical:** `https://ptx-summer-cup-2026-production.vercel.app`
- **Deployment-specific:** `https://ptx-summer-cup-2026-production-ll9klbcc9.vercel.app`
- **Also aliased to:** `https://ptx-summer-cup-2026-production-baoanhtran071096-stars-projects.vercel.app`
- **Status:** `Ready` (confirmed via `vercel inspect`)

## Deployment commit SHA

Deployed via direct CLI upload of the working tree at commit `6a0cd3e1c0977be7e5b6bcc2d5e1e1e4bf16e6c8` (the repo's `HEAD` at deployment time — note: because this was a CLI upload, not a Git-triggered build, Vercel's own deployment record does not itself carry a commit SHA the way a Git-connected deploy would; this is the local `git log -1` value at the moment `vercel --prod` was run, recorded here for the audit trail).

- **Vercel deployment ID:** `dpl_GwNwNb4g35mqApfgzQE4AguGkw5h`

## Production Supabase project-ref verification — **independently confirmed, not assumed**

Fetched a real page from the live deployment and inspected the actual `<img>` `src` resolved by the deployed app (via `document.querySelectorAll('img')` in the live browser session, not a config file read):

```
https://ptx-summer-cup-2026-production.vercel.app/_next/image?url=https%3A%2F%2Ftqdsvtuspehavhcygipf.supabase.co%2Fstorage%2Fv1%2Fobject%2Fpublic%2Fteam-logos%2F...
```

The resolved host is `tqdsvtuspehavhcygipf.supabase.co` — an exact match to the approved production ref. Confirmed further via `curl` on that exact `_next/image` URL: `200 image/jpeg`, i.e. the image genuinely loads, not just resolves to the right hostname.

## Environment variable configuration

Set via `vercel env add <name> production --value ... --yes` (values sourced from the local, gitignored `.env.production.local`, never printed):

| Variable | Vercel environment scope | Type |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production only | Encrypted |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production only | Encrypted |
| `SUPABASE_SERVICE_ROLE_KEY` | Production only | Encrypted (added with `--sensitive`) |

Confirmed via `vercel env ls production` (metadata only — names/scope/type, never values) that all three are scoped **exclusively to Production** (not Preview, not Development) and stored as `Encrypted`. `SUPABASE_SERVICE_ROLE_KEY` has no `NEXT_PUBLIC_` prefix, so Next.js's own build-time bundling rules keep it server-only by construction — not shipped to the browser bundle.

## Supabase Auth `site_url` / redirect configuration — **not completed, explicit stop**

**Not done.** Attempting this via `supabase config push` was tested first against staging (not production) and found to silently change several unrelated Auth security settings beyond `site_url`/redirect URLs (disabling required email confirmation, loosening the email rate limit, disabling MFA TOTP) — a real security-relevant side effect, not something this instruction's "update site_url and redirect allowlist" authorized. Staging was fully reverted to its exact prior state and verified. Production was never touched by this test. Full finding and the two proposed paths forward: `docs/m14-production-activation-plan.md` §3.

**Production's Auth `site_url` remains the local-dev default (`http://127.0.0.1:3000`) — not yet the real Vercel URL, and not used as a final production value, per the explicit instruction not to leave `localhost` as the final site URL.** This gate stays open until resolved via one of the two proposed paths.

## E2E / accessibility results — through the real public HTTPS URL

`playwright.config.ts`'s `baseURL` was temporarily pointed at `https://ptx-summer-cup-2026-production.vercel.app` (webServer block removed for this pass only), the full suite run, then reverted via `git checkout -- playwright.config.ts` (confirmed clean afterward).

**Result: 24/24 passed** — `navigation.spec.ts`, `theme.spec.ts`, `accessibility.spec.ts` (including all 9 real-data accessibility scans, no violations), `live-data.spec.ts` (all read-only specs) — all against the real production Supabase data, served through the real Vercel hosting layer, over real HTTPS.

## Storage / Realtime re-verification through the real deployed app

- **Storage:** confirmed above (Auth section notwithstanding) — real image fetch through the deployed app's own `/_next/image` proxy, `200 OK`, correct content-type.
- **Realtime:** opened `https://ptx-summer-cup-2026-production.vercel.app/lich-thi-dau` in a real browser tab (not a Node script only, a stronger proof than M13's). Triggered a real, controlled `UPDATE` on `matches.legacy_id=1` (`status: 'scheduled' → 'live'`) via a script against production — the **open browser tab updated live**, showing "● Đang diễn ra" with a "0 : 0" score, with no manual refresh. Reverted (`'live' → 'scheduled'`) — the tab updated back automatically. Re-confirmed via REST afterward: `matches.legacy_id=1.status = 'scheduled'`, matching the pre-test state exactly. No artifact left.

## Secret scan

`npm run verify:secrets`: **0 findings**, re-run after every mutating step in this phase (project creation, env var configuration, deployment, the config-push staging test and its revert) — always clean.

## Backup gate — storage-destination question resolved

Per this phase's explicit instruction to evaluate GitHub Actions artifacts before requiring external storage: verified against GitHub's own documentation that private-repo artifacts support up to 400 days retention (exceeds the locked 1-year policy). **No external object storage is required.** Full finding: `docs/m14-backup-architecture.md`. Blocked only on the same missing-GitHub-repository issue as the Git connection above, plus one Supabase Personal Access Token the product owner must generate themselves.

## Rollback procedure (for everything done in this phase)

| What | Rollback |
|---|---|
| Vercel project | Delete via Vercel dashboard (Project Settings → Delete) or `vercel remove ptx-summer-cup-2026-production` — fully reversible, no Supabase/data impact |
| Vercel env vars | `vercel env rm <name> production` — reversible |
| The deployment itself | No production Supabase data was touched by deploying the app; removing/redeploying the Vercel project has zero effect on the certified backend |
| The two reverted diagnostic actions (staging auth-config test, Playwright `baseURL` edit) | Already reverted and verified in this same phase — nothing outstanding |

## Summary of what's genuinely closed vs. still open

**Closed, with real evidence:** Vercel project created, environment correctly scoped, real public HTTPS deployment live, production Supabase binding independently verified (not assumed), E2E/accessibility passing through the real public URL, Storage and Realtime re-verified through the real app (Realtime via an actual live browser tab), secret scan clean, backup-storage question resolved.

**Still open, not claimed PASS:**
1. Git repository connection (blocks both true CI/CD and the backup workflow) — needs the product owner to create/provide a GitHub repository.
2. Auth `site_url`/redirect URL update — needs either a quick manual Dashboard action from the product owner, or a safer scoped mechanism than `config push` to be found and verified before use on production.
