import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Subscribes to matches/match_events changes for a single match.
 * Returns an unsubscribe function. Client-side only (needs a browser
 * Supabase client) — callers are Client Components.
 */
export function subscribeToMatchUpdates(
  client: SupabaseClient,
  matchId: string,
  onChange: () => void
): () => void {
  const channel = client
    .channel(`match-${matchId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'match_events', filter: `match_id=eq.${matchId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` }, onChange)
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}

/** Subscribes to ALL match/event changes — used by the schedule/results list pages. */
export function subscribeToAllMatchUpdates(client: SupabaseClient, onChange: () => void): () => void {
  const channel = client
    .channel('all-matches')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'match_events' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, onChange)
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}
