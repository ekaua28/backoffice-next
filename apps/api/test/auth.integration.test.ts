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
      payload: { firstName: "A", lastName: "B", password: "123456" },
    });

    expect(r.statusCode).toBe(200);
    const body: unknown = r.json();
    expect(body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        user: expect.objectContaining({
          loginsCounter: 1,
        }),
      }),
    );
  });

  it("inactive user cannot sign in (domain rule)", async () => {
    const db = createDb(":memory:");
    const app = createApp(db);

    const u = await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: { firstName: "A", lastName: "B", password: "123456" },
    });
    const { id: firstSid, user: firstUser } = u.json();

    const res1 = await app.inject({
      method: "PATCH",
      url: `/sessions/${firstSid}/terminate`,
      headers: { "x-session-id": firstSid },
      payload: {},
    });
    expect(res1.statusCode).toBe(200);

    const su = await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: { firstName: "A1", lastName: "B1", password: "123456" },
    });
    const { id: sid, user } = su.json();

    const res2 = await app.inject({
      method: "PATCH",
      url: `/users/${firstUser.id}`,
      headers: { "x-session-id": sid },
      payload: { status: "inactive" },
    });

    expect(res2.statusCode).toBe(200);

    const res3 = await app.inject({
      method: "PATCH",
      url: `/sessions/${sid}/terminate`,
      headers: { "x-session-id": sid },
      payload: {},
    });
    expect(res3.statusCode).toBe(200);

    const si = await app.inject({
      method: "POST",
      url: "/auth/signin",
      payload: { firstName: "A", lastName: "B", password: "123456" },
    });

    expect(si.statusCode).toBe(403);
  });
});
