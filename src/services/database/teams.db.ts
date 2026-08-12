import type { SupabaseClient } from '@supabase/supabase-js';
import { InfrastructureError } from '@/lib/errors';
import type { TeamRow } from './types';

/**
 * Low-level data access only — no business rules (Rule 6). Callers
 * (features/teams) decide what to do with this data.
 */
export async function listTeams(client: SupabaseClient): Promise<TeamRow[]> {
  const { data, error } = await client.from('teams').select('*').order('id');
  if (error) throw new InfrastructureError(`Failed to list teams: ${error.message}`, error);
  return data as TeamRow[];
}

export async function getTeamById(client: SupabaseClient, id: string): Promise<TeamRow | null> {
  const { data, error } = await client.from('teams').select('*').eq('id', id).maybeSingle();
  if (error) throw new InfrastructureError(`Failed to get team ${id}: ${error.message}`, error);
  return data as TeamRow | null;
}

export async function updateTeam(
  client: SupabaseClient,
  id: string,
  input: { captainName: string | null; stats: TeamRow['stats'] }
): Promise<void> {
  const { error } = await client
    .from('teams')
    .update({ captain_name: input.captainName, stats: input.stats })
    .eq('id', id);
  if (error) throw new InfrastructureError(`Failed to update team ${id}: ${error.message}`, error);
}
