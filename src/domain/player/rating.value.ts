import type { PlayerPerformanceStats } from './player.entity';

/**
 * R25 never had per-player attributes (attack/defense/etc like teams
 * do) — only goals/assists/mvp counters (r25-data-inventory.md §1.2).
 * There is no legacy formula to port, so this is a transparent,
 * documented v1 heuristic — NOT a claim of official PTX methodology —
 * built only from real derived stats (never fabricated attributes).
 * AI must not own or override this (Architecture v1.3 §15/§16); it may
 * only explain the number this function produces.
 *
 * rating = clamp(60 + 3*goals + 2*assists + 5*mvpCount - 2*redCards, 40, 99)
 */
const BASE_RATING = 60;
const MIN_RATING = 40;
const MAX_RATING = 99;

export function calculatePlayerRating(stats: PlayerPerformanceStats): number {
  const raw =
    BASE_RATING + stats.goals * 3 + stats.assists * 2 + stats.mvpCount * 5 - stats.redCards * 2;
  return Math.max(MIN_RATING, Math.min(MAX_RATING, Math.round(raw)));
}
