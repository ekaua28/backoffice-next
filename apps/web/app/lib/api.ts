import { getSessionId } from "./session";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type AuthResponse = {
  id: string; // session id
  user: {
    id: string;
    firstName: string;
    lastName: string;
    status: "active" | "inactive";
    loginsCounter: number;
    creationTime: string;
    lastUpdateTime: string;
  };
};

async function req<T>(path: string, init: RequestInit = {}, withSession = true): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");

  if (withSession) {
    const sid = getSessionId();
    if (sid) headers.set("x-session-id", sid);
  }

  const res = await fetch(`${BASE}${path}`, { ...init, headers, cache: "no-store" });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = json?.error || json?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json as T;
}

export const api = {
  signUp: (body: { firstName: string; lastName: string; password: string }) =>
    req<AuthResponse>("/auth/signup", { method: "POST", body: JSON.stringify(body) }, false),

  signIn: (body: { firstName: string; lastName: string; password: string }) =>
    req<AuthResponse>("/auth/signin", { method: "POST", body: JSON.stringify(body) }, false),

  me: () => req<{ id: string; userId: string; user: AuthResponse["user"] | null }>("/sessions/me"),

  logout: (sessionId: string) =>
    req(`/sessions/${encodeURIComponent(sessionId)}/terminate`, { method: "PATCH", body: "{}" })
};
