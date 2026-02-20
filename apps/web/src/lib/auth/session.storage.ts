export const SESSION_KEY = "sessionId";

export function getSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SESSION_KEY);
}

export function setSessionId(id: string) {
  window.localStorage.setItem(SESSION_KEY, id);
}

export function clearSessionId() {
  window.localStorage.removeItem(SESSION_KEY);
}
