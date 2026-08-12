-- ============================================================
-- M07: predictions.points (M01) would go stale if a match result is
-- ever corrected after the fact. Points are computed at read time from
-- current results via src/domain/prediction/scoring-rules.ts — same
-- "don't store what's derivable" principle as team OVR, match scores,
-- and player stats.
-- ============================================================

alter table public.predictions drop column points;
