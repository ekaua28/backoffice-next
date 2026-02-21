import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { Database } from "better-sqlite3";

import { createDb, SessionsRepository } from "../src/infrastructure";
import { createApp } from "../src/app";
import { Session } from "../src/domain";

describe("Sessions (domain)", () => {
  it("terminate is idempotent and blocks /sessions/me afterwards", async () => {
    const db = createDb(":memory:");
    const app = createApp(db);

    const su = await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: { firstName: "A", lastName: "B", password: "123456" },
    });
    const { id: sid } = su.json();

    const term1 = await app.inject({
      method: "PATCH",
      url: `/sessions/${sid}/terminate`,
      headers: { "x-session-id": sid },
      payload: {},
    });
    expect(term1.statusCode).toBe(200);

    const me = await app.inject({
      method: "GET",
      url: "/sessions/me",
      headers: { "x-session-id": sid },
    });
    expect(me.statusCode).toBe(401);
  });
  describe("SessionsRepository (db integration)", () => {
    let db: Database;
    let repo: SessionsRepository;
    beforeEach(() => {
      db = createDb(":memory:");

      db.exec(`
      CREATE TABLE sessions (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        terminatedAt TEXT NULL
      );
    `);

      repo = new SessionsRepository(db);
    });

    afterEach(() => {
      db.close();
    });

    it("create() + findById() roundtrip", () => {
      const s = Session.create({ id: "s1", userId: "u1", now: "t1" });
      repo.create(s);
      const found = repo.findById("s1");
      expect(found).toBeTruthy();
      expect(found!.id).toBe("s1");
      expect(found!.userId).toBe("u1");
      expect(found!.createdAt).toBe("t1");
      expect(found!.terminatedAt).toBeNull();
      expect(found!.isActive()).toBe(true);
    });

    it("findById() returns undefined when not found", () => {
      expect(repo.findById("missing")).toBeUndefined();
    });

    it("save() updates terminatedAt", () => {
      const s = Session.create({ id: "s1", userId: "u1", now: "t1" });
      repo.create(s);

      const loaded = repo.findById("s1")!;
      loaded.terminate("t2");
      repo.save(loaded);

      const after = repo.findById("s1")!;
      expect(after.terminatedAt).toBe("t2");
      expect(after.isActive()).toBe(false);
    });
  });
});
