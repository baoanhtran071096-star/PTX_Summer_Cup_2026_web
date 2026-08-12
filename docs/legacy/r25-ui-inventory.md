# R25 Legacy UI / Visual Identity Inventory

> **Module:** M-01 — Legacy Audit & Freeze
> **Status:** Immutable migration reference — this is the mandatory Visual Fidelity baseline for M-03's `r25-visual-fidelity-contract.md`.

## 1. Navigation / information architecture (Vietnamese route names)

Trang chủ, Giới thiệu, Lịch thi đấu, BXH (Bảng Xếp Hạng), Đội bóng, Cầu thủ, Thống kê, Thư viện, Vinh danh (Hall of Fame), Điều lệ, Liên hệ, Quản trị, Tài Trợ & Donate.

Source: `window.translations.vi` (index.html:6780+), `pageConfig` (7293-7307). Nav uses a desktop `.nav-links` plus a mobile `.bottom-nav` tab bar pattern, and a collapsed `<details>` "🧰 Công cụ nâng cao" group for secondary tools (AI Media Center, Matchday Audio Center, VAR Replay Simulator, Export Center) — this collapsing pattern was a deliberate UX decision (per `RELEASE-MANIFEST.json` R21 changelog), not incidental.

## 2. Design tokens actually in use (CSS custom properties, index.html:64-90)

```
--navy: #1D3557
--ptx-orange: #F15A24
--white: #FFFFFF
--gold: #D4A13E
--bg-light: #F8FAFC
--text-dark: #1A1A1A
--text-muted: #64748B
--team-p-color: #1A5BB5   (Phoenix — blue)
--team-t-color: #D32F2F   (Tiger — red)
--team-x-color: #F5A623   (Xiphias — orange/gold)
--live-red: #dc2626
--shadow-card
--radius-card: 20px
--transition
--bottom-nav-height: 68px
```

Theme overrides via `[data-theme="dark"]` (92-101) and `[data-theme="light"]` (103-112) redefine `--navy`, `--bg-body`, `--bg-card`, `--text-primary`, `--text-muted`, `--border-color`, `--nav-blur`, `--shadow-card`.

**Gap vs. target Design System:** only Light/Dark exist (113 `--xxx` variable declarations total). **No `--summer` token set or third theme variant exists anywhere** in CSS or JS (confirmed by exhaustive grep for `summer`/`data-theme`) — despite the product being branded "Summer Cup." Architecture v1.3's PTX Sports Luxe Light/Dark/**Summer** Identity is genuinely new design work, not a port. The 3 team colors (`--team-p/t/x-color`) and navy/orange/gold palette ARE the recognizable brand identity to preserve and carry into the new semantic token layer.

Beyond the 113 tokenized variables, there are many more **raw inline hex colors** scattered through the file for feature badges/icons (e.g. `#f97316`, `#7c3aed`, `#3b82f6`, `#ec4899`, `#10b981`, `#a855f7`) that are not tokenized — these need consolidation into the new semantic token system (M00 design token audit / M-03 visual fidelity contract), not one-for-one preservation as hardcoded values (Architecture v1.3 §4/§14 explicitly forbids hardcoded semantic colors in components).

## 3. Typography

```
--font-logo: 'Bebas Neue'
--font-title: 'Barlow Condensed'
--font-ui: 'Be Vietnam Pro', 'Inter', system-ui
```
Loaded via Google Fonts CDN (index.html:55). Fluid typography via `clamp()` used extensively (e.g. index.html:5928, 5469).

## 4. Third-party visual dependencies

- `lightbox2` v2.11.3 (CDN CSS+JS) — gallery lightbox.
- `plyr` v3.7.8 (CDN CSS+JS) — video player, with a `handleVideoError()` fallback (index.html:9520-9553).

Both need replacement/equivalent choice in the Next.js stack (M09/M03 — likely REPLACE, not REFINE, since these are generic CDN libraries not part of PTX brand identity).

## 5. Responsive behavior

113 `@media`/`max-width`/`min-width` occurrences file-wide. Mobile bottom-nav tab bar (`.bottom-nav .nav-item`) coexists with desktop top nav (`.nav-links`) — this dual-nav pattern is part of the recognizable mobile UX and should be preserved conceptually (Architecture-compliant reimplementation, not a redesign of the navigation mental model per the migration directive's Visual Fidelity rule).

## 6. PWA branding metadata (`manifest.json`)

```
name: "PTX Summer Cup 2026"
short_name: "PTX Cup"
start_url: "./index.html"
display: "standalone"
background_color / theme_color: "#1D3557"
lang: "vi"
icons: 192/512 (webp, maskable)
screenshots: 1 (1280x720)
categories: ["sports", "entertainment"]
```
Matches `<meta name="theme-color" content="#1D3557">` (index.html:46).

## 7. Visual fidelity requirements for M-03

Per the migration directive, R25 is the mandatory Visual Identity Baseline (PRESERVE → REFINE → MODERNIZE, not "generic redesign"). Concretely, the following must remain recognizable in the target product:
- Navy/orange/gold PTX palette and the 3 distinct team colors (Phoenix blue / Tiger red / Xiphias orange-gold).
- 'Bebas Neue' / 'Barlow Condensed' display type pairing (or a design-system-approved equivalent that preserves the same visual character).
- The 13-route information architecture and the desktop-nav + mobile-bottom-nav dual pattern.
- Card-based layout with `--radius-card: 20px`-style rounded, elevated surfaces.
- Vietnamese-first content with `vi`/`en` language switching.

The following are explicitly **new work**, not preservation:
- A genuine third "Summer" theme/identity layer (does not exist in R25).
- Consolidating the many inline hex colors into a proper semantic token system.
- Accessibility improvements (contrast, semantics) not audited in R25.
