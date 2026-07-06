"use client";

import { useState } from "react";

export function UpgradeCard({ eventId }: { eventId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setError(data.error ?? "Checkout isn't available right now.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network hiccup — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-5 rounded-2xl border-2 border-primary bg-raised p-5 text-center">
      <p className="font-script text-3xl text-primary">
        That&apos;s the free three!
      </p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-soft">
        Unlock unlimited questions for this event — one-time $20, no
        subscription. The good questions are all still ahead of you. 😏
      </p>
      <button
        onClick={checkout}
        disabled={busy}
        className="mt-4 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-on-primary transition hover:bg-primary-deep disabled:opacity-60"
      >
        {busy ? "Opening checkout…" : "Upgrade for $20"}
      </button>
      {error && <p className="mt-3 text-sm font-medium">{error}</p>}
    </div>
  );
}
