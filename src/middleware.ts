import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export async function middleware(request: NextRequest) {
  // CSRF: validate Origin header on mutation requests
  if (!SAFE_METHODS.has(request.method)) {
    const origin = request.headers.get('origin');
    if (origin) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const allowed = new URL(appUrl).origin;
      if (origin !== allowed) {
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
