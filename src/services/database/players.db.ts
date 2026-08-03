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

/** Reads the always-derived v_player_stats view — never independently editable. */
export async function listPlayerStats(client: SupabaseClient): Promise<PlayerStatsRow[]> {
  const { data, error } = await client.from('v_player_stats').select('*');
  if (error) throw new InfrastructureError(`Failed to list player stats: ${error.message}`, error);
  return data as PlayerStatsRow[];
}
