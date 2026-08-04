# R25 Asset Migration Plan

> **Module:** M-02 — Extraction & Migration Mapping
> **Source:** `docs/legacy/r25-asset-inventory.md` (M-01, frozen — 53 local files + 3 external hotlinks).

## 1. Target: Supabase Storage buckets

`public/` in the new architecture is reserved for immutable, deployment-time static assets only (Architecture v1.3 §8). All of the following are **dynamic/admin-manageable** media and must live in Supabase Storage, not `public/`.

| Bucket | Source folder | Contents | Access |
|---|---|---|---|
| `team-logos` | `thư viện/logo biểu tượng 3 đội/` | 3 team badges + 1 group description image | public read, admin write |
| `player-avatars` | `thư viện/Ảnh cầu thủ/` | 24 player photos | public read, admin write |
| `gallery` | `thư viện/đội cổ động viên/`, `thư viện/Media/`, gallery URL overrides | 7 fan photos, 5 mp4 clips, admin-added gallery images | public read, admin write |
| `operations-media` | `thư viện/Ảnh hậu cần/` | 6 logistics/referee/medical/comms team photos | public read (or admin-only if not meant for public gallery — confirm with M-03), admin write |
| `branding` | `thư viện/ảnh logo - banner/` | banner, PWA icons, PTX/Công Đoàn logos, kit photo | public read, admin write (PWA icons specifically also need a build-time copy into the Next.js `app/` icon convention — see below) |

Bucket naming/count may be simplified during M09 implementation (e.g. a single `media` bucket with folder prefixes) — this table defines the **content mapping**, not a frozen bucket-count requirement.

## 2. PWA icon special case

`icon-192.webp`/`icon-512.webp` (currently in `thư viện/ảnh logo - banner/`) are referenced by `manifest.json` as installable-app icons. Since Next.js's App Router has a first-class icon convention (`app/icon.png`/`app/manifest.ts`), these two specific files should be **duplicated**: one copy as a build-time static asset under `src/app/` (immutable, versioned with the app), and — only if the product wants runtime-admin-replaceable app icons (unlikely/unnecessary) — a second copy in the `branding` bucket. Recommendation: treat PWA icons as static/build-time only; do not put them in Storage. Flag this exception in M-03's parity contract so it isn't miscounted as "media that should have migrated to Storage but didn't."

## 3. External dependency resolution (blocking item, tracked from M-01)

**Status (M12.5): resolved for Team P, source-lost for Team T/X — see below.**

**3 team group-lineup photos (Team P/T/X) still hotlink from `postimg.cc`**, not present as local files.

- **Team P**: source URL still live (HTTP 200), downloaded and uploaded to the `gallery` bucket in M12.5.
- **Team T** and **Team X**: source URLs return HTTP 404 — confirmed dead, not a transient failure (re-checked). No other copy of these images exists anywhere in the legacy asset inventory (`docs/legacy/r25-asset-inventory.md`) or extraction manifest.

Per product-owner decision (M12.5): these are **not** an Approved Deprecation Registry entry — the team group-lineup photo capability is **preserved** as an approved product capability, not dropped. Team T/X are instead marked with an explicit status:

**`SOURCE_LOST_PENDING_REPLACEMENT`** — the legacy source asset is unrecoverable; a replacement photo may be supplied later by the product owner and uploaded via the existing `scripts/upload-r25-media.js` / admin media-upload path into the `gallery` bucket. Until a replacement is supplied:
- Do **not** fabricate, generate, or substitute a placeholder/stock photo in its place.
- Any future UI that renders team group-lineup photos (none exists yet — see `docs/gates/m09-evidence.md`, which scoped M09 to avatar/logo wiring only, not a public gallery display) **must** degrade gracefully when no verified image exists for a team (e.g. omit the slot / show an explicit "photo not yet available" state) — never a broken `<img>` or a fabricated image.
- This gap must never be represented as "migrated" or "0 broken/orphan" in any integrity check (§4 below) until a real replacement is uploaded.

Same applies to the `gallery_2025` postimg.cc URL found in `ptx_migration_data.json` (§1 of the reconciliation plan) — re-verify against the live/current gallery override before cutover, since it may have already been localized since the snapshot was taken.

## 4. Verification method (reuse existing legacy tooling)

`tests/media-integrity.test.js` already implements a broken-link/orphan-file checker against `thư viện/` vs. references in `index.html`/`sw.js`/`manifest.json`/`reset-admin.html`, and passed with **0 broken links, 0 orphan files** at baseline (see `r25-baseline-test-report.md`). The M09 media migration must ship an equivalent integrity check against the new Storage bucket structure (adapted to check Storage object existence + reference resolution in the Next.js codebase instead of local filesystem paths), preserving the same "0 broken, 0 orphan" invariant as a machine-enforceable gate.

## 5. File naming / encoding note

Several source filenames contain Vietnamese diacritics and spaces (e.g. `Đình Huy.webp`, `logo biểu tượng 3 đội/`). Supabase Storage object keys support UTF-8, but as a matter of engineering hygiene the migration script should **normalize object keys** (e.g. slugify to ASCII, keep the original Vietnamese name only as a `caption`/`alt_text` metadata field in the corresponding Postgres row) rather than reproducing raw diacritic+space paths as Storage keys, to avoid URL-encoding fragility (the legacy code already works around this with `encodeURI()` calls, e.g. index.html:6304 — a code smell worth not repeating). This is a REFINE decision for M-03, not a data-loss risk, since the display name is preserved in the database regardless of storage key naming.

## 6. Migration script

See `scripts/migrate-r25-assets.js` (dry-run capable, produces a manifest of planned uploads without requiring Supabase credentials — see script header for usage). Full upload execution is deferred to M09 once the Supabase project/bucket structure exists (M01); this script's job now is to produce the definitive source file list + target key + target table/row mapping so M09 has no ambiguity.
