const TOKEN_KEY = 'inv360_at';
const ROLE_KEY = 'inv360_role';
const ONBOARDED_KEY = 'inv360_onboarded';
const MAX_AGE = 60 * 60 * 24 * 7;

function setCookie(key: string, value: string) {
  document.cookie = `${key}=${value}; path=/; max-age=${MAX_AGE}`;
}

function clearCookie(key: string) {
  document.cookie = `${key}=; path=/; max-age=0`;
}

export function getToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)inv360_at=([^;]+)/);
  return match?.[1] ?? null;
}

export function setToken(token: string) {
  setCookie(TOKEN_KEY, token);
}

export function setSession(role: string, isOnboarded: boolean) {
  setCookie(ROLE_KEY, role);
  setCookie(ONBOARDED_KEY, String(isOnboarded));
}

export function setOnboarded(value: boolean) {
  setCookie(ONBOARDED_KEY, String(value));
}

export function clearSession() {
  clearCookie(TOKEN_KEY);
  clearCookie(ROLE_KEY);
  clearCookie(ONBOARDED_KEY);
}
