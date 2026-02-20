import { getSessionId } from "../auth/session.storage";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function req<T>(
  path: string,
  init: RequestInit = {},
  withSession = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  const hasBody =
    init.body !== undefined &&
    init.body !== null &&
    !(typeof init.body === "string" && init.body.length === 0);

  if (hasBody && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  if (withSession) {
    const sid = getSessionId();
    if (sid) headers.set("x-session-id", sid);
  }

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = json?.error || json?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json as T;
}
