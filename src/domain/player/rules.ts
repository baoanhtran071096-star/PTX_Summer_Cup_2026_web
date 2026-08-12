import type { PlayerPerformanceStats, PlayerPosition } from './player.entity';

/** Conventional football lineup order — used to sort squad listings. */
const POSITION_ORDER: Record<PlayerPosition, number> = { GK: 0, DF: 1, MF: 2, FW: 3 };

export function comparePlayerPositions(a: PlayerPosition, b: PlayerPosition): number {
  return POSITION_ORDER[a] - POSITION_ORDER[b];
}

/** Radar normalization ceiling — the tournament-wide max for each positive stat. */
export function calculateStatsMaxScale(
  allStats: PlayerPerformanceStats[]
): { goals: number; assists: number; mvpCount: number } {
  return allStats.reduce(
    (max, s) => ({
      goals: Math.max(max.goals, s.goals),
      assists: Math.max(max.assists, s.assists),
      mvpCount: Math.max(max.mvpCount, s.mvpCount),
    }),
    { goals: 0, assists: 0, mvpCount: 0 }
  );
}
