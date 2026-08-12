# R25 Approved Deprecation Registry

> **Module:** M-03 — Parity Specification
> **Rule:** Nothing meaningful may silently disappear. Every entry here requires: reason, impact analysis, and an approval record. Items are added here, not deleted quietly from the parity matrix.

## Entries

### 1. `SAMPLE_PREDICTIONS` demo/seed data
- **What:** Hardcoded fake fan predictions (index.html:11161-11166) optionally shown on the prediction leaderboard via `ptx_show_sample_predictions` toggle.
- **Reason:** Fabricated data presented as if it were real user submissions is misleading in a production tournament product; it exists only to make the leaderboard look populated before real submissions arrive.
- **Impact analysis:** Zero real users affected (no one's real data is lost — it was demo content). The leaderboard will show "no predictions yet" instead of fake entries until real fans submit. Recommend a proper empty-state UI instead (REFINE of the empty state, not a loss of a real feature).
- **Approval:** **APPROVED (final)** — product owner confirmed dropping entirely during M12.5 Production Readiness Closure. No code change required: the M07 implementation never seeded or rendered this data in the first place.

### 2. `chat_messages` / `notifications` draft Postgres tables (from `database_schema.sql`)
- **What:** Two tables in the legacy draft relational schema with zero corresponding built feature — no UI ever wrote to them; the "chat" widgets that exist are ephemeral DOM-only mockups.
- **Reason:** No real functionality exists to migrate; building unused tables/RLS policies in M01 would be premature scope not justified by any current requirement (Architecture v1.3 §16 explicitly excludes premature scope).
- **Impact analysis:** No data loss (none exists). No user-facing feature removed (the legacy "chat" never persisted anything, so nothing observable changes for end users if it's simply not present in the same form at launch).
- **Approval:** **APPROVED (final)** — product owner's M12.5 decision on item 3 (build a real Live Chat later, as an explicitly out-of-scope future capability) confirms this draft schema stays unused for now; a proper `chat_messages`-equivalent table will be designed fresh whenever that future feature is actually scoped, not resurrected from this draft as-is.

### 3. Legacy "Live Chat" fan-cheering widget
- **What:** `#liveChatMessages`/`sendLiveChatMessage()` (index.html:11055-11063, 12882-12890) — client-only, non-persisted, vanishes on reload, never broadcasts to other viewers.
- **Reason:** Never actually functional as a real chat feature; porting it as-is would reproduce a non-functional mock in the new product.
- **Impact analysis:** No regression for real users (it never worked as "chat" in the sense of connecting people) — but the UI element itself was visible/interactive, so its removal (if not replaced) is a visible change to page layout and should be communicated to the product owner rather than silently dropped.
- **Approval:** **APPROVED (final, M12.5)** — product owner decision: deprecate and remove the non-functional R25 mock with **no data migration** (there is nothing to migrate — it never persisted anything). A genuine authenticated, persistent, moderated Realtime-backed Live Chat is **preserved as an approved future product capability**, explicitly out of current release scope. It does not block M12.5 or M13, and is only built if/when explicitly promoted into a future module's scope — tracked as backlog in `r25-parity-matrix.md` §4, not silently dropped and not fabricated as "done."

### 4. `docker-compose.yml` planned `postgres`/`backend`/`frontend` Docker services
- **What:** Compose services referencing `./backend`/`./frontend` directories that do not exist in the repo, plus the associated `.env` `POSTGRES_PASSWORD`/`JWT_SECRET` values.
- **Reason:** Confirmed unused by any code in the repository (M-01 finding) — an aspirational scaffold for an architecture (self-hosted Postgres + custom Node backend) that the frozen Architecture v1.3 (Supabase-hosted Postgres) supersedes.
- **Impact analysis:** None — nothing currently depends on this file executing successfully; `docker-compose up` would already fail today at the `backend` build step.
- **Approval:** Approved — superseded by Supabase-managed infrastructure per Architecture v1.3. `.env`'s `POSTGRES_PASSWORD`/`JWT_SECRET` values should be rotated/discarded rather than carried into the new environment configuration, since they were never live secrets protecting anything running in production.

### 5. Service worker cache-buster contradiction
- **What:** `sw.js`'s network-first/cache-first caching strategy is immediately neutralized by an inline script in `index.html` (lines 4-24) that unregisters any service worker and clears all caches on every page load.
- **Reason:** The pairing is self-defeating as shipped — `sw.js` has never actually provided its intended offline/caching benefit in production. Porting this contradiction forward would carry a known bug into the new stack.
- **Impact analysis:** No functional loss — the existing PWA "benefit" from `sw.js` was already not being realized. A fresh, coherent PWA caching strategy will be designed in M09 (or explicitly decided against, if not a priority for v1).
- **Approval:** Approved — REPLACE per parity matrix §2, design fresh in M09.

### 6. `ptx_admin_auth` duplicate/inconsistent localStorage flag
- **What:** A second admin-session flag checked once at index.html:12948, inconsistent with the primary `adminLoggedIn` flag.
- **Reason:** Dead/buggy code, not a real capability to preserve.
- **Impact analysis:** None — this was never the authoritative session mechanism; removing it (by replacing the entire auth mechanism per the auth transition plan) causes no behavior change beyond what the auth REPLACE already causes.
- **Approval:** Approved — implicitly resolved by the M02 Auth+RBAC replacement; no standalone action needed.

### 7. Player `legacy_id` 18 name/asset mismatch resolution
- **What:** `PLAYERS_DATA` display name "Xuân Sử" vs. photo asset filename `Nguyễn Sử.webp` (`docs/legacy/r25-data-inventory.md` §1.1).
- **Reason:** Needed a real, non-fabricated answer — not something inferable from the data itself.
- **Decision (M12.5, product owner):** "Xuân Sử" is the correct name; the asset filename is the error.
- **Impact analysis:** No data loss. Applied by seeding `players.name = 'Xuân Sử'` (unchanged from the live site) and uploading the photo under a Storage object key/caption that reflects the correct name rather than the erroneous filename (see `docs/gates/m12.5-evidence.md`).
- **Approval:** Resolved, not a deprecation — recorded here for a single authoritative decision trail alongside the other M12.5 closures.

## Summary

| # | Item | Status |
|---|---|---|
| 1 | `SAMPLE_PREDICTIONS` demo data | **Approved (final, M12.5)** |
| 2 | `chat_messages`/`notifications` draft tables | **Approved (final, M12.5)** |
| 3 | Live Chat widget | **Approved (final, M12.5)** — deprecate mock, no migration; real chat preserved as approved future backlog |
| 4 | Docker/`backend`/`frontend` compose scaffold | Approved |
| 5 | Service worker contradiction | Approved |
| 6 | `ptx_admin_auth` dead flag | Approved |
| 7 | Player 18 name/asset resolution | **Resolved (M12.5)** — "Xuân Sử" confirmed correct |

**Unresolved deprecation items: 0.** All resolved as of M12.5 Production Readiness Closure — see `docs/gates/m12.5-evidence.md` for the full closure record.
