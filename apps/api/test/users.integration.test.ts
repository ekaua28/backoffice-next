import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import type { Database } from "better-sqlite3";

import { createDb, UsersRepository } from "../src/infrastructure";
import { createApp } from "../src/app";
import { Credentials, User } from "../src/domain";

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

  describe("UsersRepository (db integration)", () => {
    let db: Database;
    let repo: UsersRepository;

    beforeEach(() => {
      db = createDb(":memory:");

      db.exec(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('active','inactive')),
        loginsCounter INTEGER NOT NULL,
        passwordHash TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);

      vi.spyOn(Credentials, "fromHash").mockImplementation((hash: string) => {
        return {
          toHash: () => hash,
          verify: async () => true,
        } as any;
      });

      repo = new UsersRepository(db as any);
    });

    afterEach(() => {
      vi.restoreAllMocks();
      db.close();
    });

    function mkUser(
      params: Partial<{
        id: string;
        firstName: string;
        lastName: string;
        status: "active" | "inactive";
        loginsCounter: number;
        now: string;
        passwordHash: string;
      }> = {},
    ) {
      const now = params.now ?? "2020-01-01T00:00:00.000Z";
      const passwordHash = params.passwordHash ?? "hash-1";

      return User.create({
        id: params.id ?? "u1",
        firstName: params.firstName ?? "A",
        lastName: params.lastName ?? "B",
        status: params.status ?? "active",
        credentials: {
          toHash: () => passwordHash,
          verify: async () => true,
        } as any,
        now,
      });
    }

    it("create() + findById() roundtrip", () => {
      const u = mkUser({
        id: "u1",
        firstName: "John",
        lastName: "Doe",
        now: "t1",
        passwordHash: "ph1",
      });
      repo.create(u);

      const found = repo.findById("u1");
      expect(found).toBeTruthy();
      expect(found!.id).toBe("u1");
      expect(found!.firstName).toBe("John");
      expect(found!.lastName).toBe("Doe");
      expect(found!.status).toBe("active");
      expect(found!.createdAt).toBe("t1");
      expect(found!.updatedAt).toBe("t1");
    });

    it("findById() returns undefined when not found", () => {
      expect(repo.findById("missing")).toBeUndefined();
    });

    it("findByName() returns user", () => {
      repo.create(
        mkUser({ id: "u1", firstName: "John", lastName: "Doe", now: "t1" }),
      );

      const found = repo.findByName("John", "Doe");
      expect(found).toBeTruthy();
      expect(found!.id).toBe("u1");
    });

    it("list() returns total + paginated items ordered by createdAt DESC", () => {
      repo.create(
        mkUser({ id: "u1", firstName: "A", lastName: "1", now: "t1" }),
      );
      repo.create(
        mkUser({ id: "u2", firstName: "A", lastName: "2", now: "t2" }),
      );
      repo.create(
        mkUser({ id: "u3", firstName: "A", lastName: "3", now: "t3" }),
      );

      const page1 = repo.list(1, 2);
      expect(page1.total).toBe(3);
      expect(page1.items).toHaveLength(2);

      expect(page1.items[0]!.id).toBe("u3");
      expect(page1.items[1]!.id).toBe("u2");

      const page2 = repo.list(2, 2);
      expect(page2.total).toBe(3);
      expect(page2.items).toHaveLength(1);
      expect(page2.items[0]!.id).toBe("u1");
    });

    it("save() updates fields", () => {
      const u = mkUser({
        id: "u1",
        firstName: "John",
        lastName: "Doe",
        now: "t1",
        passwordHash: "ph1",
      });
      repo.create(u);

      const loaded = repo.findById("u1")!;
      loaded.update({ firstName: "Johnny", status: "inactive" }, "t2");
      loaded.bumpLogin("t3");
      repo.save(loaded);

      const after = repo.findById("u1")!;
      expect(after.firstName).toBe("Johnny");
      expect(after.status).toBe("inactive");
      expect(after.loginsCounter).toBe(1);
      expect(after.updatedAt).toBe("t3");
    });

    it("deleteById() returns changes", () => {
      repo.create(mkUser({ id: "u1" }));

      expect(repo.deleteById("u1")).toBe(1);
      expect(repo.deleteById("u1")).toBe(0);
    });
  });
});
