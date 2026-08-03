# R25 Legacy Data Inventory

> **Module:** M-01 — Legacy Audit & Freeze
> **Status:** Immutable migration reference — do not edit to "fix" legacy facts, only to correct inventory errors.
> **Scope:** Every entity, field, and persistence mechanism the live R25 app (`index.html`, R25-PRODUCTION per `RELEASE-MANIFEST.json`) actually reads/writes at runtime, plus the disconnected planned schema found alongside it.

## 0. Two parallel, inconsistent data models

R25 has **two data models that do not talk to each other**:

1. **Runtime model** — plain JS objects/arrays + ad-hoc localStorage strings inside `index.html`. This is what the live product actually uses.
2. **Planned relational model** — `database_schema.sql` (PostgreSQL, 10 tables), wired only into `docker-compose.yml` for a `backend` service whose directory (`./backend`) does not exist in the repo. **Nothing in `index.html` calls this backend.** Treated as a *draft target schema*, not a legacy runtime source.

This inventory documents the runtime model as the migration source of truth, and cross-references the planned schema as a head start for M01 target design.

## 1. Runtime entities

### 1.1 Team (`TEAMS_DATA`, index.html:6302-6309)
Keyed by team id (`p`, `t`, `x`). Fields:
```
id, name, fullName, icon, color, captain,
stats: { attack, defense, speed, power }, ovr, logo
```
Also exported (without `logo`) at `ptx_migration_data.json:4-50`.

### 1.2 Player (`PLAYERS_DATA`, index.html:6311-6552 — 24 records)
```
id, name, team, position ("FW"|"MF"|"DF"|"GK"), avatar, goals, assists, mvp
```
**Known data-quality issue:** player id 18 is named "Xuân Sử" in `PLAYERS_DATA` (index.html:6483-6491 and `ptx_migration_data.json`) but its asset filename is `Nguyễn Sử.webp` — a name/filename mismatch to resolve during migration QA (see asset inventory).

### 1.3 Match (`MATCHES_CONFIG`, index.html:6563-6567 — 3 fixed matches)
```
id, startH, startM, endH, endM, home, away
```
No `date` field per match — a single global `baseDate = new Date('2026-08-07')` (index.html:7460) applies to all 3 matches.

### 1.4 Match result (NOT a structured object — a free-text string)
Stored at localStorage key `ptx_result_<id>` (id 1-3), e.g.:
```
"2-1 | Hiền 12', Huy 23'"
```
Format: `"<homeScore>-<awayScore>" | "<scorerName> <minute>'", ...`. Parsed by `parseGoalDataWithTeam()` (index.html:7468-7499) and `getMatchResult()` (index.html:7501-7514). Scorer's team is resolved by fuzzy name-matching against `PLAYERS_DATA` — **there is no explicit scorer-team field, no assist tracking, no card/foul events** in this encoding. This is the single most important structural gap for M05 (Match Engine): the target schema needs a real `match_events` table with typed `event_type`, `player_id`, `minute`.

### 1.5 Live stats (`LIVE_STATS_DATA`, index.html:6573-6578)
Static/demo, not per-match: `{ possession: [55,45], shots: [8,5], corners: [4,3], fouls: [7,6] }`. Not real data — treat as placeholder, not a migration source.

### 1.6 Hall of Fame
Pipe-delimited string per year at localStorage key `hof_<year>` (e.g. `hof_2025`):
```
"champion | runnerUp | thirdPlace | goldenBoot | mvp"
```
Parsed in `renderHallOfFame()` (index.html:9214-9249), 5 fixed positions mapped to award icons (🏆🥈🥉⚽⭐).

### 1.7 Gallery
Two independent sources:
- Static fallback `GALLERY_ITEMS` (index.html:9150-9169): `{ year, label, img }`.
- Admin-editable override `gallery_<year>` localStorage key: pipe-delimited string of exactly 3 image URLs (`"<opening>|<matchday>|<awards>"`), expanded into 3 items by `renderGallery()` (index.html:9171-9199).
- A second, separate gallery page uses `GALLERY_PAGE_ITEMS`/`renderGalleryPage()` (index.html ~9556).

### 1.8 Fan predictions (client-only, never cloud-synced)
- Seed sample array `SAMPLE_PREDICTIONS` (index.html:11161-11166): `{ name, p1, t1, t2, x2, x3, p3, mvpId, points, ticket }`.
- Visitor's own prediction at `ptx_user_prediction` (index.html:11231-11232): `{ name, p1, t1, t2, x2, x3, p3, mvpId, goldenBootId, ticket, date }`.
- `ptx_user_predictions_list` — other visitors' predictions, rendered on leaderboard only when `ptx_show_sample_predictions === 'true'`.

Per `PHASE2_FIREBASE_SETUP.md:88`, predictions are **explicitly not synced to Firestore** — this is real user-facing data that lives only in each visitor's browser and will otherwise be lost; flagged in the reconciliation plan as data at genuine risk of loss if not proactively captured (there is likely nothing to migrate per-user since it's local-only and ephemeral, but the *format/rules* must carry forward — see M-02).

### 1.9 Admin/auth "user"
Single hardcoded admin account, not a users table: `ptx_admin_user` (username), `ptx_admin_hash` (salted SHA-256 via Web Crypto), `ptx_salt`. Default credentials `admin`/`ptx2026` auto-seeded by `initAdminAccount()` (index.html:6741-6753). No multi-user/role model exists in the runtime — `database_schema.sql`'s `users` table (email/username/password_hash/role) is aspirational only.

## 2. Firestore collections actually used

Only `tournamentState`, via `DOC_MAP` (index.html:6607-6611):
| Firestore doc | localStorage keys mapped |
|---|---|
| `results` | `ptx_result_1`, `ptx_result_2`, `ptx_result_3` |
| `stats` | `ptx_stat_goals`, `ptx_stat_matches`, `ptx_stat_yellow`, `ptx_stat_red` |
| `eventInfo` | `ptx_slogan`, `ptx_msg`, `ptx_date`, `ptx_location` |
| `players` (separate doc) | `ptx_players_data` (stringified `PLAYERS_DATA` override) |

Hall of Fame, gallery, predictions, language, theme, current-page are **explicitly not synced** (confirmed in `PHASE2_FIREBASE_SETUP.md:84-90`) — these exist only in each browser's localStorage and must be captured from the live admin's browser (or from `ptx_migration_data.json`, which is a manual export snapshot) before they can be migrated; they cannot be recovered from Firestore.

## 3. Planned relational schema (`database_schema.sql`) — reference only

10 tables, more normalized than the runtime model: `teams`, `users`, `players` (has `legacy_id`, `rating`), `matches` (has `match_date`, `home_score`/`away_score`, `status`), `match_events` (typed `event_type`, `player_id`, `minute`, `additional_info JSONB`), `hall_of_fame` (structured), `gallery` (has `uploaded_by`, `likes`), `chat_messages`, `predictions` (structured, has `points`), `notifications`.

**Important:** `chat_messages` and `notifications` have **zero corresponding UI/feature** in the live app (the "chat" widgets are ephemeral DOM-only mockups, never persisted or broadcast). Do not assume these tables imply an existing feature to migrate — they are schema drafts for capability that was never built. M-03 must classify them explicitly (likely DEPRECATE-from-schema or DEFER, not silently carried into M01).

## 4. Canonical export snapshot

`ptx_migration_data.json` (334 lines) is generated by `exportPtxMigrationData()` (index.html:9877-9916) — the closest thing to a formal single-file dump of all `ptx_*`/`hof_*`/`gallery_*` localStorage keys. Use this file, not a fresh scrape, as the primary extraction source in M-02 wherever it is current (cross-check its timestamp/content against the live admin browser's localStorage before trusting it as final, since it is a manual point-in-time export, not a live sync).

## 5. Known data-quality flags carried into M-02/M-03

1. Player id 18 name/filename mismatch ("Xuân Sử" vs `Nguyễn Sử.webp`) — needs resolution (confirm correct name with source of truth) before/at migration, not silently "fixed" one way.
2. Match results, statistics, and Hall of Fame are all encoded as fragile pipe-delimited/free-text strings with no schema validation — parsing logic (index.html:7468-7514, 9214-9249) is the *only* specification of the format; there is no separate schema doc.
3. Fan predictions and Hall of Fame/gallery overrides are **not cloud-synced** — they exist only in whatever browser last wrote them (likely the tournament organizer's own laptop) or in the `ptx_migration_data.json` snapshot. This is the highest-risk category for silent data loss and must be confirmed with the product owner before M-02 finalizes its reconciliation plan.
4. `database_schema.sql`'s `chat_messages`/`notifications` tables do not correspond to any real persisted feature — do not migrate data that doesn't exist; do not build these tables into M01 unless M-03 explicitly scopes multi-user chat/notifications as in-scope for v1.
