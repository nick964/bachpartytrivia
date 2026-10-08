"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * "Have a code?" — redeems a single-use promo code against this event and
 * flips it to premium without Stripe. Collapsed to a text link by default.
 */
export function PromoCodeRedeem({
  eventId,
  startOpen = false,
}: {
  eventId: string;
  startOpen?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(startOpen);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function redeem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/promo/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "That code didn't work.");
        return;
      }
      setDone(true);
      router.refresh();
    } catch {
      setError("Network hiccup — try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p className="text-sm font-semibold text-primary">
        Code accepted — unlimited questions unlocked. ✨
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
      >
        Have a promo code?
      </button>
    );
  }

  return (
    <form onSubmit={redeem} className="text-left">
      <label className="label-caps block text-[10px] text-soft">
        Promo code
      </label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="ABCD-2345"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          maxLength={12}
          autoFocus
          className="w-full border-b border-soft/50 bg-transparent px-0.5 py-2 font-sans text-base uppercase tracking-[0.2em] outline-none transition focus:border-b-2 focus:border-primary sm:max-w-[14rem]"
        />
        <button
          type="submit"
          disabled={busy || !code.trim()}
          className="label-caps shrink-0 border border-primary px-5 py-2.5 text-[10px] text-primary transition hover:bg-primary hover:text-on-primary disabled:opacity-50"
        >
          {busy ? "Checking…" : "Redeem"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs font-medium text-soft">{error}</p>}
    </form>
  );
}
