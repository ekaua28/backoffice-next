import { describe, it, expect } from "vitest";
import { createDb } from "../src/infrastructure";
import { createApp } from "../src/app";

describe("Users (domain invariants)", () => {
  it("creationTime immutable; lastUpdateTime always changes; inactive cannot rename", async () => {
    const db = createDb(":memory:");
    const app = createApp(db);

    const su = await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: { firstName: "John", lastName: "Doe", password: "123456" }
    });
    const { id: sid, user } = su.json() as any;

    const p1 = await app.inject({
      method: "PATCH",
      url: `/users/${user.id}`,
      headers: { "x-session-id": sid },
      payload: { status: "inactive" }
    });
    const after1 = p1.json() as any;

    const bad = await app.inject({
      method: "PATCH",
      url: `/users/${user.id}`,
      headers: { "x-session-id": sid },
      payload: { firstName: "Jack" }
    });
    expect(bad.statusCode).toBe(400);

    const p2 = await app.inject({
      method: "PATCH",
      url: `/users/${user.id}`,
      headers: { "x-session-id": sid },
      payload: { status: "inactive" }
    });
    const after2 = p2.json() as any;

    expect(after2.creationTime).toBe(after1.creationTime);
    expect(after2.lastUpdateTime).not.toBe(after1.lastUpdateTime);
  });
});
