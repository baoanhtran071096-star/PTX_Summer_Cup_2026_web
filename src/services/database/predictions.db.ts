import type { SupabaseClient } from '@supabase/supabase-js';
import { assertWrote } from '@/lib/db-write';
import { InfrastructureError } from '@/lib/errors';
import type { PredictionRow } from './types';

export async function listPredictions(client: SupabaseClient): Promise<PredictionRow[]> {
  const { data, error } = await client.from('predictions').select('*').order('created_at', { ascending: false });
  if (error) throw new InfrastructureError(`Failed to list predictions: ${error.message}`, error);
  return data as PredictionRow[];
}

export async function getPredictionByTicketCode(client: SupabaseClient, ticketCode: string): Promise<PredictionRow | null> {
  const { data, error } = await client.from('predictions').select('*').eq('ticket_code', ticketCode).maybeSingle();
  if (error) throw new InfrastructureError(`Failed to get prediction ${ticketCode}: ${error.message}`, error);
  return data as PredictionRow | null;
}

export async function insertPrediction(
  client: SupabaseClient,
  input: {
    displayName: string;
    ticketCode: string;
    picks: PredictionRow['picks'];
    mvpPlayerId: string | null;
    goldenBootPlayerId: string | null;
  }
): Promise<void> {
  const { error } = await client.from('predictions').insert({
    display_name: input.displayName,
    ticket_code: input.ticketCode,
    picks: input.picks,
    mvp_player_id: input.mvpPlayerId,
    golden_boot_player_id: input.goldenBootPlayerId,
  });
  if (error) throw new InfrastructureError(`Failed to submit prediction: ${error.message}`, error);
}

export async function deletePrediction(client: SupabaseClient, id: string): Promise<void> {
  const { data, error } = await client.from('predictions').delete().eq('id', id).select('id');
  assertWrote(data, error, `delete prediction ${id}`);
}
