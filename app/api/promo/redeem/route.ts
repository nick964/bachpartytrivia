import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/db/server";
import { getOwnedEvent, jsonError, requireUser } from "@/lib/api/guards";
import { normalizePromoCode, PROMO_CODE_LENGTH } from "@/lib/promo";
import type { PromoCodeRow } from "@/lib/db/types";

const bodySchema = z.object({
  event_id: z.string().uuid(),
  code: z.string().min(1).max(32),
});

/**
 * Redeem a single-use promo code against one of the caller's events.
 * The claim is one conditional UPDATE (code matches AND not yet redeemed),
 * so two people racing on the same code can't both win.
 */
export async function POST(request: NextRequest) {
  const user = await requireUser();
  if ("error" in user) return user.error;

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return jsonError("Enter a code.", 400);

  const code = normalizePromoCode(parsed.data.code);
  if (code.length !== PROMO_CODE_LENGTH) {
    return jsonError("That doesn't look like a valid code.", 400);
  }

  const owned = await getOwnedEvent(parsed.data.event_id, user.userId);
  if ("error" in owned) return owned.error;
  const event = owned.event;
  if (event.is_premium) {
    return jsonError("This event is already premium. ✨", 400);
  }
  if (event.status === "expired" || event.videos_deleted_at) {
    return jsonError("This event has expired.", 410);
  }

  const db = supabaseAdmin();
  const { data: claimed, error: claimError } = await db
    .from("promo_codes")
    .update({
      redeemed_at: new Date().toISOString(),
      redeemed_by_clerk_id: user.userId,
      redeemed_event_id: event.id,
    })
    .eq("code", code)
    .is("redeemed_at", null)
    .select("*")
    .maybeSingle();
  if (claimError) return jsonError("Could not check that code.", 500);
  if (!claimed) {
    return jsonError("That code isn't valid or has already been used.", 400);
  }

  const { error: upgradeError } = await db
    .from("events")
    .update({ is_premium: true })
    .eq("id", event.id);
  if (upgradeError) {
    // Give the code back so a DB hiccup doesn't burn it.
    await db
      .from("promo_codes")
      .update({
        redeemed_at: null,
        redeemed_by_clerk_id: null,
        redeemed_event_id: null,
      })
      .eq("id", (claimed as PromoCodeRow).id);
    return jsonError("Could not upgrade the event — try again.", 500);
  }

  return NextResponse.json({ ok: true });
}
