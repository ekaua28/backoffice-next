import { req } from "./client";
import type { AuthResponse } from "./types";

export const signUp = (body: {
  firstName: string;
  lastName: string;
  password: string;
}) =>
  req<AuthResponse>(
    "/auth/signup",
    { method: "POST", body: JSON.stringify(body) },
    false,
  );

export const signIn = (body: {
  firstName: string;
  lastName: string;
  password: string;
}) =>
  req<AuthResponse>(
    "/auth/signin",
    { method: "POST", body: JSON.stringify(body) },
    false,
  );

export const me = () =>
  req<{ id: string; userId: string; user: AuthResponse["user"] | null }>(
    "/sessions/me",
  );

export const logout = (sessionId: string) =>
  req(`/sessions/${encodeURIComponent(sessionId)}/terminate`, {
    method: "PATCH",
    body: "{}",
  });
