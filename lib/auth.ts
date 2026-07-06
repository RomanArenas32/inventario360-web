const ROLE_KEY = 'inv360_role';
const ONBOARDED_KEY = 'inv360_onboarded';
const MAX_AGE = 60 * 60 * 24 * 7;

function setCookie(key: string, value: string) {
  document.cookie = `${key}=${value}; path=/; max-age=${MAX_AGE}`;
}

function clearCookie(key: string) {
  document.cookie = `${key}=; path=/; max-age=0`;
}

// Called after login — token is set as HttpOnly cookie by the server
export function setSession(role: string, isOnboarded: boolean) {
  setCookie(ROLE_KEY, role);
  setCookie(ONBOARDED_KEY, String(isOnboarded));
}

export function setOnboarded(value: boolean) {
  setCookie(ONBOARDED_KEY, String(value));
}

// Clears role/onboarded cookies; token cookie is cleared by POST /auth/logout
export function clearSession() {
  clearCookie(ROLE_KEY);
  clearCookie(ONBOARDED_KEY);
}
