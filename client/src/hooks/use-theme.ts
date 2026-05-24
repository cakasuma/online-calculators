import { useState, useEffect, useCallback } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "toolhub-theme";

function readSavedTheme(): Theme | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // SecurityError: storage blocked by privacy settings or embedded context
  }
  return null;
}

function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // SecurityError: silently degrade — theme still applies for this session
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const saved = readSavedTheme();
      if (saved) return saved;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    saveTheme(theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return { theme, toggle };
}
