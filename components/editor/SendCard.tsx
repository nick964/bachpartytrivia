"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { EventRow } from "@/lib/db/types";
import { partyNoun } from "@/lib/theme";

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="shrink-0 rounded-full border border-line bg-surface px-4 py-2 text-xs font-bold transition hover:border-primary"
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}

export function SendCard({
  event,
  questionCount,
}: {
  event: EventRow;
  questionCount: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const respondUrl = `${appUrl}/respond/${event.respond_token}`;
  const watchUrl = `${appUrl}/watch/${event.playback_token}`;
  const sent = event.status !== "draft" && event.status !== "expired";

  const funnyText = `${event.honoree_name}, you have homework 🍾 It's for ${
    event.title
  } — answer a few questions on video before the ${partyNoun(
    event.honoree_role
  )}. Takes 10 minutes, no app needed, and yes, everyone will see it: ${respondUrl}`;

  async function send() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${event.id}/send`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not get the link.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network hiccup — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
      <h2 className="text-lg font-bold">
        {sent ? `${event.honoree_name}'s link` : `Send to ${event.honoree_name}`}
      </h2>

      {!sent ? (
        <>
          <p className="mt-1 text-sm text-soft">
            Ready? This reveals {event.honoree_name}&apos;s private recording
            link. You can still edit questions after sending.
          </p>
          <button
            onClick={send}
            disabled={busy || questionCount === 0}
            className="mt-4 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-on-primary transition hover:bg-primary-deep disabled:opacity-50"
          >
            {busy
              ? "One sec…"
              : questionCount === 0
                ? "Add a question first"
                : `Get ${event.honoree_name}'s link`}
          </button>
        </>
      ) : (
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-soft">
              Recording link — text it to {event.honoree_name}
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-xl border border-line bg-bg px-3 py-2 text-xs">
                {respondUrl}
              </code>
              <CopyButton text={respondUrl} label="Copy link" />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-soft">
              Or copy a ready-made text message
            </p>
            <div className="mt-1.5 flex items-start gap-2">
              <p className="min-w-0 flex-1 rounded-xl border border-line bg-bg px-3 py-2 text-xs leading-relaxed text-soft">
                {funnyText}
              </p>
              <CopyButton text={funnyText} label="Copy text" />
            </div>
          </div>
          {(event.status === "ready" || event.status === "completed") && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-soft">
                Party link — open on the TV at the party
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-xl border border-line bg-bg px-3 py-2 text-xs">
                  {watchUrl}
                </code>
                <CopyButton text={watchUrl} label="Copy link" />
              </div>
            </div>
          )}
        </div>
      )}
      {error && (
        <p className="mt-4 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium">
          {error}
        </p>
      )}
    </section>
  );
}
