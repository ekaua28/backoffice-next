import { describe, it, expect, beforeEach } from "vitest";
import { applyTheme, getTheme, setTheme, THEME_KEY } from "./theme";

describe("theme persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.dataset.theme = "";
  });

  it("defaults to light", () => {
    expect(getTheme()).toBe("light");
  });

  it("persists theme and applies to html", () => {
    setTheme("dark");
    expect(localStorage.getItem(THEME_KEY)).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");

    applyTheme("light");
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});