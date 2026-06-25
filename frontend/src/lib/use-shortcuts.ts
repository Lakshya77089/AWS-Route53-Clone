"use client";

import { useEffect } from "react";

export interface Shortcut {
  /** The key to listen for, e.g. "/" or "c". Compared case-insensitively. */
  key: string;
  handler: () => void;
}

/**
 * Register page-level keyboard shortcuts. Shortcuts are ignored while the user
 * is typing in an input, textarea, or select so they never hijack typing.
 */
export function useShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const typing =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable;

      // Allow Escape to work everywhere (e.g. to blur a field); otherwise skip
      // while typing or when a modifier is held.
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (typing && e.key !== "Escape") return;

      const match = shortcuts.find(
        (s) => s.key.toLowerCase() === e.key.toLowerCase(),
      );
      if (match) {
        e.preventDefault();
        match.handler();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts]);
}
