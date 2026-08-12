import type { SupabaseClient } from '@supabase/supabase-js';
import { InfrastructureError } from '@/lib/errors';
import type { MatchEventRow, MatchRow, MatchScoreRow } from './types';

export async function listMatches(client: SupabaseClient): Promise<MatchRow[]> {
  const { data, error } = await client.from('matches').select('*').order('match_date').order('start_time');
  if (error) throw new InfrastructureError(`Failed to list matches: ${error.message}`, error);
  return data as MatchRow[];
}

export async function getMatchById(client: SupabaseClient, id: string): Promise<MatchRow | null> {
  const { data, error } = await client.from('matches').select('*').eq('id', id).maybeSingle();
  if (error) throw new InfrastructureError(`Failed to get match ${id}: ${error.message}`, error);
  return data as MatchRow | null;
}

/** legacy_id is used as the public URL slug — stable, human-readable, avoids uuid-in-URL. */
export async function getMatchByLegacyId(client: SupabaseClient, legacyId: number): Promise<MatchRow | null> {
  const { data, error } = await client.from('matches').select('*').eq('legacy_id', legacyId).maybeSingle();
  if (error) throw new InfrastructureError(`Failed to get match legacy_id=${legacyId}: ${error.message}`, error);
  return data as MatchRow | null;
}

export async function listMatchEvents(client: SupabaseClient, matchId: string): Promise<MatchEventRow[]> {
  const { data, error } = await client
    .from('match_events')
    .select('*')
    .eq('match_id', matchId)
    .order('minute');
  if (error) throw new InfrastructureError(`Failed to list events for match ${matchId}: ${error.message}`, error);
  return data as MatchEventRow[];
}

/** Reads the always-derived v_match_scores view — never independently editable. */
export async function listMatchScores(client: SupabaseClient): Promise<MatchScoreRow[]> {
  const { data, error } = await client.from('v_match_scores').select('*');
  if (error) throw new InfrastructureError(`Failed to list match scores: ${error.message}`, error);
  return data as MatchScoreRow[];
}
