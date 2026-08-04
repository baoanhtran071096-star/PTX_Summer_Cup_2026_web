import { createSupabaseServerClient } from '@/services/database/client-server';
import { listMatches, listMatchScores } from '@/services/database/matches.db';
import { listTeams } from '@/services/database/teams.db';
import { computeStandings } from '@/domain/standings/ranking-rules';
import { getTeamColorVar } from '@/constants/teamColors';
import type { StandingsRow } from '@/domain/standings/standings';

export type StandingsRowWithTeam = StandingsRow & { teamName: string; teamColor: string };

export async function getStandings(): Promise<StandingsRowWithTeam[]> {
  const supabase = await createSupabaseServerClient();
  const [matches, scores, teams] = await Promise.all([
    listMatches(supabase),
    listMatchScores(supabase),
    listTeams(supabase),
  ]);

  const scoresByMatchId = new Map(scores.map((s) => [s.match_id, s]));
  const finishedResults = matches
    .filter((m) => m.status === 'finished')
    .map((m) => {
      const score = scoresByMatchId.get(m.id);
      return {
        homeTeamId: m.home_team_id,
        awayTeamId: m.away_team_id,
        homeScore: score?.home_score ?? 0,
        awayScore: score?.away_score ?? 0,
      };
    });

  const standings = computeStandings(
    teams.map((t) => t.id),
    finishedResults
  );

  const teamsById = new Map(teams.map((t) => [t.id, t]));
  return standings.map((row) => ({
    ...row,
    teamName: teamsById.get(row.teamId)?.name ?? row.teamId,
    teamColor: getTeamColorVar(row.teamId),
  }));
}
