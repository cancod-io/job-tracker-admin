export const THEME_STORAGE_KEY = "shopify-job-tracker-theme" as const;

export type ThemeMode = "light" | "dark" | "system";

export function readThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const v = localStorage.getItem(THEME_STORAGE_KEY);
  if (v === "light" || v === "dark" || v === "system") return v;
  return "system";
}

export function isDarkMode(mode: ThemeMode): boolean {
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Inline script for root layout — runs before paint to avoid theme flash. */
export function themeInlineScript(): string {
  const k = JSON.stringify(THEME_STORAGE_KEY);
  return `(function(){try{var k=${k};var t=localStorage.getItem(k);var systemDark=window.matchMedia("(prefers-color-scheme: dark)").matches;var dark=t==="dark"||(t!=="light"&&systemDark);document.documentElement.classList.toggle("dark",dark);}catch(e){}})();`;
}
