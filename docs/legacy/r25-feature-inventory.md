# R25 Legacy Feature Inventory

> **Module:** M-01 — Legacy Audit & Freeze
> **Status:** Immutable migration reference.
> **Purpose:** Enumerate every product capability implemented in `index.html` (12,957 lines) so M-03 can classify each as PRESERVE / REFINE / MODERNIZE / REPLACE / DEPRECATE, and no capability silently disappears during re-platforming.

Legend for **AI-labeled** features: R25 markets several features as "AI" — verified against source, these are rule-based/simulated, not calls to a real LLM/model API. This matters for M10 scoping (Architecture v1.3 introduces a real `services/ai/` provider boundary — these legacy features are the *product intent* to preserve, with a real AI backend as the MODERNIZE path).

| # | Feature | Legacy location | Description | AI? |
|---|---|---|---|---|
| 1 | Multi-page SPA routing (hash-based) | `pageConfig` (7293-7307), `navigateToPage()`/`navigate()` (7320-7385) | 13 routes: home, about, schedule, standings, teams, players, statistics, gallery, hall-of-fame, rules, contact, sponsor, admin | |
| 2 | Team pages / team stats | `renderTeamStats()` (~8082-8117), `TEAMS_DATA` | Per-team page with radar attribute display | |
| 3 | 5v5 tactical pitch (formations, substitutions) | 8117-8118, 8475-8478, `TACTICAL_FORMATIONS_LIST` (8575-8578) | Interactive lineup builder on Teams page | |
| 4 | FIFA-style player cards | 8926-8929 | Filter by team, 3D hologram tilt on hover | |
| 5 | Player compare (head-to-head) | `openComparePlayersModal()` (8742-8886) | Side-by-side FIFA-style stat compare | |
| 6 | Golden VIP ticket generator | `openVipTicketModal()` (8632-8742) | Canvas-based "3D" ticket for a player | |
| 7 | Team & combined radar charts | `drawTeamRadarCharts()` (~10637-11158) | Canvas API, per-team + combined H2H radar | |
| 8 | Match Center / schedule / live match card | 7457-7460, `renderMatchCard()` (7516+) | Computes live/upcoming/finished from `baseDate` + `MATCHES_CONFIG`, client-clock based | |
| 9 | Live Center widget | `renderLiveCenter()` (9252-9317) | Currently-live match score + elapsed minute | |
| 10 | Standings table | `calculateStandings()` (~7821-7920) | Derived purely from parsed `ptx_result_*` strings | |
| 11 | Statistics page / top scorers podium+table | 9338-9407, 8082 | Sorts `PLAYERS_DATA` by goals/assists | |
| 12 | Tournament Hub (homepage dashboard) | `renderTournamentHub()` (7920-8006), `computeDashboardStats()` (7707-7821) | Leader/top-scorer/MVP/best-GK widgets; historically fixed to hide fake leaders before matches played | |
| 13 | Road to Champion / highlights | `renderRoadToChampion()` (8006-8082) | | |
| 14 | Hall of Fame | `renderHallOfFame()` (9214-9250) | Per-year champion/runner-up/third/golden boot/MVP cards | |
| 15 | Gallery (home teaser + full page) | `renderGallery()` (9171-9199), gallery page (~9553-9609) | Lightbox via CDN `lightbox2` | |
| 16 | Fan Prediction Game + Leaderboard | 11158-11526, `#fan-prediction` (4879) | Score predictions for 3 matches + MVP/Golden Boot picks, ticket code | rule-based "auto-suggest" |
| 17 | Admin Control Center | `#page-admin` (5925-6299), 4 tabs via `switchAdminTab()` (9988-10309) | Matches & Live Results / Player Stats / Content & Hall of Fame / System & Security; quick-goal entry, JSON export, reset/seed demo data | |
| 18 | Referee Digital Toolkit | 12201-12427 | Per-match foul counter, event timeline, 15:00 countdown with whistle/siren | |
| 19 | Stadium DJ Soundboard | 12428-12589 | Web Audio API synthesized sound effects | |
| 20 | Official Match Report Exporter | 12589-12829 | Management/PDF-ish export tool | |
| 21 | Live Stream Broadcast Hub + Press Release generator | 12829+ | | "AI" label |
| 22 | Live Chat (fan cheering) | `#liveChatMessages`/`sendLiveChatMessage()` (11055-11063, 12882-12890) | **Purely client-side, no persistence/broadcast** — messages vanish on reload; not a real chat backend despite `chat_messages` existing in the planned SQL schema | |
| 23 | PTX AI Chatbot | 12006-12106, widget 11114-11153 | Rule-based keyword matcher (`generatePTXBotReply()`, 12067-12101) reading live standings/players data. **Not a real LLM call.** | rule-based |
| 24 | AI Tactical Match Predictor/Analyzer | `runAITacticalAnalysis()` (11944-12006) | Canned/simulated analysis text | simulated |
| 25 | AI Voice Commentator | 11936-11944 | Web Speech API `speechSynthesis`, muted by default | browser TTS, not AI |
| 26 | VAR Review Simulator | `triggerVARReview()` (12108-12146) | Simulated decision overlay, no real video review | |
| 27 | 3D Trophy Rotate | `triggerTrophyRotate()` (12146-12161) | CSS/JS animation | |
| 28 | Goal fireworks / confetti / goal sound | 11818-11887, 9318-9338, 10616-10637 | | |
| 29 | Virtual match clock | 11887-11936 | | |
| 30 | Infographic Canvas Generator/Exporter | `openInfographicModal()` (11526-11739) | | |
| 31 | Sponsor / Donate page | `#page-sponsor` (5737), `copyBankStk()` (8886-8926) | Bank transfer info + QR, sponsorship packages | |
| 32 | Language switcher (vi/en) | 6774-7202, `window.translations` | localStorage `lang` | |
| 33 | Theme switcher | 7397-7426 | **Only `dark`/`light` implemented** — no third "summer" theme exists anywhere in CSS/JS despite the tournament's "Summer Cup" branding. This is a real gap vs. Architecture v1.3's Light/Dark/Summer Identity requirement — Summer Identity is new work, not something to "preserve," in M-03/design-system terms. | |
| 34 | PWA install banner | 12161-12201 | `beforeinstallprompt` capture, dismiss flag `pwa_dismissed` | |
| 35 | Web Share API | `shareResult()` (10556-10570) | | |
| 36 | Floating admin quick-score widget | `toggleFloatingAdmin()` (10570-10616) | | |
| 37 | Login modal / lockout / admin nav gating | 10088-10184 | 5 failed attempts → 5 min lockout | |
| 38 | Reveal-on-scroll animations | `initReveal()` (9407-9449) | IntersectionObserver-driven | |
| 39 | Scroll-to-top button | 9449-9461 | | |
| 40 | Pre-match countdown alert | `checkPreMatchAlert()` (9765-9797) | | |
| 41 | `reset-admin.html` recovery gate | separate file, 285 lines | Standalone admin password recovery, gated by hashed recovery phrase, fully client-side | |

## Cross-cutting security-relevant behaviors to preserve or improve

- Admin login lockout (5 attempts / 5 min) — `handleLogin()` (10109-10184).
- Password hashing via salted SHA-256 (Web Crypto) — `hashPassword()`/`getSalt()` (6710-6739). **Not server-verified** — client-side only, a real gap that M02 (Auth+RBAC) must close via Supabase Auth, not merely port.
- `changeAdminPassword()` regression guards already exist in the legacy test suite (no `prompt()`, no plaintext storage) — preserve the *intent* of these guards as RLS/auth tests in the new stack.
- `reset-admin.html`'s recovery-code gate — explicitly documented in-file as "reinforcement, not absolute security."

## Known pre-existing bugs/inconsistencies to carry into M-03 as explicit decisions (not silently fixed or silently kept)

1. **Duplicate/inconsistent admin-session flag**: primary flag is `adminLoggedIn`, but a second flag `ptx_admin_auth` is checked once at index.html:12948 — likely dead/inconsistent code, not authoritative.
2. **Service worker self-defeat**: `index.html` unregisters any active service worker and deletes all caches on every load (inline script, index.html:4-24), while `sw.js` (cache `ptx-cup-2026-v2-r13`) implements a real network-first/cache-first strategy that is therefore never actually active in production. Decide explicitly in M-03/M09 whether the new PWA strategy replaces this entirely (recommended) rather than porting the contradiction.
3. **3 team group-lineup photos still hotlinked from postimg.cc** (per `RELEASE-MANIFEST.json`), external dependency not yet localized — must be resolved in the asset migration plan (M-02).
4. No "summer" theme variant exists despite branding — flagged above.
