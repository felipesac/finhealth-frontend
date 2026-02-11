import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function getAllowedOrigins(): Set<string> {
  const origins = new Set<string>();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    origins.add(new URL(appUrl).origin);
  }

  // Vercel sets VERCEL_URL on every deployment (host only, no protocol)
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    origins.add(`https://${vercelUrl}`);
  }

  // Vercel production domain
  const vercelProdUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProdUrl) {
    origins.add(`https://${vercelProdUrl}`);
  }

  // Local dev fallback
  if (origins.size === 0) {
    origins.add('http://localhost:3000');
  }

  return origins;
}

export async function middleware(request: NextRequest) {
  // CSRF: validate Origin header on mutation requests
  if (!SAFE_METHODS.has(request.method)) {
    const origin = request.headers.get('origin');
    if (origin) {
      const allowed = getAllowedOrigins();
      if (!allowed.has(origin)) {
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
