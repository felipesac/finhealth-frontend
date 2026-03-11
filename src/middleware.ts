import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export async function middleware(request: NextRequest) {
  // CSRF: verify Origin matches Host on mutation requests (OWASP double-submit)
  if (!SAFE_METHODS.has(request.method)) {
    const origin = request.headers.get('origin');
    if (origin) {
      const originHost = new URL(origin).host;
      const requestHost = request.headers.get('host');
      if (originHost !== requestHost) {
        return NextResponse.json(
          { error: 'CSRF validation failed' },
          { status: 403 },
        );
      }
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
