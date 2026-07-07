"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { EventRow } from "@/lib/db/types";
import { partyNoun, responderNoun } from "@/lib/theme";

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="label-caps shrink-0 px-3 py-2 text-[10px] text-primary transition hover:text-primary-deep"
    >
      {copied ? "Copied ✓" : `⧉ ${label}`}
    </button>
  );
}

/** Fine-line bunting garland flourish. */
function Bunting() {
  return (
    <svg
      viewBox="0 0 160 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      className="mx-auto h-6 w-40 text-primary/70"
      aria-hidden
    >
      <path d="M4 6c30 10 62 10 76 4 14-6 46-6 76-4" />
      <circle cx="30" cy="11" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="66" cy="12.5" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="100" cy="11.5" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="132" cy="8.5" r="1.6" fill="currentColor" stroke="none" />
    </svg>
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

  const pronoun = event.honoree_role === "bride" ? "His" : "Her";
  // The honoree is the one guessing at the party.
  const guesser = event.honoree_role;

  const funnyText = `${event.honoree_name}, you have homework ✨ It's for ${
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
    <section className="double-keyline p-6 sm:p-10">
      <Bunting />
      <h2 className="mt-4 text-center font-display text-3xl italic text-primary">
        {sent
          ? `It's in ${event.honoree_name}'s hands now`
          : `Send it to ${event.honoree_name}`}
      </h2>

      {!sent ? (
        <>
          <p className="mx-auto mt-3 max-w-md text-center text-sm leading-relaxed text-soft">
            Ready? This reveals {event.honoree_name}&apos;s private recording
            link. {pronoun} answers stay secret until the big reveal — and you
            can still edit questions after sending.
          </p>
          <div className="mt-7 text-center">
            <button
              onClick={send}
              disabled={busy || questionCount === 0}
              className="label-caps bg-primary px-8 py-3.5 text-[11px] text-on-primary transition hover:bg-primary-deep disabled:opacity-50"
            >
              {busy
                ? "One sec…"
                : questionCount === 0
                  ? "Add a question first"
                  : `Get ${event.honoree_name}'s link`}
            </button>
          </div>
          <div className="mx-auto mt-8 max-w-lg">
            <NoteEditor event={event} />
          </div>
        </>
      ) : (
        <>
          <p className="mx-auto mt-3 max-w-md text-center text-sm leading-relaxed text-soft">
            Share this link with the {responderNoun(event.honoree_role)} to
            start the game. {pronoun} answers will be kept secret until the{" "}
            {guesser}&apos;s big reveal.
          </p>

          <div className="mx-auto mt-8 max-w-lg">
            <p className="label-caps text-[10px] text-soft">
              Direct share link — text it to {event.honoree_name}
            </p>
            <div className="mt-2 flex items-center gap-2 border-b border-line pb-2">
              <span className="min-w-0 flex-1 truncate font-display text-base text-primary">
                {respondUrl}
              </span>
              <CopyButton text={respondUrl} label="Copy" />
            </div>

            <div className="keyline letterpress mt-8 p-5">
              <p className="label-caps text-[10px] text-soft">Suggested text</p>
              <p className="mt-3 font-serif text-sm italic leading-relaxed text-ink">
                &ldquo;{funnyText}&rdquo;
              </p>
              <CopyMessageButton text={funnyText} />
            </div>

            {(event.status === "ready" || event.status === "completed") && (
              <div className="mt-8">
                <p className="label-caps text-[10px] text-soft">
                  Party link — open on the TV at the party
                </p>
                <div className="mt-2 flex items-center gap-2 border-b border-line pb-2">
                  <span className="min-w-0 flex-1 truncate font-display text-base text-primary">
                    {watchUrl}
                  </span>
                  <CopyButton text={watchUrl} label="Copy" />
                </div>
              </div>
            )}

            <div className="mt-8">
              <NoteEditor event={event} />
            </div>

            <div className="engraved-divider mt-9" />
            <p className="mt-5 text-center text-sm italic text-soft">
              ✉ We&apos;ll email you the moment{" "}
              {event.honoree_role === "bride" ? "he" : "she"} finishes.
            </p>
          </div>
        </>
      )}
      {error && (
        <p className="mx-auto mt-5 max-w-lg border border-line bg-raised px-4 py-2.5 text-sm">
          {error}
        </p>
      )}
    </section>
  );
}

/** Optional written note the honoree reads when they open their link. */
function NoteEditor({ event }: { event: EventRow }) {
  const [note, setNote] = useState(event.respond_message ?? "");
  const [saved, setSaved] = useState<string>(event.respond_message ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = note.trim() !== saved.trim();

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respond_message: note.trim() || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Couldn't save the note.");
        return;
      }
      setSaved(note);
    } catch {
      setError("Network hiccup — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="text-left">
      <p className="label-caps text-[10px] text-soft">
        ✎ A note {event.honoree_name} reads when the link opens (optional)
      </p>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={500}
        rows={3}
        placeholder={`e.g. No overthinking, ${event.honoree_name} — first answer that comes to mind. We love you. Mostly.`}
        className="mt-2 w-full resize-none border border-line bg-surface p-3 font-serif text-sm italic leading-relaxed outline-none transition focus:border-primary"
      />
      <div className="mt-1 flex items-center justify-between gap-3">
        <span className="text-[11px] text-soft">{note.length}/500</span>
        {dirty ? (
          <button
            onClick={() => void save()}
            disabled={busy}
            className="label-caps bg-primary px-4 py-2 text-[10px] text-on-primary transition hover:bg-primary-deep disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save note"}
          </button>
        ) : (
          saved.trim() && (
            <span className="text-[11px] italic text-soft">Saved ✓</span>
          )
        )}
      </div>
      {error && <p className="mt-1 text-xs text-soft">{error}</p>}
    </div>
  );
}

function CopyMessageButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="label-caps mt-4 w-full bg-primary py-3 text-[11px] text-on-primary transition hover:bg-primary-deep"
    >
      {copied ? "Copied ✓" : "🗨 Copy message"}
    </button>
  );
}
