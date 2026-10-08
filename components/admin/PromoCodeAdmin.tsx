"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PromoCodeRow } from "@/lib/db/types";
import { formatPromoCode } from "@/lib/promo";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      // Rendered inside the generate <form>; without this it submits it.
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="label-caps shrink-0 px-2 py-1 text-[10px] text-primary transition hover:text-primary-deep"
    >
      {copied ? "Copied ✓" : "⧉ Copy"}
    </button>
  );
}

/** Two-tap delete for an unredeemed code: "Delete" → "Sure?" → gone. */
function DeleteButton({ id, onError }: { id: string; onError: (m: string) => void }) {
  const router = useRouter();
  const [arming, setArming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/promo-codes/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        onError(data.error ?? "Could not delete the code.");
        setArming(false);
        return;
      }
      router.refresh();
    } catch {
      onError("Network hiccup — try again.");
      setArming(false);
    } finally {
      setBusy(false);
    }
  }

  if (!arming) {
    return (
      <button
        type="button"
        onClick={() => setArming(true)}
        className="text-xs text-soft underline-offset-2 hover:text-ink hover:underline"
      >
        Delete
      </button>
    );
  }
  return (
    <span className="flex items-center gap-2 text-xs">
      <button
        type="button"
        onClick={() => void remove()}
        disabled={busy}
        className="label-caps border border-primary px-2.5 py-1 text-[10px] text-primary transition hover:bg-primary hover:text-on-primary disabled:opacity-50"
      >
        {busy ? "…" : "Sure?"}
      </button>
      <button
        type="button"
        onClick={() => setArming(false)}
        disabled={busy}
        className="text-soft hover:text-ink"
      >
        Keep
      </button>
    </span>
  );
}

/** Generate form + the full list of codes with redemption status. */
export function PromoCodeAdmin({ codes }: { codes: PromoCodeRow[] }) {
  const router = useRouter();
  const [count, setCount] = useState(5);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justMade, setJustMade] = useState<PromoCodeRow[]>([]);

  async function generate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count, note: note.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not generate codes.");
        return;
      }
      setJustMade(data.codes);
      setNote("");
      router.refresh();
    } catch {
      setError("Network hiccup — try again.");
    } finally {
      setBusy(false);
    }
  }

  const [listError, setListError] = useState<string | null>(null);
  const unused = codes.filter((c) => !c.redeemed_at);
  const used = codes.filter((c) => c.redeemed_at);
  const inputCls =
    "w-full border-b border-soft/50 bg-transparent px-0.5 py-2 font-serif text-base outline-none transition focus:border-b-2 focus:border-primary";

  return (
    <div className="space-y-10">
      <form onSubmit={generate} className="double-keyline p-6 sm:p-8">
        <h2 className="font-display text-2xl text-primary">Generate codes</h2>
        <p className="mt-1 text-sm italic text-soft">
          Each code unlocks premium on one event, once. Hand them out however
          you like.
        </p>
        <div className="mt-6 grid gap-6 sm:grid-cols-[8rem_1fr]">
          <label className="block">
            <span className="label-caps block text-[10px] text-soft">How many</span>
            <input
              type="number"
              min={1}
              max={50}
              value={count}
              onChange={(e) => setCount(Number(e.target.value) || 1)}
              className={`mt-2 ${inputCls}`}
            />
          </label>
          <label className="block">
            <span className="label-caps block text-[10px] text-soft">
              Note (optional — who they&apos;re for)
            </span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={120}
              placeholder="Instagram outreach, Oct"
              className={`mt-2 ${inputCls}`}
            />
          </label>
        </div>
        {error && (
          <p className="mt-4 border border-line bg-raised px-4 py-2.5 text-sm">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="label-caps mt-6 bg-primary px-7 py-3 text-[11px] text-on-primary transition hover:bg-primary-deep disabled:opacity-60"
        >
          {busy ? "Generating…" : "Generate"}
        </button>

        {justMade.length > 0 && (
          <div className="mt-6 border-t border-line pt-5">
            <p className="label-caps text-[10px] text-soft">Just created</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {justMade.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-1 border border-primary/40 bg-raised pl-3"
                >
                  <span className="font-sans text-sm font-bold tracking-[0.2em] text-primary">
                    {formatPromoCode(c.code)}
                  </span>
                  <CopyButton text={formatPromoCode(c.code)} />
                </li>
              ))}
            </ul>
            <CopyButton
              text={justMade.map((c) => formatPromoCode(c.code)).join("\n")}
            />
          </div>
        )}
      </form>

      <section>
        <h2 className="font-display text-2xl text-primary">
          Unused <span className="text-soft">({unused.length})</span>
        </h2>
        {listError && (
          <p className="mt-3 border border-line bg-raised px-4 py-2.5 text-sm">
            {listError}
          </p>
        )}
        {unused.length === 0 ? (
          <p className="mt-3 text-sm italic text-soft">
            None left — generate a few above.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-line border border-line bg-surface">
            {unused.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm"
              >
                <span className="font-sans font-bold tracking-[0.2em] text-primary">
                  {formatPromoCode(c.code)}
                </span>
                <CopyButton text={formatPromoCode(c.code)} />
                <span className="min-w-0 flex-1 truncate italic text-soft">
                  {c.note ?? ""}
                </span>
                <span className="text-xs text-soft">
                  {new Date(c.created_at).toLocaleDateString()}
                </span>
                <DeleteButton id={c.id} onError={setListError} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-2xl text-primary">
          Redeemed <span className="text-soft">({used.length})</span>
        </h2>
        {used.length === 0 ? (
          <p className="mt-3 text-sm italic text-soft">Nobody has used one yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line border border-line bg-surface">
            {used.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm"
              >
                <span className="font-sans font-bold tracking-[0.2em] text-soft line-through">
                  {formatPromoCode(c.code)}
                </span>
                <span className="min-w-0 flex-1 truncate italic text-soft">
                  {c.note ?? ""}
                </span>
                <span className="text-xs text-soft">
                  used {new Date(c.redeemed_at!).toLocaleDateString()}
                  {c.redeemed_event_id && (
                    <>
                      {" · "}
                      <a
                        href={`/dashboard/events/${c.redeemed_event_id}`}
                        className="underline-offset-2 hover:underline"
                        title="Opens only if you own the event"
                      >
                        event
                      </a>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
