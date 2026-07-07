import type { HonoreeRole, ThemeName } from "@/lib/db/types";

export const THEMES: Record<
  ThemeName,
  { label: string; description: string }
> = {
  blush: {
    label: "Something Blue",
    description: "Bachelorette classic — ivory, french blue, champagne.",
  },
  navy: {
    label: "Navy & Gold",
    description: "Bachelor edition — deep navy, gold, slate.",
  },
};

export function defaultThemeForRole(role: HonoreeRole): ThemeName {
  return role === "bride" ? "blush" : "navy";
}

export function normalizeTheme(theme: string | null | undefined): ThemeName {
  return theme === "navy" ? "navy" : "blush";
}

/**
 * The role of the person who records the answers. Falls back to the
 * opposite of the guest of honor for events created before responder_role
 * existed (and for two-bride/two-groom parties the host sets it explicitly).
 */
export function responderRoleOf(event: {
  honoree_role: HonoreeRole;
  responder_role?: HonoreeRole | null;
}): HonoreeRole {
  return (
    event.responder_role ??
    (event.honoree_role === "bride" ? "groom" : "bride")
  );
}

export function partyNoun(role: HonoreeRole): string {
  return role === "bride" ? "bachelorette party" : "bachelor party";
}
