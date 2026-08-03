import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getEnv } from '@/lib/env';

/**
 * Browser client — safe for Client Components. Uses the anon key,
 * so it only ever operates under RLS as the current authenticated user.
 */
export function createSupabaseBrowserClient() {
  const env = getEnv();
  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * Server client for Server Components / Server Actions / Route Handlers.
 * Still uses the anon key + the request's auth cookie, so it still
 * operates under RLS — this is NOT the service-role client
 * (docs/architecture §9: service role is not the default admin path).
 */
export async function createSupabaseServerClient() {
  const env = getEnv();
  const cookieStore = await cookies();
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component render — cookie writes are a no-op there;
          // the middleware refresh path handles session persistence instead.
        }
      },
    },
  });
}
