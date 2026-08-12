import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getEnv, isSupabaseConfigured } from '@/lib/env';
import { ROUTES } from '@/constants/routes';

/**
 * Request-boundary concerns (docs/architecture §9): refreshes the
 * Supabase session cookie on every request and redirects unauthenticated
 * requests away from /admin/*. This only confirms "signed in" — the
 * `admin` role check is a defense-in-depth layer in the admin layout
 * itself, and RLS is the real data-access gate either way.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Supabase not provisioned yet (pre-M13 local/dev state) — nothing to
  // enforce here. The admin layout itself shows a clear setup message
  // rather than this middleware crashing every request on the site.
  if (!isSupabaseConfigured()) {
    return response;
  }

  const env = getEnv();
  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtectedAdminRoute = pathname.startsWith('/admin');

  if (isProtectedAdminRoute && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = ROUTES.login;
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
