"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Shown after returning from Stripe Checkout. The webhook flips
 * is_premium — we poll until it lands rather than trusting the redirect.
 */
export function PremiumPoller({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    let stopped = false;
    let tries = 0;
    async function poll() {
      while (!stopped && tries < 30) {
        tries += 1;
        try {
          const res = await fetch(`/api/events/${eventId}`);
          const data = await res.json().catch(() => ({}));
          if (data.event?.is_premium) {
            router.refresh();
            return;
          }
        } catch {
          // keep polling
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
      if (!stopped) setTimedOut(true);
    }
    void poll();
    return () => {
      stopped = true;
    };
  }, [eventId, router]);

  return (
    <p className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold">
      {timedOut
        ? "Payment is taking a moment to confirm — refresh in a minute, or contact us if it doesn't appear."
        : "Confirming your payment… 🥂 (this usually takes a few seconds)"}
    </p>
  );
}
