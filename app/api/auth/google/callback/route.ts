import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const MAX_AGE = 60 * 60 * 24 * 7;

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const role = req.nextUrl.searchParams.get('role') ?? 'user';
  const onboarded = req.nextUrl.searchParams.get('onboarded') === 'true';
  const rawDest = req.nextUrl.searchParams.get('destination') ?? '/dashboard';

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=google_failed', req.url));
  }

  const destination = rawDest.startsWith('/') ? rawDest : '/dashboard';
  const response = NextResponse.redirect(new URL(destination, req.url));

  response.cookies.set('inv360_at', token, {
    httpOnly: false,
    secure: false,
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  });
  response.cookies.set('inv360_role', role, {
    httpOnly: false,
    secure: true,
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  });
  response.cookies.set('inv360_onboarded', String(onboarded), {
    httpOnly: false,
    secure: true,
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  });

  return response;
}
