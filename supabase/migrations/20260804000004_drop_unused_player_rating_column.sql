-- ============================================================
-- M04: players.rating (M01) was a speculative static field with no
-- legacy basis — R25 never had per-player attributes, only
-- goals/assists/mvp counts (docs/legacy/r25-data-inventory.md §1.2).
-- Replaced by a transparent, derived rating computed in
-- src/domain/player/rating.value.ts from real v_player_stats data,
-- following the same "don't store what can be derived" principle as
-- team OVR and match scores. No production data exists yet, so this
-- is a costless cleanup rather than a disruptive migration.
-- ============================================================

alter table public.players drop column rating;
