import { notFound } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/services/database/client-server';
import { listPlayers, getPlayerByLegacyId, listPlayerStats } from '@/services/database/players.db';
import { listTeams } from '@/services/database/teams.db';
import { getPublicMediaUrl } from '@/services/storage/media';
import { calculatePlayerRating } from '@/domain/player/rating.value';
import type { PlayerRow, PlayerStatsRow, TeamRow } from '@/services/database/types';
import type { PlayerWithStats } from './types';

const EMPTY_STATS: PlayerStatsRow = {
  player_id: '',
  goals: 0,
  assists: 0,
  yellow_cards: 0,
  red_cards: 0,
  mvp_count: 0,
};

function toPlayerWithStats(
  client: SupabaseClient,
  row: PlayerRow,
  statsRow: PlayerStatsRow | undefined,
  teamsById: Map<string, TeamRow>
): PlayerWithStats {
  const stats = {
    goals: statsRow?.goals ?? EMPTY_STATS.goals,
    assists: statsRow?.assists ?? EMPTY_STATS.assists,
    yellowCards: statsRow?.yellow_cards ?? EMPTY_STATS.yellow_cards,
    redCards: statsRow?.red_cards ?? EMPTY_STATS.red_cards,
    mvpCount: statsRow?.mvp_count ?? EMPTY_STATS.mvp_count,
  };

  return {
    id: row.id,
    legacyId: row.legacy_id,
    name: row.name,
    teamId: row.team_id,
    position: row.position,
    avatarPath: row.avatar_path,
    avatarUrl: row.avatar_path ? getPublicMediaUrl(client, 'player-avatars', row.avatar_path) : null,
    teamName: teamsById.get(row.team_id)?.name ?? row.team_id,
    stats,
    rating: calculatePlayerRating(stats),
  };
}

export async function getAllPlayersWithStats(): Promise<PlayerWithStats[]> {
  const supabase = await createSupabaseServerClient();
  const [players, statsRows, teams] = await Promise.all([
    listPlayers(supabase),
    listPlayerStats(supabase),
    listTeams(supabase),
  ]);

  const statsByPlayerId = new Map(statsRows.map((s) => [s.player_id, s]));
  const teamsById = new Map(teams.map((t) => [t.id, t]));

  return players.map((p) => toPlayerWithStats(supabase, p, statsByPlayerId.get(p.id), teamsById));
}

export async function getPlayerByLegacySlug(legacySlug: string): Promise<PlayerWithStats> {
  const legacyId = Number(legacySlug);
  if (!Number.isInteger(legacyId)) notFound();

  const supabase = await createSupabaseServerClient();
  const player = await getPlayerByLegacyId(supabase, legacyId);
  if (!player) notFound();

  const [statsRows, teams] = await Promise.all([listPlayerStats(supabase), listTeams(supabase)]);
  const statsByPlayerId = new Map(statsRows.map((s) => [s.player_id, s]));
  const teamsById = new Map(teams.map((t) => [t.id, t]));

  return toPlayerWithStats(supabase, player, statsByPlayerId.get(player.id), teamsById);
}

/** For the compare page — accepts up to a handful of legacy-id slugs (order preserved, unknowns skipped). */
export async function getPlayersForCompare(legacySlugs: string[]): Promise<PlayerWithStats[]> {
  const all = await getAllPlayersWithStats();
  const byLegacyId = new Map(all.map((p) => [String(p.legacyId), p]));
  return legacySlugs.map((slug) => byLegacyId.get(slug)).filter((p): p is PlayerWithStats => Boolean(p));
}
