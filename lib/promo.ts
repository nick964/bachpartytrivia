/**
 * Promo code helpers shared by client and server. Codes are 8 characters
 * from an unambiguous alphabet (no 0/O/1/I) and shown as XXXX-XXXX.
 */
export const PROMO_CODE_LENGTH = 8;

/** Uppercase and strip everything that isn't a letter or digit. */
export function normalizePromoCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** "ABCD2345" -> "ABCD-2345" for display and sharing. */
export function formatPromoCode(code: string): string {
  const c = normalizePromoCode(code);
  return c.length === PROMO_CODE_LENGTH ? `${c.slice(0, 4)}-${c.slice(4)}` : c;
}
