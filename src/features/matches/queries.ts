import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/services/database/client-server';
import { listMatches, getMatchByLegacyId, listMatchEvents, listMatchScores } from '@/services/database/matches.db';
import { listTeams } from '@/services/database/teams.db';
import { listPlayers } from '@/services/database/players.db';
import { getTeamColorVar } from '@/constants/teamColors';
import type { MatchRow, MatchScoreRow, TeamRow, PlayerRow } from '@/services/database/types';
import type { MatchDetail, MatchWithTeams } from './types';

function toMatchWithTeams(row: MatchRow, score: MatchScoreRow | undefined, teamsById: Map<string, TeamRow>): MatchWithTeams {
  const homeTeam = teamsById.get(row.home_team_id);
  const awayTeam = teamsById.get(row.away_team_id);

  return {
    id: row.id,
    legacyId: row.legacy_id,
    homeTeamId: row.home_team_id,
    awayTeamId: row.away_team_id,
    matchDate: row.match_date,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    homeScore: score?.home_score ?? 0,
    awayScore: score?.away_score ?? 0,
    homeTeamName: homeTeam?.name ?? row.home_team_id,
    homeTeamColor: getTeamColorVar(row.home_team_id),
    awayTeamName: awayTeam?.name ?? row.away_team_id,
    awayTeamColor: getTeamColorVar(row.away_team_id),
  };
}

export async function getAllMatches(): Promise<MatchWithTeams[]> {
  const supabase = await createSupabaseServerClient();
  const [matches, scores, teams] = await Promise.all([
    listMatches(supabase),
    listMatchScores(supabase),
    listTeams(supabase),
  ]);

  const scoresByMatchId = new Map(scores.map((s) => [s.match_id, s]));
  const teamsById = new Map(teams.map((t) => [t.id, t]));

  return matches.map((m) => toMatchWithTeams(m, scoresByMatchId.get(m.id), teamsById));
}

export async function getFinishedMatches(): Promise<MatchWithTeams[]> {
  const all = await getAllMatches();
  return all.filter((m) => m.status === 'finished');
}

export async function getMatchDetailByLegacySlug(legacySlug: string): Promise<MatchDetail> {
  const legacyId = Number(legacySlug);
  if (!Number.isInteger(legacyId)) notFound();

  const supabase = await createSupabaseServerClient();
  const match = await getMatchByLegacyId(supabase, legacyId);
  if (!match) notFound();

  const [events, scores, teams, players] = await Promise.all([
    listMatchEvents(supabase, match.id),
    listMatchScores(supabase),
    listTeams(supabase),
    listPlayers(supabase),
  ]);

  const scoresByMatchId = new Map(scores.map((s) => [s.match_id, s]));
  const teamsById = new Map(teams.map((t) => [t.id, t]));
  const playersById = new Map<string, PlayerRow>(players.map((p) => [p.id, p]));

  return {
    ...toMatchWithTeams(match, scoresByMatchId.get(match.id), teamsById),
    events: events.map((e) => ({
      id: e.id,
      matchId: e.match_id,
      teamId: e.team_id,
      playerId: e.player_id,
      eventType: e.event_type,
      minute: e.minute,
      playerName: e.player_id ? (playersById.get(e.player_id)?.name ?? null) : null,
    })),
  };
}
