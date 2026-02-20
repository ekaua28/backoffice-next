"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createTheme,
  ThemeProvider as MuiThemeProvider,
} from "@mui/material/styles";
import type { Theme } from "../lib/theme";
import { applyTheme, getTheme, setTheme } from "../lib/theme/";

type ThemeCtx = { theme: Theme; toggle: () => void; set: (t: Theme) => void };
const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const t = getTheme();
    setThemeState(t);
    applyTheme(t);
  }, []);

  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: { mode: theme },
        shape: { borderRadius: 12 },
      }),
    [theme],
  );

  const value = useMemo<ThemeCtx>(
    () => ({
      theme,
      toggle: () => {
        const next: Theme = theme === "dark" ? "light" : "dark";
        setThemeState(next);
        setTheme(next);
      },
      set: (t) => {
        setThemeState(t);
        setTheme(t);
      },
    }),
    [theme],
  );

  return (
    <Ctx.Provider value={value}>
      <MuiThemeProvider theme={muiTheme}>{children}</MuiThemeProvider>
    </Ctx.Provider>
  );
}

export function useTheme() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTheme must be used within ThemeProvider");
  return v;
}
