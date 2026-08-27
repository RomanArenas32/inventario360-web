import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('inv360_token')?.value;
  const role = request.cookies.get('inv360_role')?.value;
  const isOnboarded = request.cookies.get('inv360_onboarded')?.value === 'true';
  const { pathname } = request.nextUrl;

  const isAdmin = role === 'admin';
  const isAdminRoute = pathname.startsWith('/admin');
  const isAdminLogin = pathname === '/admin/login';
  const isTenantLogin = pathname === '/login';
  const isPublicTenantRoute = pathname.startsWith('/login'); // /login, /login/invitation, etc.
  const isOnboardingRoute = pathname === '/onboarding';
  const isRegisterRoute = pathname === '/register';
  const isSelectTenantRoute = pathname === '/select-tenant';

  // ── /admin/* routes ─────────────────────────────────────────
  if (isAdminRoute) {
    // Admin already logged in tries to access login → redirect to panel
    if (isAdminLogin && token && isAdmin) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    // Admin route without token or without admin role → redirect to admin login
    if (!isAdminLogin && (!token || !isAdmin)) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    return NextResponse.next();
  }

  // ── Tenant routes ────────────────────────────────────────────

  // Admin accessing tenant login → redirect to admin panel
  if (token && isAdmin && isTenantLogin) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  // No token on protected route → redirect to tenant login
  if (!token && !isPublicTenantRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Logged-in tenant tries to access login → redirect to dashboard
  if (token && !isAdmin && isTenantLogin) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Tenant without onboarding → redirect to onboarding (skip for /register, which precedes onboarding)
  if (
    token &&
    !isAdmin &&
    !isOnboarded &&
    !isOnboardingRoute &&
    !isRegisterRoute &&
    !isSelectTenantRoute
  ) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  // Onboarded tenant tries to go back to onboarding → redirect to dashboard
  // Note: /register and /select-tenant are allowed even when onboarded
  if (token && !isAdmin && isOnboarded && isOnboardingRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|webp|svg|ico|gif|woff2?|ttf|otf|eot)).*)',
  ],
};
