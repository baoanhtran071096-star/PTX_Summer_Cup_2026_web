import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Request-boundary concerns only (docs/architecture §9) — auth
 * redirects/route protection land in M02, not here.
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
