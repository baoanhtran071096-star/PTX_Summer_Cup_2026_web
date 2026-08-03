# R25 Visual Fidelity Contract

> **Module:** M-03 — Parity Specification
> **Purpose:** Bind the M12 visual-regression gate to a concrete, checkable definition of "still recognizably PTX Summer Cup" — per the migration directive's rule: **R25 → PRESERVE → REFINE → MODERNIZE, NOT R25 → generic redesign.**

## 1. Must remain recognizable (visual regression gate checks these)

1. **Color identity**
   - Primary navy `#1D3557`, PTX orange `#F15A24`, gold `#D4A13E` present as the dominant brand accents across Light and Dark themes.
   - Team colors preserved exactly: Phoenix blue `#1A5BB5`, Tiger red `#D32F2F`, Xiphias orange-gold `#F5A623` — these must remain visually distinguishable and consistently mapped to the same team across every surface (team pages, radar charts, standings, match cards).
2. **Typography character**
   - Display/headline type must retain the condensed-sport-poster character of 'Bebas Neue'/'Barlow Condensed' (an approved semantic-token equivalent is acceptable if it preserves the same visual weight/character — this is not a requirement to use the literal same font file forever, but the *character* must survive).
   - Vietnamese diacritics must render correctly everywhere (a real regression class in web fonts — explicit accessibility/rendering check required, not assumed).
3. **Information architecture**
   - The 13 named sections/routes (Trang chủ, Giới thiệu, Lịch thi đấu, BXH, Đội bóng, Cầu thủ, Thống kê, Thư viện, Vinh danh, Điều lệ, Liên hệ, Quản trị, Tài Trợ & Donate) remain reachable with the same names and the same top-level grouping.
   - Desktop top-nav + mobile bottom-nav dual pattern preserved (no consolidation to a single nav pattern without documented UX justification per directive §11).
4. **Component character**
   - Card-based, rounded (`--radius-card`-equivalent), elevated surface style for content blocks (team cards, player cards, match cards).
   - FIFA-style player card presentation (portrait + team-color accent + stat readout) — this is a named, recognizable pattern, not incidental styling.
5. **Light/Dark behavior**
   - Both existing themes (`[data-theme="dark"]`/`[data-theme="light"]` equivalents) must continue to exist and both must pass the same visual regression baseline independently.
6. **Mobile fidelity**
   - All of the above must hold at mobile viewport widths — R25 is heavily mobile-oriented (bottom nav, `clamp()`-based fluid type, 113 responsive breakpoints file-wide).

## 2. Deliberately new, not a fidelity requirement

- **Summer theme/identity** — does not exist in R25 (confirmed by exhaustive audit — no `--summer` token or third `data-theme` value anywhere). This is required NEW design work per Architecture v1.3, not something the visual-regression gate can check "fidelity" against, since there is no baseline. It must be designed to *complement* the existing navy/orange/gold identity (e.g., a brighter/warmer seasonal variant), not replace it or introduce a generic unrelated palette (explicit anti-pattern named in the directive: "do not transform PTX into a generic blue SaaS dashboard").
- Consolidating scattered inline hex colors into semantic design tokens — an implementation-quality improvement; the *rendered* colors should still visually match (or intentionally, minimally improve e.g. contrast) what's currently on screen, not shift the palette.

## 3. Encouraged improvements (do not block the fidelity gate, and are expected)

Per directive §11: spacing, typography consistency, accessibility, responsiveness, component consistency, hierarchy, performance, interaction feedback, mobile ergonomics — all explicitly encouraged. The fidelity gate checks *recognizability*, not pixel-identical reproduction of every spacing value.

## 4. M12 Visual Regression Gate — required checks

1. Screenshot comparison (or structured token/contrast check) of: homepage, team page, player profile, match center, standings, gallery, admin login — in both Light and Dark, at desktop and mobile viewport, against this contract's §1 requirements.
2. A designated reviewer (human) sign-off that the Summer theme, once designed, reads as "PTX Summer Cup, in summer mode" rather than a generic seasonal reskin — this specific check cannot be fully automated and is called out as a manual acceptance step, not a machine gate.
3. Confirm no navigation/IA changes shipped without a documented UX justification note in this file (append future justified changes here as an amendment, don't silently drift).

## 5. Amendments

None yet. Any future navigation/IA change must be appended here with rationale before implementation, per directive §11 ("Significant navigation/information-architecture changes require documented UX justification").
