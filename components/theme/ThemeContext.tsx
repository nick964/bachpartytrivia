"use client";

import { createContext, useContext } from "react";
import type { ThemeName } from "@/lib/db/types";

const ThemeContext = createContext<ThemeName>("blush");

export function useTheme(): ThemeName {
  return useContext(ThemeContext);
}

/**
 * Scopes an edition palette over a subtree. All Tailwind theme tokens
 * (bg-bg, text-ink, text-primary, …) resolve against the nearest scope.
 */
export function ThemeScope({
  theme,
  children,
  className,
}: {
  theme: ThemeName;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ThemeContext.Provider value={theme}>
      <div data-theme={theme} className={className}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
