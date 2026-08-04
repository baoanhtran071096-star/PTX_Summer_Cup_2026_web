import type { FinishedMatchResult, StandingsRow } from './standings';

const POINTS_FOR_WIN = 3;
const POINTS_FOR_DRAW = 1;
const POINTS_FOR_LOSS = 0;

/**
 * Standings are ALWAYS computed from match results — never an
 * independently maintained table that can diverge from them
 * (Architecture v1.3 §6). Only `finished` matches count; the caller
 * is responsible for filtering to finished matches before calling
 * this (this function has no concept of match status, staying pure).
 *
 * Tiebreak order: points -> goal difference -> goals scored -> team id
 * (deterministic alphabetical fallback, since R25's 3-team round robin
 * never actually needed a tiebreaker rule and none was documented to
 * port — this is a reasonable, standard football convention, not a
 * legacy behavior).
 */
export function computeStandings(teamIds: string[], results: FinishedMatchResult[]): StandingsRow[] {
  const rows = new Map<string, StandingsRow>(
    teamIds.map((teamId) => [
      teamId,
      { teamId, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 },
    ])
  );

  for (const result of results) {
    const home = rows.get(result.homeTeamId);
    const away = rows.get(result.awayTeamId);
    if (!home || !away) continue; // ignore results referencing an unknown team rather than crash

    home.played += 1;
    away.played += 1;
    home.goalsFor += result.homeScore;
    home.goalsAgainst += result.awayScore;
    away.goalsFor += result.awayScore;
    away.goalsAgainst += result.homeScore;

    if (result.homeScore > result.awayScore) {
      home.wins += 1;
      home.points += POINTS_FOR_WIN;
      away.losses += 1;
      away.points += POINTS_FOR_LOSS;
    } else if (result.homeScore < result.awayScore) {
      away.wins += 1;
      away.points += POINTS_FOR_WIN;
      home.losses += 1;
      home.points += POINTS_FOR_LOSS;
    } else {
      home.draws += 1;
      away.draws += 1;
      home.points += POINTS_FOR_DRAW;
      away.points += POINTS_FOR_DRAW;
    }
  }

  for (const row of rows.values()) {
    row.goalDifference = row.goalsFor - row.goalsAgainst;
  }

  return [...rows.values()].sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor ||
      a.teamId.localeCompare(b.teamId)
  );
}
