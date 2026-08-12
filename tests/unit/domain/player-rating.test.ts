import { describe, it, expect } from 'vitest';
import { calculatePlayerRating } from '@/domain/player/rating.value';
import { comparePlayerPositions, calculateStatsMaxScale } from '@/domain/player/rules';

describe('calculatePlayerRating', () => {
  it('returns the base rating for a player with no recorded events', () => {
    expect(calculatePlayerRating({ goals: 0, assists: 0, yellowCards: 0, redCards: 0, mvpCount: 0 })).toBe(60);
  });

  it('rewards goals, assists, and mvp awards', () => {
    expect(calculatePlayerRating({ goals: 2, assists: 1, yellowCards: 0, redCards: 0, mvpCount: 1 })).toBe(
      60 + 2 * 3 + 1 * 2 + 1 * 5
    );
  });

  it('penalizes red cards', () => {
    expect(calculatePlayerRating({ goals: 0, assists: 0, yellowCards: 0, redCards: 2, mvpCount: 0 })).toBe(56);
  });

  it('clamps to the 40-99 range', () => {
    expect(calculatePlayerRating({ goals: 0, assists: 0, yellowCards: 0, redCards: 20, mvpCount: 0 })).toBe(40);
    expect(calculatePlayerRating({ goals: 50, assists: 50, yellowCards: 0, redCards: 0, mvpCount: 20 })).toBe(99);
  });
});

describe('comparePlayerPositions', () => {
  it('orders GK, DF, MF, FW', () => {
    const positions: Array<'FW' | 'MF' | 'DF' | 'GK'> = ['FW', 'GK', 'MF', 'DF'];
    expect([...positions].sort(comparePlayerPositions)).toEqual(['GK', 'DF', 'MF', 'FW']);
  });
});

describe('calculateStatsMaxScale', () => {
  it('returns the max of each stat across all players', () => {
    const max = calculateStatsMaxScale([
      { goals: 3, assists: 1, yellowCards: 0, redCards: 0, mvpCount: 0 },
      { goals: 1, assists: 4, yellowCards: 0, redCards: 0, mvpCount: 2 },
    ]);
    expect(max).toEqual({ goals: 3, assists: 4, mvpCount: 2 });
  });

  it('returns all zeros for an empty list', () => {
    expect(calculateStatsMaxScale([])).toEqual({ goals: 0, assists: 0, mvpCount: 0 });
  });
});
