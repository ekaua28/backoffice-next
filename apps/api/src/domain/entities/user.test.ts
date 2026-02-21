import { describe, it, expect, vi } from "vitest";
import { User } from "./user";

const mkCreds = (hash = "h1") =>
  ({
    toHash: vi.fn(() => hash),
    verify: vi.fn(async () => true),
  } as any);

describe("User domain", () => {
  it("create() sets loginsCounter=0 and timestamps", () => {
    const u = User.create({
      id: "u1",
      firstName: "A",
      lastName: "B",
      status: "active",
      credentials: mkCreds(),
      now: "t1",
    });

    expect(u.id).toBe("u1");
    expect(u.loginsCounter).toBe(0);
    expect(u.createdAt).toBe("t1");
    expect(u.updatedAt).toBe("t1");
    expect(u.status).toBe("active");
  });

  it("update() changes names/status and updates updatedAt", () => {
    const u = User.create({
      id: "u1",
      firstName: "A",
      lastName: "B",
      status: "active",
      credentials: mkCreds(),
      now: "t1",
    });

    u.update({ firstName: "AA", status: "inactive" }, "t2");

    expect(u.firstName).toBe("AA");
    expect(u.lastName).toBe("B");
    expect(u.status).toBe("inactive");
    expect(u.updatedAt).toBe("t2");
    expect(u.createdAt).toBe("t1");
  });

  it("inactive user cannot rename unless reactivating in same patch", () => {
    const u = User.create({
      id: "u1",
      firstName: "A",
      lastName: "B",
      status: "inactive",
      credentials: mkCreds(),
      now: "t1",
    });

    expect(() => u.update({ firstName: "X" }, "t2")).toThrow(
      User.InactiveUserCannotRenameError,
    );

    expect(() => u.update({ status: "active", firstName: "X" }, "t3")).not.toThrow();
    expect(u.status).toBe("active");
    expect(u.firstName).toBe("X");
  });

  it("assertCanCreateSession() throws when inactive", () => {
    const u = User.create({
      id: "u1",
      firstName: "A",
      lastName: "B",
      status: "inactive",
      credentials: mkCreds(),
      now: "t1",
    });

    expect(() => u.assertCanCreateSession()).toThrow(
      User.InactiveUserCannotCreateSessionError,
    );
    expect(() => u.assertCanCreateSession()).toThrow(
      "Inactive users cannot create sessions.",
    );
  });

  it("bumpLogin() increments loginsCounter and updates updatedAt", () => {
    const u = User.create({
      id: "u1",
      firstName: "A",
      lastName: "B",
      status: "active",
      credentials: mkCreds(),
      now: "t1",
    });

    u.bumpLogin("t2");
    expect(u.loginsCounter).toBe(1);
    expect(u.updatedAt).toBe("t2");

    u.bumpLogin("t3");
    expect(u.loginsCounter).toBe(2);
    expect(u.updatedAt).toBe("t3");
  });

  it("toPersistence() includes passwordHash via credentials.toHash()", () => {
    const creds = mkCreds("hash-x");
    const u = User.create({
      id: "u1",
      firstName: "A",
      lastName: "B",
      status: "active",
      credentials: creds,
      now: "t1",
    });

    const row = u.toPersistence();

    expect(creds.toHash).toHaveBeenCalledTimes(1);
    expect(row).toEqual({
      id: "u1",
      firstName: "A",
      lastName: "B",
      status: "active",
      loginsCounter: 0,
      passwordHash: "hash-x",
      createdAt: "t1",
      updatedAt: "t1",
    });
  });

  it("fromPersistence() uses Credentials.fromHash and preserves fields", async () => {
    const mod = await import("../valueObjects/index.js");
    const spy = vi
      .spyOn(mod.Credentials, "fromHash")
      .mockReturnValue(mkCreds("hash-x"));

    const u = User.fromPersistence({
      id: "u1",
      firstName: "A",
      lastName: "B",
      status: "inactive",
      loginsCounter: 5,
      createdAt: "t1",
      updatedAt: "t2",
      passwordHash: "hash-x",
    });

    expect(spy).toHaveBeenCalledWith("hash-x");
    expect(u.id).toBe("u1");
    expect(u.status).toBe("inactive");
    expect(u.loginsCounter).toBe(5);
    expect(u.createdAt).toBe("t1");
    expect(u.updatedAt).toBe("t2");
  });
});