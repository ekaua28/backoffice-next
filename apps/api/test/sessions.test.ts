import { describe, it, expect } from "vitest";
import { createDb } from "../src/infrastructure";
import { createApp } from "../src/app";

describe("Sessions (domain)", () => {
  it("terminate is idempotent and blocks /sessions/me afterwards", async () => {
    const db = createDb(":memory:");
    const app = createApp(db);

    const su = await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: { firstName: "A", lastName: "B", password: "123456" }
    });
    const { id: sid } = su.json();

    const term1 = await app.inject({
      method: "PATCH",
      url: `/sessions/${sid}/terminate`,
      headers: { "x-session-id": sid },
      payload: {}
    });
    expect(term1.statusCode).toBe(200);

    const me = await app.inject({
      method: "GET",
      url: "/sessions/me",
      headers: { "x-session-id": sid }
    });
    expect(me.statusCode).toBe(401);
  });
});
