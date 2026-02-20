import { describe, it, expect, vi, beforeEach } from "vitest";
import { setSessionId, getSessionId, clearSessionId, SESSION_KEY } from "./session.storage";

describe("session storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("set/get/clear sessionId", () => {
    expect(getSessionId()).toBe(null);
    setSessionId("abc");
    expect(localStorage.getItem(SESSION_KEY)).toBe("abc");
    expect(getSessionId()).toBe("abc");
    clearSessionId();
    expect(getSessionId()).toBe(null);
  });
});
