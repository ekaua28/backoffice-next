import { request, expect, type APIRequestContext } from "@playwright/test";

export async function resetApi() {
  const ctx: APIRequestContext = await request.newContext({
    baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4000"
  });
  const r = await ctx.post("/test/reset");
  expect(r.status()).toBe(204);
  await ctx.dispose();
}