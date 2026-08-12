# R25 Parity Matrix

> **Module:** M-03 — Parity Specification
> **Depends on:** `docs/legacy/*` (M-01), `docs/migration/r25-source-to-target-map.md` (M-02).
> **Classification legend:**
> - **PRESERVE** — keep existing content/behavior/identity as-is.
> - **REFINE** — preserve concept/outcome while improving implementation or UX.
> - **MODERNIZE** — upgrade deliberately without destroying PTX identity.
> - **REPLACE** — replace legacy implementation while preserving intended outcome.
> - **DEPRECATE** — remove, only with explicit reason + impact analysis (see `r25-approved-deprecation-registry.md`).

## 1. Data entities

| Item | Classification | Rationale |
|---|---|---|
| Teams (3: Phoenix/Tiger/Xiphias, colors, captains, stats, OVR) | **PRESERVE** | Core recognizable identity; no reason to change roster/branding data. |
| Players (24, name/team/position/avatar) | **PRESERVE** (content) + **REFINE** (id-18 name/asset resolution) | Roster is real, current, pre-tournament data — preserve. Fix the one known name/filename inconsistency as part of preservation, not a redesign. |
| Player goals/assists/MVP as manually-set counters | **MODERNIZE** | Replace with values derived from `match_events` (see reconciliation plan §3) — same visible outcome (a goals column on the stats page), fundamentally more reliable mechanism. |
| Matches (3 fixtures, kickoff times) | **PRESERVE** | Real scheduled fixtures. |
| Match results as pipe-delimited strings | **REPLACE** | Free-text encoding replaced by structured `match_events` (typed goal/assist/card rows) — same product outcome (a result appears), robust implementation. |
| Tournament-wide stat counters (`ptx_stat_*`) | **MODERNIZE** | Become derived aggregates, not independently-editable numbers. |
| Tournament settings (slogan/message/date/location) | **PRESERVE** | Direct content carryover, admin-editable in new admin panel. |
| Hall of Fame (per-year champion/runner-up/etc.) | **PRESERVE** (structure/intent) + **REFINE** (NULL instead of placeholder text for undetermined positions) | |
| Gallery (static + admin override images) | **PRESERVE** (content) + **MODERNIZE** (proper `gallery_media` table + Storage instead of pipe-delimited URL strings) | |
| Fan predictions (per-visitor, anonymous, ticket code) | **PRESERVE** (mechanic: no-login, ticket-code lookup) + **MODERNIZE** (server-persisted `predictions` table instead of localStorage-only) | Confirmed deliberate low-friction UX (not an oversight) — preserving the "no account needed" flow is a product decision, not a technical shortcut. |
| `SAMPLE_PREDICTIONS` demo/seed data | **DEPRECATE** | Fake data presented as real predictions on the leaderboard toggle; do not carry into production. See deprecation registry. |
| Admin single-hardcoded-account model | **REPLACE** | Supabase Auth + `profiles.role` — see auth transition plan. Preserves "one admin, full control" outcome; replaces the insecure mechanism entirely. |
| `chat_messages`, `notifications` (draft schema, no live feature) | **DEPRECATE** (from v1 scope) | No corresponding feature ever existed; do not build unused tables. Re-scope later only via a real product decision, not by default inertia from the old draft schema. |

## 2. Features (see `docs/legacy/r25-feature-inventory.md` for full location detail)

| Feature | Classification | Rationale |
|---|---|---|
| Multi-page routing / 13-route IA | **PRESERVE** (route set/names) + **MODERNIZE** (Next.js App Router file-based routing instead of hash routing) | |
| Team pages / team stats | **PRESERVE** | |
| 5v5 tactical pitch (formations, subs) | **PRESERVE** | Distinctive, well-liked interactive feature; no reason to cut. |
| FIFA-style player cards + 3D tilt | **PRESERVE** | Core visual identity of the Players section. |
| Player compare | **PRESERVE** | Named explicitly in Architecture v1.3 as a target capability (M04). |
| Golden VIP ticket generator | **PRESERVE** | |
| Team & combined radar charts | **PRESERVE** | Named explicitly in Architecture v1.3 (M04 Radar). |
| Match Center / schedule / live match card | **PRESERVE** (product) + **MODERNIZE** (server-authoritative match status instead of client-clock derivation, per Architecture v1.3 M08 Realtime) | |
| Live Center widget | **PRESERVE** (product) + **MODERNIZE** (real Supabase Realtime push instead of client-clock polling) | |
| Standings table | **PRESERVE** (product) + **MODERNIZE** (derived from `match_events` via domain ranking rules, matching Architecture v1.3 §6 Standings source-of-truth rule) | |
| Statistics / top scorers / top assists | **PRESERVE** (product) + **MODERNIZE** (derived aggregates) | |
| Tournament Hub / dashboard | **PRESERVE** | Includes the historical "hide fake leaders before matches played" fix — preserve that safeguard's *intent* in the new dashboard logic. |
| Road to Champion / highlights | **PRESERVE** | |
| Hall of Fame page | **PRESERVE** | |
| Gallery (home teaser + full page) | **PRESERVE** (product) + **REPLACE** (lightbox2 CDN dependency → a maintained equivalent chosen in M09) | |
| Fan Prediction Game + Leaderboard | **PRESERVE** (mechanic) + **MODERNIZE** (server-persisted, real scoring via domain rules in M07) | |
| Admin Control Center | **PRESERVE** (capability set: matches/players/content/system) + **MODERNIZE** (Architecture v1.3 M11 Admin Control Center: proper CRUD, users/roles, audit trail replacing the 4-tab localStorage-driven panel) | |
| Referee Digital Toolkit | **PRESERVE** | Distinctive operational tool, no reason to cut; re-scope its persistence (event log) into `match_events` where it overlaps (goal/card entry) rather than duplicating a separate local-only log. |
| Stadium DJ Soundboard | **PRESERVE** | Low risk, purely client-side fun feature, part of matchday identity. |
| Official Match Report Exporter | **PRESERVE** | |
| Live Stream Broadcast Hub + "AI Press Release" | **PRESERVE** (broadcast hub) + **MODERNIZE** (press-release generation becomes a real `services/ai/`-backed feature in M10 instead of a canned/simulated one, if scoped for v1 — else PRESERVE as a simple template tool) | |
| Live Chat (fan cheering) | **DEPRECATE (mock, resolved M12.5)** + **approved future backlog (REPLACE, out of current scope)** | Never actually functional (ephemeral, non-persisted, no real backend). Product-owner decision (M12.5): deprecate and remove the non-functional mock with no data migration (nothing to migrate); a genuine authenticated, persistent, moderated Realtime-backed chat is preserved as an approved future capability, not built in this release, not blocking M12.5/M13. See `docs/migration/r25-approved-deprecation-registry.md` entry #3. |
| PTX AI Chatbot (rule-based) | **MODERNIZE** | Product intent (an assistant that explains standings/stats/rules) preserved; implementation becomes a real `features/ai/` + `services/ai/` boundary per Architecture v1.3 §15, backed by verified domain data — not a bigger rule-based matcher. |
| AI Tactical Match Predictor (simulated) | **MODERNIZE** | Same rationale — real AI explains verified data rather than generating canned copy. AI must not become authoritative for match outcomes (Architecture v1.3 §15/§16). |
| AI Voice Commentator (browser TTS) | **PRESERVE** | Legitimately just Web Speech API, not misrepresented as "AI decision-making" — fine to keep as-is. |
| VAR Review Simulator | **PRESERVE** | Explicitly a simulator/fun feature, not misrepresented as real video review — no parity concern. |
| 3D Trophy Rotate / goal fireworks / confetti / sounds | **PRESERVE** | Pure presentation polish, part of Summer Cup character. |
| Virtual match clock | **PRESERVE** (product) + **MODERNIZE** (sourced from server-authoritative match status once M08 lands, not purely client `Date.now()`) | |
| Infographic Canvas Generator | **PRESERVE** | |
| Sponsor / Donate page | **PRESERVE** | |
| Language switcher (vi/en) | **PRESERVE** | |
| Theme switcher (dark/light only) | **MODERNIZE** | Extend to Light/Dark/**Summer** per Architecture v1.3 — Summer is new work, not a port (none exists in R25), but the existing dark/light behavior itself is preserved as two of the three. |
| PWA install banner | **PRESERVE** | |
| Web Share API | **PRESERVE** | |
| Floating admin quick-score widget | **PRESERVE** (capability) + **MODERNIZE** (writes a real `match_events` row via a Server Action instead of a localStorage string mutation) | |
| Login modal / lockout / admin nav gating | **REPLACE** | See auth transition plan — Supabase Auth + RLS. |
| Reveal-on-scroll animations, scroll-to-top, pre-match countdown alert | **PRESERVE** | Minor UX polish, no reason to change. |
| `reset-admin.html` recovery gate | **REPLACE** | Supabase Auth password-reset-email flow (auth transition plan §2). |
| Service worker cache-buster contradiction (sw.js vs. inline unregister script) | **REPLACE** | Design a single coherent PWA caching strategy in M09; do not port the self-defeating pair. |
| Duplicate/inconsistent `ptx_admin_auth` flag | **DEPRECATE** (dead code, not a feature) | Not a real capability — an inconsistency to not reproduce. |

## 3. Visual identity (see `docs/legacy/r25-ui-inventory.md`)

| Item | Classification | Rationale |
|---|---|---|
| Navy/orange/gold palette + 3 team colors | **PRESERVE** | Mandatory Visual Identity Baseline — the core recognizable brand. |
| 'Bebas Neue'/'Barlow Condensed' display type pairing | **PRESERVE** | |
| 13-route IA, dual desktop-nav/mobile-bottom-nav pattern | **PRESERVE** | No documented UX justification exists for changing navigation mental model — don't change it without one (per directive §11). |
| Card-based layout, `--radius-card` rounded elevated surfaces | **PRESERVE** | |
| Inline/scattered hex colors (untokenized) | **MODERNIZE** | Consolidate into PTX Sports Luxe semantic tokens (Architecture v1.3 §4/§14) — visual *result* preserved, implementation made compliant. |
| Light/Dark themes | **PRESERVE** | |
| Summer theme/identity | **New work, not classified as legacy parity** | Does not exist in R25; required net-new by Architecture v1.3, designed to strengthen (not replace) the existing brand per the directive's Design System Contract. |
| `lightbox2`/`plyr` CDN dependencies | **REPLACE** | Generic third-party libraries, not brand identity — swap for actively maintained equivalents in the new stack. |

## 4. Open items requiring explicit product-owner decision

1. **Live Chat** — ✅ **Resolved M12.5**: deprecate the non-functional mock (no migration), preserve a real implementation as approved future backlog, not in current scope. See deprecation registry entry #3.
2. **Player id 18 name** — ✅ **Resolved M12.5**: "Xuân Sử" confirmed correct. See deprecation registry entry #7.
3. **Fan predictions historical data** — ✅ **Resolved M12.5**: confirmed no real historical data exists to preserve; clean-slate launch.
4. **Operations-media gallery** (referee/medical/comms team photos) — public gallery content or admin/internal only? Implemented as **public-read** by default (`operations-media` bucket, `public = true` in `supabase/config.toml`, M09) since no restriction was explicitly requested and the legacy site displayed these photos openly on the public site. Revisit if the product owner wants this restricted.
5. **AI Press Release generator** — not built as a separate feature in M10; only the general-purpose chatbot (verified-data-only) was implemented. The "AI Press Release" capability specifically remains unbuilt — tracked as backlog, not silently claimed as done.

Items 1-3 are closed as of M12.5 Production Readiness Closure (`docs/gates/m12.5-evidence.md`). Items 4-5 are default/implicit resolutions taken during implementation, documented here for transparency rather than re-litigated without a specific reason to.
