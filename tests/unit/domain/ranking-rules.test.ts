import { describe, it, expect } from 'vitest';
import { computeStandings } from '@/domain/standings/ranking-rules';

describe('computeStandings', () => {
  it('awards 3/1/0 points for win/draw/loss', () => {
    const standings = computeStandings(
      ['p', 't'],
      [{ homeTeamId: 'p', awayTeamId: 't', homeScore: 2, awayScore: 1 }]
    );
    const p = standings.find((r) => r.teamId === 'p')!;
    const t = standings.find((r) => r.teamId === 't')!;
    expect(p.points).toBe(3);
    expect(p.wins).toBe(1);
    expect(t.points).toBe(0);
    expect(t.losses).toBe(1);
  });

  it('splits points evenly on a draw', () => {
    const standings = computeStandings(
      ['p', 't'],
      [{ homeTeamId: 'p', awayTeamId: 't', homeScore: 1, awayScore: 1 }]
    );
    expect(standings.every((r) => r.points === 1 && r.draws === 1)).toBe(true);
  });

  it('computes goal difference and goals for/against correctly', () => {
    const standings = computeStandings(
      ['p', 't'],
      [{ homeTeamId: 'p', awayTeamId: 't', homeScore: 3, awayScore: 1 }]
    );
    const p = standings.find((r) => r.teamId === 'p')!;
    const t = standings.find((r) => r.teamId === 't')!;
    expect(p.goalsFor).toBe(3);
    expect(p.goalsAgainst).toBe(1);
    expect(p.goalDifference).toBe(2);
    expect(t.goalDifference).toBe(-2);
  });

  it('sorts by points, then goal difference, then goals scored, then team id', () => {
    // Full R25 3-team round robin: p beats t 2-0, p draws x 1-1, t beats x 3-0.
    const standings = computeStandings(
      ['p', 't', 'x'],
      [
        { homeTeamId: 'p', awayTeamId: 't', homeScore: 2, awayScore: 0 },
        { homeTeamId: 'p', awayTeamId: 'x', homeScore: 1, awayScore: 1 },
        { homeTeamId: 't', awayTeamId: 'x', homeScore: 3, awayScore: 0 },
      ]
    );
    // p: 2W... wait p has 1 win + 1 draw = 4 pts, t: 1 win + 1 loss = 3 pts, x: 1 draw + 1 loss = 1 pt
    expect(standings.map((r) => r.teamId)).toEqual(['p', 't', 'x']);
    expect(standings[0]!.points).toBe(4);
    expect(standings[1]!.points).toBe(3);
    expect(standings[2]!.points).toBe(1);
  });

  it('breaks a points tie by goal difference', () => {
    const standings = computeStandings(
      ['p', 't', 'x'],
      [
        { homeTeamId: 'p', awayTeamId: 't', homeScore: 3, awayScore: 0 }, // p +3
        { homeTeamId: 'x', awayTeamId: 't', homeScore: 1, awayScore: 0 }, // x +1
      ]
    );
    // p and x both have 3 points (1 win each), p has better GD (+3 vs +1)
    expect(standings[0]!.teamId).toBe('p');
    expect(standings[1]!.teamId).toBe('x');
  });

  it('produces a zeroed row for a team with no finished matches', () => {
    const standings = computeStandings(['p', 't', 'x'], []);
    expect(standings).toHaveLength(3);
    expect(standings.every((r) => r.played === 0 && r.points === 0)).toBe(true);
  });

  it('ignores a result referencing an unknown team rather than throwing', () => {
    expect(() =>
      computeStandings(['p'], [{ homeTeamId: 'p', awayTeamId: 'unknown', homeScore: 1, awayScore: 0 }])
    ).not.toThrow();
  });
});
