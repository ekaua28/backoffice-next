import { describe, it, expect } from "vitest";
import { Session } from "./session.js";

describe("Session entity", () => {
  it("create() sets terminatedAt=null and active", () => {
    const s = Session.create({ id: "s1", userId: "u1", now: "t1" });

    expect(s.id).toBe("s1");
    expect(s.userId).toBe("u1");
    expect(s.createdAt).toBe("t1");
    expect(s.terminatedAt).toBeNull();
    expect(s.isActive()).toBe(true);
  });

  it("terminate() sets terminatedAt once (idempotent)", () => {
    const s = Session.create({ id: "s1", userId: "u1", now: "t1" });

    s.terminate("t2");
    expect(s.terminatedAt).toBe("t2");

    s.terminate("t3");
    expect(s.terminatedAt).toBe("t2");
  });

  it("assertActive() throws after termination", () => {
    const s = Session.create({ id: "s1", userId: "u1", now: "t1" });
    s.terminate("t2");

    expect(() => s.assertActive()).toThrow(Session.SessionTerminatedError);
    expect(() => s.assertActive()).toThrow("Session terminated.");
  });

  it("toPersistence()/fromPersistence() roundtrip", () => {
    const row = {
      id: "s1",
      userId: "u1",
      createdAt: "t1",
      terminatedAt: "t2",
    };

    const s = Session.fromPersistence(row);
    expect(s.toPersistence()).toEqual(row);
  });
});