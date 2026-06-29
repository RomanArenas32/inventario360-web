const TOKEN_KEY = 'inv360_token';
const ROLE_KEY = 'inv360_role';
const ONBOARDED_KEY = 'inv360_onboarded';
const MAX_AGE = 60 * 60 * 24 * 7;

function setCookie(key: string, value: string) {
  document.cookie = `${key}=${value}; path=/; max-age=${MAX_AGE}`;
}

function clearCookie(key: string) {
  document.cookie = `${key}=; path=/; max-age=0`;
}

export function setSession(token: string, role: string, isOnboarded: boolean) {
  setCookie(TOKEN_KEY, token);
  setCookie(ROLE_KEY, role);
  setCookie(ONBOARDED_KEY, String(isOnboarded));
  localStorage.setItem(TOKEN_KEY, token);
}

export function setOnboarded(value: boolean) {
  setCookie(ONBOARDED_KEY, String(value));
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearSession() {
  clearCookie(TOKEN_KEY);
  clearCookie(ROLE_KEY);
  clearCookie(ONBOARDED_KEY);
  localStorage.removeItem(TOKEN_KEY);
}
