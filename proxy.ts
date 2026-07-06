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
  const isOnboardingRoute = pathname === '/onboarding';

  // ── Rutas /admin/* ──────────────────────────────────────────
  if (isAdminRoute) {
    // Admin ya logueado intenta entrar al login → al panel
    if (isAdminLogin && token && isAdmin) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    // Ruta admin sin token o sin rol admin → al login de admin
    if (!isAdminLogin && (!token || !isAdmin)) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    return NextResponse.next();
  }

  // ── Rutas de tenant ─────────────────────────────────────────

  // Si es admin y entra al login de tenant → al panel de admin
  if (token && isAdmin && isTenantLogin) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  // Sin token en ruta protegida → login de tenant
  if (!token && !isTenantLogin) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Tenant logueado intenta ir al login → al dashboard
  if (token && !isAdmin && isTenantLogin) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Tenant sin onboarding → onboarding
  if (token && !isAdmin && !isOnboarded && !isOnboardingRoute) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  // Tenant ya onboarded intenta volver al onboarding → dashboard
  if (token && !isAdmin && isOnboarded && isOnboardingRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|images|favicon.ico).*)'],
};
