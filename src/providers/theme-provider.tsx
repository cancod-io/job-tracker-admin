"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { isDarkMode, readThemeMode, THEME_STORAGE_KEY, type ThemeMode } from "@/lib/theme";

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    setModeState(readThemeMode());
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode(mode));
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      /* ignore quota / private mode */
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      document.documentElement.classList.toggle("dark", mq.matches);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
  }, []);

  return <ThemeContext.Provider value={{ mode, setMode }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
