export type Theme = "light" | "dark";
export const THEME_KEY = "theme";

export function getTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const v = window.localStorage.getItem(THEME_KEY);
  return v === "dark" ? "dark" : "light";
}

export function setTheme(t: Theme) {
  window.localStorage.setItem(THEME_KEY, t);
  applyTheme(t);
}

export function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = t;
}
