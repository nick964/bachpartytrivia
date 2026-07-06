import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { supabaseAdmin } from "@/lib/db/server";
import { stripeWebhooks } from "@/lib/stripe";

/**
 * Stripe webhook — the only thing that flips is_premium. Client success
 * redirects are never trusted. Requires the raw body for signature
 * verification.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) {
    return NextResponse.json({ error: "Not configured." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await request.text();
    event = await stripeWebhooks().constructEventAsync(
      rawBody,
      signature,
      secret
    );
  } catch {
    return NextResponse.json({ error: "Bad signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const eventId =
      session.metadata?.event_id ?? session.client_reference_id;
    if (session.payment_status === "paid" && eventId) {
      const paymentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? session.id);
      const { error } = await supabaseAdmin()
        .from("events")
        .update({ is_premium: true, stripe_payment_id: paymentId })
        .eq("id", eventId);
      if (error) {
        // 500 → Stripe retries, which is what we want.
        return NextResponse.json({ error: "DB update failed." }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
