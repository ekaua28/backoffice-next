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
      payload: { firstName: "John", lastName: "Doe", password: "123456" },
    });
    const { id: sid, user } = su.json();

    const p0 = await app.inject({
      method: "POST",
      url: `/users`,
      headers: { "x-session-id": sid },
      payload: { firstName: "John1", lastName: "Doe1", password: "123456" },
    });

    expect(p0.statusCode).toBe(201);
    const createdUser = p0.json();

    const p1 = await app.inject({
      method: "PATCH",
      url: `/users/${createdUser.id}`,
      headers: { "x-session-id": sid },
      payload: { status: "inactive" },
    });
    const after1 = p1.json();

    const bad = await app.inject({
      method: "PATCH",
      url: `/users/${createdUser.id}`,
      headers: { "x-session-id": sid },
      payload: { firstName: "Jack" },
    });
    expect(bad.statusCode).toBe(400);

    const p2 = await app.inject({
      method: "PATCH",
      url: `/users/${createdUser.id}`,
      headers: { "x-session-id": sid },
      payload: { status: "inactive" },
    });
    const after2 = p2.json();

    expect(after2.creationTime).toBe(after1.creationTime);
    expect(after2.lastUpdateTime).not.toBe(after1.lastUpdateTime);
  });
  it("cannot deactivate yourself", async () => {
    const db = createDb(":memory:");
    const app = createApp(db);

    const su = await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: { firstName: "Me", lastName: "User", password: "123456" },
    });
    const { id: sid, user } = su.json() as any;

    const r = await app.inject({
      method: "PATCH",
      url: `/users/${user.id}`,
      headers: { "x-session-id": sid },
      payload: { status: "inactive" },
    });

    expect(r.statusCode).toBe(403);
  });

  it("cannot delete yourself", async () => {
    const db = createDb(":memory:");
    const app = createApp(db);

    const su = await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: { firstName: "Me", lastName: "User", password: "123456" },
    });
    const { id: sid, user } = su.json() as any;

    const r = await app.inject({
      method: "DELETE",
      url: `/users/${user.id}`,
      headers: { "x-session-id": sid },
    });

    expect(r.statusCode).toBe(403);
  });
});
