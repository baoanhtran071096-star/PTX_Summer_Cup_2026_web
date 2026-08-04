import { describe, it, expect } from 'vitest';
import { scoreMatchPrediction, scorePrediction } from '@/domain/prediction/scoring-rules';

describe('scoreMatchPrediction', () => {
  it('awards 5 points for an exact score match', () => {
    expect(scoreMatchPrediction({ homeScore: 2, awayScore: 1 }, { homeScore: 2, awayScore: 1 })).toBe(5);
  });

  it('awards 2 points for a correct outcome with the wrong score', () => {
    expect(scoreMatchPrediction({ homeScore: 3, awayScore: 1 }, { homeScore: 1, awayScore: 0 })).toBe(2);
  });

  it('awards 0 points for a wrong outcome', () => {
    expect(scoreMatchPrediction({ homeScore: 1, awayScore: 0 }, { homeScore: 0, awayScore: 1 })).toBe(0);
  });

  it('treats a draw prediction matching a draw result as a correct outcome even with different scores', () => {
    expect(scoreMatchPrediction({ homeScore: 0, awayScore: 0 }, { homeScore: 2, awayScore: 2 })).toBe(2);
  });
});

describe('scorePrediction', () => {
  it('sums match scores plus MVP and Golden Boot bonuses', () => {
    const total = scorePrediction({
      matchPredictions: [
        { homeScore: 2, awayScore: 1 },
        { homeScore: 1, awayScore: 1 },
      ],
      matchResults: [
        { homeScore: 2, awayScore: 1 }, // exact: 5
        { homeScore: 0, awayScore: 3 }, // wrong: 0
      ],
      predictedMvpId: 'player-1',
      actualMvpId: 'player-1',
      predictedGoldenBootId: 'player-2',
      actualGoldenBootId: 'player-3',
    });
    // 5 + 0 + 3 (mvp correct) + 0 (golden boot wrong)
    expect(total).toBe(8);
  });

  it('awards 0 for entirely unresolved/unmatched picks', () => {
    const total = scorePrediction({
      matchPredictions: [],
      matchResults: [],
      predictedMvpId: null,
      actualMvpId: null,
      predictedGoldenBootId: null,
      actualGoldenBootId: null,
    });
    expect(total).toBe(0);
  });
});
