import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOwnedEvent, jsonError, requireUser } from "@/lib/api/guards";
import { stripe } from "@/lib/stripe";

const bodySchema = z.object({ event_id: z.string().uuid() });

/** One-time $20 premium upgrade for a single event, via Stripe Checkout. */
export async function POST(request: NextRequest) {
  const user = await requireUser();
  if ("error" in user) return user.error;

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid request.", 400);

  const owned = await getOwnedEvent(parsed.data.event_id, user.userId);
  if ("error" in owned) return owned.error;
  const event = owned.event;
  if (event.is_premium) {
    return jsonError("This event is already premium. 🥂", 400);
  }

  const price = process.env.STRIPE_PRICE_ID_PREMIUM;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!price || !appUrl) {
    return jsonError("Payments aren't configured yet.", 503);
  }

  try {
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      line_items: [{ price, quantity: 1 }],
      client_reference_id: event.id,
      metadata: { event_id: event.id, owner_clerk_id: user.userId },
      success_url: `${appUrl}/dashboard/events/${event.id}?upgraded=1`,
      cancel_url: `${appUrl}/dashboard/events/${event.id}`,
    });
    if (!session.url) return jsonError("Stripe didn't return a checkout URL.", 502);
    return NextResponse.json({ url: session.url });
  } catch {
    return jsonError("Couldn't open checkout — try again in a moment.", 502);
  }
}
