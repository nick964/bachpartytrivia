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
    <div className="mt-6 bg-raised p-6 sm:p-8">
      <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
        <span className="wax-seal flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-2xl text-white">
          ★
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-xl italic text-primary">
            That&apos;s the free five — unlock unlimited questions
          </p>
          <p className="mt-1 text-sm text-soft">
            Capture every precious detail for a one-time $20 — no subscription.
            The good questions are all still ahead of you. 😏
          </p>
        </div>
        <button
          onClick={checkout}
          disabled={busy}
          className="label-caps shrink-0 bg-primary-deep px-7 py-3.5 text-[11px] text-on-primary transition hover:bg-primary disabled:opacity-60"
        >
          {busy ? "Opening checkout…" : "Go premium"}
        </button>
      </div>
      {error && (
        <p className="mt-4 text-center text-sm font-medium sm:text-left">
          {error}
        </p>
      )}
    </div>
  );
}
