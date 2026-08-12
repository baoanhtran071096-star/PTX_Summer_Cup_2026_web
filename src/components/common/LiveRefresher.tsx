'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/services/database/client-browser';
import { subscribeToMatchUpdates, subscribeToAllMatchUpdates } from '@/services/realtime/matchChannel';
import { isSupabaseConfigured } from '@/lib/env';

/**
 * Invisible — subscribes to match/event changes and calls
 * router.refresh() so Server Component data re-fetches without a full
 * page reload. Pass `matchId` to scope to one match (detail page), or
 * omit for "any match changed" (schedule/results/standings list pages).
 * Replaces R25's client-clock-only "live" derivation with a real
 * server-push signal (docs/migration/r25-parity-matrix.md §2).
 */
export function LiveRefresher({ matchId }: { matchId?: string }) {
  const router = useRouter();

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const client = createSupabaseBrowserClient();
    const unsubscribe = matchId
      ? subscribeToMatchUpdates(client, matchId, () => router.refresh())
      : subscribeToAllMatchUpdates(client, () => router.refresh());

    return unsubscribe;
  }, [matchId, router]);

  return null;
}
