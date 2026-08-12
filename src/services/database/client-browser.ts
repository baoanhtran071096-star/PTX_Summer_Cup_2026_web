import { createBrowserClient } from '@supabase/ssr';
import { getEnv } from '@/lib/env';

/**
 * Browser client — safe for Client Components. Uses the anon key,
 * so it only ever operates under RLS as the current authenticated user.
 *
 * Kept in its own file (not alongside the server client) so this
 * never accidentally pulls `next/headers` into a client bundle.
 */
export function createSupabaseBrowserClient() {
  const env = getEnv();
  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
