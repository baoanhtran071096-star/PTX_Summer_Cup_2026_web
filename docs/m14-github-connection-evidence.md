# M14 — GitHub Repository Connection & Vercel Git Integration — Gate Evidence

## Status: GitHub connection PROVEN. Vercel Git integration PROVEN via a real, non-fabricated push (see §6).

## 1. Pre-push identity and state verification (all performed before touching Git config)

| Check | Result |
|---|---|
| Working directory | `C:\Users\ASUS\Desktop\PTX_Summer_Cup_2026_web_R25` — confirmed via `pwd` |
| Branch / HEAD | `master` @ `7a8cf091c414e5eede05eef19706f5f4848079c5` |
| Working tree | Clean (only the harness's own `.claude/settings.local.json`, not a repo concern) |
| Existing remotes | None (`git remote -v` empty) — clean slate, no unrelated repo already configured |
| Local history | 29 commits, most recent five all recognizable as this session's own certified M13/M14 work — confirmed to be the certified history, not something unexpected |
| Target repo identity | `git ls-remote https://github.com/baoanhtran071096-star/PTX_Summer_Cup_2026_web_R25.git` — succeeded (exit 0), confirming the exact URL is reachable |
| Target repo empty | Same `ls-remote` call returned **zero refs** — genuinely empty, matching "intentionally empty, no README/license/.gitignore" |
| No unrelated repository | Only this exact URL was ever used for any Git operation this phase |

**No identity discrepancy found — proceeded.**

## 2. Mandatory pre-push secret gate

| Check | Result |
|---|---|
| `npm run verify:secrets` | 0 findings |
| `.env`, `.env.local`, `.env.production.local`, `.env.staging.local` currently tracked? | No — confirmed individually via `git ls-files --error-unmatch` for each |
| Any of these ever tracked in full history? | No — `git log --all --full-history --name-only -- <each file>` returned nothing for all four |
| JWT-shaped secrets (Supabase anon/service-role key format) anywhere in full history? | None found — searched all commits' full diffs for the `eyJ...*.{20+}.{20+}.{20+}` pattern |
| Other secret-shaped patterns (`SUPABASE_ACCESS_TOKEN=`, `ghp_`/`gho_`/`sbp_` prefixes, credentialed `postgres://` URLs) anywhere in history? | One match, inspected and confirmed benign: `DATABASE_URL: "postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/..."` in a legacy docker-compose-style file — this is a **shell variable interpolation template**, not an actual credential value; no real secret is embedded |

**No secret found in tracked files or Git history. Proceeded to push.**

## 3. Remote connection

```
git remote add origin https://github.com/baoanhtran071096-star/PTX_Summer_Cup_2026_web_R25.git
```

No history rewrite, no rebase, no squash — the existing 29-commit local history was used as-is.

## 4. First push

```
git push origin master
```

Result: `* [new branch] master -> master`. **Branch name preserved as `master`** — not renamed to `main`; no justification existed for a rename, so none was made, per the explicit instruction not to rename "merely because GitHub's generic Quick Setup example says main."

### Post-push independent verification

| Check | Result |
|---|---|
| Remote exists, correct URL | `git remote get-url origin` → exact match |
| Correct owner/repo | Confirmed by the URL itself; no alternate remote was ever configured |
| Expected branch | `refs/heads/master` present on remote |
| Local HEAD SHA == remote HEAD SHA | Both `7a8cf091c414e5eede05eef19706f5f4848079c5` — exact match, confirmed via `git ls-remote origin master` vs `git rev-parse HEAD` |
| Working tree clean after push | Yes |
| Repository still private | Unauthenticated `GET https://api.github.com/repos/...` → `404` (consistent with private; a public repo would return `200` unauthenticated) |
| No secret-bearing files uploaded | `git ls-tree -r origin/master --name-only` (298 files) — grepped for `.env`/`secret`/`credential`: only `.env.example` (the intentionally-safe template) and `scripts/scan-secrets.js` (the scanner tool itself) matched; no real env/secret file present |

**All post-push checks pass.**

## 5. Vercel Git integration

```
npx vercel git connect --yes
```

Result: `Connecting GitHub repository: https://github.com/baoanhtran071096-star/PTX_Summer_Cup_2026_web_R25` → `Connected`.

**Confirmed the same existing project was used, not a new one:** `.vercel/project.json` before and after this command shows the identical `projectId: prj_gIQyuyHeqhvkXLkGAuWizsDuFsoo`, `projectName: ptx-summer-cup-2026-production`. No second project was created.

**Environment variables and Supabase binding preserved:** these were not touched by this step — `vercel env ls production` (checked in the prior phase) already showed all three variables scoped to Production, and no command in this phase modified them. The certified production Supabase binding (`tqdsvtuspehavhcygipf`) is unaffected by connecting Git — it lives in the environment variables, not the Git connection.

## 6. GitHub deployment provenance — **proven via a real, non-fabricated commit**

Per the instruction: *"perform a controlled GitHub → Vercel deployment only if it can be done without introducing an artificial source-code change solely to trigger deployment."*

Immediately after connecting the repo, `vercel ls` showed no new deployment had been auto-triggered by the connection alone — only the original CLI-uploaded deployment was present. Rather than fabricate a change to force a build, this agent then committed the evidence documentation for §1–§5 above (`bf7d2e1`, a real, substantive commit that needed pushing regardless of any deployment-testing purpose) and pushed it as the natural next step of this same authorized work.

**That real push did trigger an automatic Vercel deployment**, observed directly:

```
vercel ls ptx-summer-cup-2026-production
  32s   ...   https://ptx-summer-cup-2026-production-bhpw4mafz.vercel.app   ● Building   Production
```

Waited for the build to complete (`● Ready`), then confirmed via Vercel's own build log — not inferred, read directly:

```
Cloning github.com/baoanhtran071096-star/PTX_Summer_Cup_2026_web_R25 (Branch: master, Commit: bf7d2e1)
```

**`bf7d2e1` exactly matches the commit that was pushed** (`bf7d2e1ccaf0aced4e6118e857e4fe2080599bcb`). The new deployment (`dpl_HX3SeC6YfxRXZCjerghwP7DbGBn2`) is now aliased to the canonical `ptx-summer-cup-2026-production.vercel.app` URL, alongside a git-branch-specific alias (`ptx-summer-cup-2026-git-5dc961-...`) that only git-connected deployments receive — further confirming this was a genuine Git-triggered build, not another CLI upload.

**Re-verified the resolved Supabase binding on this new deployment**, not assumed carried over from the old one: `curl` against the canonical URL's `_next/image` proxy for a real team logo → `200 OK`, `image/jpeg`, resolving through `tqdsvtuspehavhcygipf.supabase.co` exactly as before.

**GitHub → Vercel auto-deploy-on-push is now genuinely proven**, with a real commit, not a fabricated one made solely to test the pipeline.

## 7. Backup workflow — audited, still not activated

Per the instruction not to activate until the GitHub connection is proven and secrets/permissions/retention are audited:

- **GitHub connection: now proven** (§1–§4 above).
- **Retention: audited** — `retention-days: 90`, well within the private repo's 400-day ceiling (confirmed private in §4).
- **Permissions: audited and fixed** — the draft workflow had no explicit `permissions:` block (would have inherited whatever default scope the repo/org has). Added an explicit `permissions: contents: read` — this workflow never needs to write back to the repository.
- **Secrets: one blocker remains** — `SUPABASE_ACCESS_TOKEN` still needs to be generated by the product owner via their own Supabase Dashboard and added to GitHub Secrets. The workflow remains `.yml.draft` (inert) until that exists.
- **No database backup artifact was committed to Git history** — confirmed via §2's history scan; nothing changed by this phase's work in that respect.

## 8. Scope confirmation

Nothing beyond what was explicitly authorized was touched:

- No production data mutation.
- No unrelated Auth configuration change (that gate remains separately open per the prior phase's report — not touched again here).
- No history rewrite, squash, or rebase — the push was a plain fast-forward of new history onto an empty remote.
- No secret exposure — verified in §2 and §4.
- No M14 stop condition bypassed.
- The permanently denylisted Supabase project (`wmamuqylqqikvseuqerm`) was not referenced or touched by any command this phase.

## Summary

| Gate | Status |
|---|---|
| GitHub repository connection | ✅ **Proven** — pushed, SHA-verified, confirmed private, confirmed no secrets |
| Vercel Git integration | ✅ Connected to the existing project (no duplicate project created) |
| GitHub → Vercel auto-deploy | ✅ **Proven** — a real commit (`bf7d2e1`) triggered an automatic build, confirmed via Vercel's own clone log naming that exact commit, and the resulting deployment re-verified against the certified production Supabase project |
| Backup workflow | ⏳ Audited (permissions fixed, retention confirmed sufficient) but still inert — one secret (`SUPABASE_ACCESS_TOKEN`) needed before activation |
| Auth `site_url`/redirect URL | ⏳ Still open from the prior phase — unaffected by this phase's work |
| First real admin | ⏳ Still open — unaffected by this phase's work |
| Log review | ⏳ Still open — unaffected by this phase's work |

**M14 is not being declared fully certified** — per the explicit instruction, the separate Auth URL, first-admin, log-review, and (until the token exists) backup-activation gates remain open. This phase closes the GitHub-connection gate specifically, with real evidence, and reports the auto-deploy limitation honestly rather than fabricating a trigger to paper over it.
