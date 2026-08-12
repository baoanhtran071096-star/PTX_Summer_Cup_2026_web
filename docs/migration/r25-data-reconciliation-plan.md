# R25 Data Reconciliation Plan

> **Module:** M-02 — Extraction & Migration Mapping
> **Invariant (per migration directive §7):**
> `SOURCE = MIGRATED + APPROVED DEPRECATED + EXPLICITLY REJECTED WITH EVIDENCE + UNRESOLVED BLOCKER`
> Before Release Candidate (M12): **UNRESOLVED BLOCKER = 0**.

## 1. Reconciliation ledger (per entity)

| Entity | Source count | Extracted | Migrated (planned) | Approved deprecated | Rejected w/ evidence | Unresolved |
|---|---|---|---|---|---|---|
| Teams | 3 (`TEAMS_DATA`) | 3 | 3 | 0 | 0 | 0 |
| Players | 24 (`PLAYERS_DATA`) | 24 | 24 | 0 | 0 | **1** — id 18 name/asset mismatch ("Xuân Sử" vs `Nguyễn Sử.webp`), needs product-owner confirmation of correct name before final import (see §2). |
| Matches (fixtures) | 3 (`MATCHES_CONFIG`) | 3 | 3 | 0 | 0 | 0 |
| Match results/goal events | 0 confirmed occurred as of audit date (tournament not yet played — matches scheduled 2026-08-07, audit performed 2026-08-04) | 0 events found in `ptx_migration_data.json` snapshot | 0 (none exist yet) | 0 | 0 | **1** — must re-check the LIVE admin browser's current `ptx_result_1/2/3` values (not just the snapshot file) immediately before cutover, in case results were entered between the JSON export date (2026-07-30) and cutover. |
| Tournament settings (slogan/message/date/location) | 4 keys | 4 | 4 | 0 | 0 | 0 |
| Hall of Fame | 1 year populated (`hof_2025`, mostly placeholder) | 1 | 1 (with NULLs for undetermined positions) | 0 | 0 | 0 |
| Gallery items | 1 URL in JSON snapshot (`gallery_2025`, postimg.cc) + static `GALLERY_ITEMS` (7 fan photos) + `GALLERY_PAGE_ITEMS` (page-specific, count TBD from live extraction) | partial (JSON snapshot only has 1 of the expected 3-per-year slots filled) | pending live re-extraction | 0 | 0 | **1** — same staleness risk as match results; also the `gallery_2025` URL is external (postimg.cc), needs re-hosting (see asset migration plan). |
| Fan predictions (real visitor submissions) | Unknown / browser-local only, never synced | Not extractable from any server-side source | N/A — see §4 | Likely 0 real submissions recoverable | N/A | **1** — confirm with product owner whether any real fan predictions exist that must be preserved (e.g. from a prior test event on a specific device), or whether this is a clean-slate feature for R25 launch. |
| Admin account | 1 hardcoded (`admin`/`ptx2026` default, possibly changed) | N/A (mechanism replaced, not migrated) | New Supabase Auth admin user created fresh | 0 | 0 | 0 — see auth transition plan (this is a re-platform, not a data copy, so "migrated" here means "equivalent capability re-established," which requires a deliberate action, not extraction). |
| Media assets | 53 files (48 webp + 5 mp4) + 3 external postimg.cc URLs (team group photos) | 53 local + 3 external identified | 53 local (direct copy) + 3 external (pending download) | 0 | 0 | **1** — the 3 postimg.cc team-lineup photos, tracked in asset migration plan. |
| `database_schema.sql` `chat_messages`/`notifications` tables | 0 rows possible (no feature ever wrote to them — draft schema only) | 0 | 0 | **2 tables** — pending M-03 Approved Deprecation Registry entry | 0 | 0 |

## 2. Player id 18 name resolution (blocking item)

`PLAYERS_DATA` (index.html:6483-6491) lists id 18 as **"Xuân Sử"**, team `x`, position DF, but the asset filename is `thư viện/Ảnh cầu thủ/Nguyễn Sử.webp`. This is the single concrete data-quality blocker found in M-01. Action required before final M01 seed: confirm with the product owner (tournament organizer) which name is correct — the display name or the filename — and apply the correction consistently to both the `players.name` value and the Storage object key/alt text. Do not silently pick one; record the resolution and evidence (e.g. organizer confirmation message) in this file once resolved.

**Status: UNRESOLVED — tracked here, must reach 0 before Release Candidate.**

## 3. MODERNIZE decision: player/team/tournament statistics become derived, not stored-and-synced

Legacy `goals`/`assists`/`mvp` on `PLAYERS_DATA` and `ptx_stat_*` counters are independently-maintained counters that the admin updates by hand (`updateStatsAdmin()`, index.html:10225-10233) — they can drift from the actual match-event log, exactly the kind of "independently maintained standings that can diverge from match results" the architecture forbids for standings, extended here to player/tournament statistics for consistency. Target design: `match_events` is the only write path for goals/cards; `players`' apparent goal/assist counts, and tournament-wide totals, are computed via query/view over `match_events`, never manually edited. This is a deliberate improvement over the legacy admin UX (which allowed manually typing a goal count disconnected from any specific match event) and must be called out explicitly to the admin-panel UX designer in M11 (the new admin flow becomes "record a goal event for match X, minute Y, scorer Z" rather than "set player's goal count to N").

## 4. Fan predictions: format/rules preservation vs. data preservation

Since legacy predictions were never server-synced, there is no bulk historical dataset to migrate — reconciliation here means **preserving the product mechanic**, not moving rows:
- Prediction shape (per match: home/away score guess; plus MVP pick, Golden Boot pick, generated ticket code) carries forward into the `predictions` table schema.
- The "no login required, just enter your name" low-friction UX (confirmed as a deliberate design choice, not an oversight, since `PHASE2_FIREBASE_SETUP.md` explicitly scoped predictions as intentionally not synced/authenticated) should be preserved in M07 — anonymous submission with a generated ticket code for later lookup, rather than requiring a full account.
- **Action item before cutover**: ask the product owner whether the organizer's own device holds any predictions from a prior test/soft-launch that should be preserved as historical/demo data (distinct from `SAMPLE_PREDICTIONS`, which is confirmed-fake demo content to be dropped, not migrated).

## 5. Re-extraction requirement before cutover (time-sensitivity)

Because `ptx_migration_data.json` is a point-in-time export (2026-07-30) and the live admin may have entered further data since, **the final data pull for M01 seeding must be a fresh export from the live admin's current browser state** (re-run `exportPtxMigrationData()`, index.html:9877-9916) or a fresh read of the live Firestore `tournamentState`/`players` docs if cloud sync was active — not a reuse of the already-audited JSON snapshot. This reconciliation plan's counts are based on the snapshot and must be re-verified at actual cutover time; treat every count above with an implicit "as of 2026-07-30 snapshot, re-check before cutover" caveat.

## 6. Unresolved blocker count as of this plan

**3 unresolved items** (player-18 name, match-results/gallery staleness re-check, fan-prediction historical-data confirmation) + **1 pending classification** (chat_messages/notifications deprecation, expected to resolve cleanly in M-03). None of these block M00-M01 scaffolding work from proceeding (they are data-population concerns, not schema/architecture concerns), but **all must reach 0/resolved before the M12 Release Candidate gate**, per the migration directive's invariant.
