import type { SupabaseClient } from '@supabase/supabase-js';
import { InfrastructureError } from '@/lib/errors';
import type { PlayerRow, PlayerStatsRow } from './types';

export async function listPlayers(client: SupabaseClient, teamId?: string): Promise<PlayerRow[]> {
  let query = client.from('players').select('*').order('name');
  if (teamId) query = query.eq('team_id', teamId);
  const { data, error } = await query;
  if (error) throw new InfrastructureError(`Failed to list players: ${error.message}`, error);
  return data as PlayerRow[];
}

export async function getPlayerById(client: SupabaseClient, id: string): Promise<PlayerRow | null> {
  const { data, error } = await client.from('players').select('*').eq('id', id).maybeSingle();
  if (error) throw new InfrastructureError(`Failed to get player ${id}: ${error.message}`, error);
  return data as PlayerRow | null;
}

/** legacy_id is used as the public URL slug — stable, human-readable, avoids uuid-in-URL. */
export async function getPlayerByLegacyId(client: SupabaseClient, legacyId: number): Promise<PlayerRow | null> {
  const { data, error } = await client.from('players').select('*').eq('legacy_id', legacyId).maybeSingle();
  if (error) throw new InfrastructureError(`Failed to get player legacy_id=${legacyId}: ${error.message}`, error);
  return data as PlayerRow | null;
}

export async function updatePlayer(
  client: SupabaseClient,
  id: string,
  input: { name: string; teamId: string; position: PlayerRow['position'] }
): Promise<void> {
  const { error } = await client
    .from('players')
    .update({ name: input.name, team_id: input.teamId, position: input.position })
    .eq('id', id);
  if (error) throw new InfrastructureError(`Failed to update player ${id}: ${error.message}`, error);
}

/** Reads the always-derived v_player_stats view — never independently editable. */
export async function listPlayerStats(client: SupabaseClient): Promise<PlayerStatsRow[]> {
  const { data, error } = await client.from('v_player_stats').select('*');
  if (error) throw new InfrastructureError(`Failed to list player stats: ${error.message}`, error);
  return data as PlayerStatsRow[];
}
