import type { HonoreeRole, ThemeName } from "@/lib/db/types";

export const THEMES: Record<
  ThemeName,
  { label: string; description: string }
> = {
  blush: {
    label: "Blush & Rose Gold",
    description: "Bachelorette classic — cream, blush, rose gold.",
  },
  navy: {
    label: "Navy & Gold",
    description: "Bachelor edition — navy, gold, charcoal.",
  },
};

export function defaultThemeForRole(role: HonoreeRole): ThemeName {
  return role === "bride" ? "blush" : "navy";
}

export function normalizeTheme(theme: string | null | undefined): ThemeName {
  return theme === "navy" ? "navy" : "blush";
}

/** The person who records answers, given the honoree who guesses. */
export function responderNoun(role: HonoreeRole): string {
  return role === "bride" ? "groom" : "bride";
}

export function partyNoun(role: HonoreeRole): string {
  return role === "bride" ? "bachelorette party" : "bachelor party";
}
