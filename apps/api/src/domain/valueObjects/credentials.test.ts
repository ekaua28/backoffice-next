import { describe, it, expect } from "vitest";
import { Credentials } from "./credentials.js";

describe("Credentials VO", () => {
  it("hash+verify works", async () => {
    const c = await Credentials.fromPlainPassword("123456");
    expect(await c.verify("123456")).toBe(true);
    expect(await c.verify("nope")).toBe(false);
  });
});
