import { createSupabaseServerClient } from '@/services/database/client-server';
import { listPlayers, listPlayerStats } from '@/services/database/players.db';
import { listTeams } from '@/services/database/teams.db';
import type { PlayerRow, PlayerStatsRow, TeamRow } from '@/services/database/types';

export type PlayerStatLeader = {
  playerId: string;
  playerName: string;
  teamName: string;
  value: number;
};

type StatKey = 'goals' | 'assists' | 'mvp_count';

function toLeaderboard(
  stats: PlayerStatsRow[],
  playersById: Map<string, PlayerRow>,
  teamsById: Map<string, TeamRow>,
  key: StatKey
): PlayerStatLeader[] {
  return stats
    .filter((s) => s[key] > 0)
    .map((s) => {
      const player = playersById.get(s.player_id);
      const team = player ? teamsById.get(player.team_id) : undefined;
      return {
        playerId: s.player_id,
        playerName: player?.name ?? 'Unknown',
        teamName: team?.name ?? '',
        value: s[key],
      };
    })
    .sort((a, b) => b.value - a.value);
}

async function loadLeaderboard(key: StatKey): Promise<PlayerStatLeader[]> {
  const supabase = await createSupabaseServerClient();
  const [players, stats, teams] = await Promise.all([
    listPlayers(supabase),
    listPlayerStats(supabase),
    listTeams(supabase),
  ]);
  return toLeaderboard(stats, new Map(players.map((p) => [p.id, p])), new Map(teams.map((t) => [t.id, t])), key);
}

export function getTopScorers(): Promise<PlayerStatLeader[]> {
  return loadLeaderboard('goals');
}

export function getTopAssists(): Promise<PlayerStatLeader[]> {
  return loadLeaderboard('assists');
}
