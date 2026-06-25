"use client";

import { useCallback, useEffect, type ReactNode } from "react";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleTheme } from "@/store/theme-slice";

/**
 * Syncs the Redux theme value to the <html> data-theme attribute and
 * localStorage. State itself lives in the `theme` slice.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useAppSelector((s) => s.theme.theme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return <>{children}</>;
}

/** Drop-in replacement for the old context hook, backed by Redux. */
export function useTheme() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((s) => s.theme.theme);
  const toggle = useCallback(() => dispatch(toggleTheme()), [dispatch]);
  return { theme, toggle };
}
