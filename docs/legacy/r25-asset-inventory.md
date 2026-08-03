# R25 Legacy Asset Inventory

> **Module:** M-01 — Legacy Audit & Freeze
> **Status:** Immutable migration reference.

## 1. Summary

All dynamic/product media lives under `thư viện/` ("library"), **53 files total: 48 `.webp` + 5 `.mp4`**. Verified zero broken links / zero orphan files by the legacy `tests/media-integrity.test.js` at time of audit (see baseline test report) — this checker is directly reusable for the M-02 asset migration verification.

## 2. Full listing by directory

### `thư viện/logo biểu tượng 3 đội/` (4 files) — team badges
- `Biểu tượng đội P (Phoenix).webp`
- `Biểu tượng đội T (Tiger).webp`
- `Biểu tượng đội X (Xiphias Gladius).webp`
- `mô tả 3 đội.webp` (group description image)

### `thư viện/Media/` (5 files) — video clips
- `1.mp4` … `5.mp4` — played via Plyr, referenced with a `handleVideoError()` fallback (index.html:9520-9553).

### `thư viện/đội cổ động viên/` (7 files) — fan/supporter photos
- `1.webp` … `7.webp` — used by `GALLERY_ITEMS`.

### `thư viện/Ảnh cầu thủ/` (24 files) — player photos, one per player
Anh Trương, Bảo Anh, Chí Đại, Hoàng Nam, Khánh Hưng, Minh Hiếu, Minh Thế, Mạnh Tuấn, Mậu Quốc, **Nguyễn Sử** (⚠ see mismatch below), Phan Hiền, Phát Tài, Phương Toàn, Quang Minh, Quang Toàn, Thanh Long, Thanh Trúc, Thanh Tú, Thiên Phú, Thành Thái, Tường Khánh, Văn Lân, Đình Huy, Đăng Quân.

**⚠ Data-quality flag:** `PLAYERS_DATA` id 18's display `name` is "Xuân Sử" (index.html:6483-6491) but its asset filename is `Nguyễn Sử.webp`. Confirm the correct real name with the product owner before/at M-02 — do not silently pick one.

### `thư viện/Ảnh hậu cần/` (6 files) — operations/logistics photos
`BAN TRỌNG TÀI.webp` (referee board), `Ban Y tế.webp` (medical team), `Ban hậu cần 1.webp`, `Ban hậu cần 2.webp`, `Ban truyền thông 1.webp`, `Ban truyền thông 2.webp`.

### `thư viện/ảnh logo - banner/` (7 files) — branding assets
`banner PTX Summer Cup.webp`, `icon-192.webp` / `icon-512.webp` (PWA icons — referenced in `manifest.json`), `Logo Công Đoàn.webp`, `Logo PTX.webp`, `logo-cong-doan-ptx-combined.webp` (footer combined logo, added R22/R25), `trang phục thi đấu.webp` (kit/uniform photo).

## 3. External (non-local) dependencies still present

Per `RELEASE-MANIFEST.json`, **3 team group-lineup photos (Team P/T/X) still hotlink from postimg.cc** and are not present as local files in this repo. These must be either:
- downloaded and localized into Supabase Storage during M-02/M09, or
- explicitly registered in the Approved Deprecation Registry if no longer needed.

This is a concrete, named unresolved-blocker candidate to track through M-02's reconciliation plan — it cannot be silently dropped.

## 4. Archive directory (not live assets, historical only)

`archive/` (10 files) — release-candidate audit trail from an earlier R1-R6-ish numbering scheme, explicitly marked not for deployment (`RELEASE-MANIFEST.json`: "không dùng các file trong archive/ để deploy"):
- `FINAL-CANDIDATE-AUDIT.json`, `-R2-` … `-R5-AUDIT.json`, `FINAL-CANDIDATE-SHA256.txt`, `SHA256.txt` — checksummed audit snapshots.
- `PTX Summer Cup 2026 2.4 - Update Version.html` (647KB) — an entire earlier copy of the SPA (pre-R7 architecture), superseded.
- `TEST-REPORT.md` — R6-era manual audit report, predates the current Playwright suite.
- `fix_all_logos.js` — one-off migration script from the earlier postimg.cc → local-webp asset migration (R14).

Treated as historical reference only; not a migration source.

## 5. File hash manifest (key root files, SHA-256, captured at audit time)

```
index.html            a3c7edc0828d42e972ded1c3567a7cc17dc3a011670c5a503a7cdd8189d2be37
ptx_migration_data.json 030a6aad4fbaae3fc29c1db5aa25b71693d78fcf56ec87ace509ac57555642b7
database_schema.sql   53e7345e424756a98a8cee6e12e9f6d9c96e867443742fc0c3b63563059cc2e6
firestore.rules       0cc993b509da6e79ab4fba7e0312c28f70642e1122c3b11db8cba724f2bbfe82
manifest.json         894c498a84adbde9d437a6afdbc87948c4421036cd5b7dd2bdaeb8843df4240a
sw.js                 5431bb43119db93ec2ed7c7bf797279c5e78a81b809edeb852a1e55a888bb42b
reset-admin.html      ee095a47cd008c368ef989d1f7185ab1723f3a0aa4fb547245ca878e04f0acc5
RELEASE-MANIFEST.json ee8deaf7d1a5af82d8f752a5b8220291b1968e99dff71fa7ca7d595ccf3c5c2a
package.json          12b2cd3167b2d9b34070fdf4217e9c95be52c74477d586c32f4cbdb1a6a774f5
docker-compose.yml    9450a7928e56913fa33078dd5b44f61970fb3e40bbe5fa19f30a3f68d4c1edc6
.env.example          578abe07f6ba1ba14417f65530629f700e18f569db50c2f51f85921f4945bad5
```
Note: `RELEASE-MANIFEST.json` itself also embeds SHA-256 checksums for `index.html`/`ptx_migration_data.json` from an earlier R-version snapshot — those internal values are stale relative to the hashes captured here (current R25 state) and should not be treated as authoritative going forward; this file's table is the current baseline of record.

`.env` (real secrets — `POSTGRES_PASSWORD`, `JWT_SECRET`) is intentionally excluded from this manifest and from any migration artifact; it is unused by any code in this repo (see data inventory §3) and should be rotated/discarded rather than migrated.
