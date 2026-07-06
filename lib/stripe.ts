import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

export function stripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not configured.");
    client = new Stripe(key);
  }
  return client;
}

/**
 * Webhook signature verification is pure crypto and must work even if the
 * API key isn't set (the placeholder key is never used for API calls).
 */
export function stripeWebhooks(): Stripe.Webhooks {
  return new Stripe(process.env.STRIPE_SECRET_KEY || "sk_placeholder")
    .webhooks;
}
