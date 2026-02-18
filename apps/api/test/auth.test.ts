import { describe, it, expect } from "vitest";
import { createDb } from "../src/infrastructure";
import { createApp } from "../src/app";

describe("Auth (domain)", () => {
  it("signup creates session id and increments loginsCounter", async () => {
    const db = createDb(":memory:");
    const app = createApp(db);

    const r = await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: { firstName: "A", lastName: "B", password: "123456" }
    });

    expect(r.statusCode).toBe(200);
    const body = r.json() as any;
    expect(typeof body.id).toBe("string");
    expect(body.user.loginsCounter).toBe(1);
  });

  it("inactive user cannot sign in (domain rule)", async () => {
    const db = createDb(":memory:");
    const app = createApp(db);

    const su = await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: { firstName: "A", lastName: "B", password: "123456" }
    });
    const { id: sid, user } = su.json() as any;

    await app.inject({
      method: "PATCH",
      url: `/users/${user.id}`,
      headers: { "x-session-id": sid },
      payload: { status: "inactive" }
    });

    const si = await app.inject({
      method: "POST",
      url: "/auth/signin",
      payload: { firstName: "A", lastName: "B", password: "123456" }
    });

    expect(si.statusCode).toBe(403);
  });
});
