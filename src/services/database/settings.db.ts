import type { SupabaseClient } from '@supabase/supabase-js';
import { InfrastructureError } from '@/lib/errors';
import type { TournamentSettingsRow } from './types';
import { assertWrote } from '@/lib/db-write';

export async function getTournamentSettings(client: SupabaseClient): Promise<TournamentSettingsRow | null> {
  const { data, error } = await client.from('tournament_settings').select('*').eq('id', true).maybeSingle();
  if (error) throw new InfrastructureError(`Failed to load tournament settings: ${error.message}`, error);
  return data as TournamentSettingsRow | null;
}

export async function updateTournamentSettings(
  client: SupabaseClient,
  input: { slogan: string; message: string; eventDate: string; location: string }
): Promise<void> {
  const { data, error } = await client
    .from('tournament_settings')
    .update({ slogan: input.slogan, message: input.message, event_date: input.eventDate, location: input.location })
    .eq('id', true)
    .select('id');
  assertWrote(data, error, 'update tournament settings');
}
