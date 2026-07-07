"use client";

import { useState } from "react";
import type { EventRow } from "@/lib/db/types";
import { partyNoun } from "@/lib/theme";

/**
 * Big "it's showtime" hero shown at the top of the event page once every
 * answer is recorded (status ready/completed) — the loudest thing on the
 * page, so hosts can't miss how to actually play the game.
 */
export function PlayBanner({ event }: { event: EventRow }) {
  const [copied, setCopied] = useState(false);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const watchUrl = `${appUrl}/watch/${event.playback_token}`;
  const played = event.status === "completed";

  return (
    <section className="double-keyline relative overflow-hidden p-6 text-center sm:p-10">
      <p className="text-4xl" aria-hidden>
        🎬
      </p>
      <h2 className="mt-3 font-display text-3xl italic text-primary sm:text-4xl">
        {played
          ? "Encore? Play it again"
          : `${event.honoree_name}'s answers are in — it's showtime`}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-soft">
        {played
          ? "The show is still here — replay it any time before the videos retire."
          : `Every question has a recording. Open party mode at the ${partyNoun(
              event.honoree_role
            )}, put it on the TV, and let the guessing begin.`}
      </p>

      <div className="mt-7">
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener"
          className="label-caps inline-block bg-primary px-10 py-4 text-xs text-on-primary shadow-lg transition hover:bg-primary-deep"
        >
          ▶ Play the game
        </a>
      </div>

      <div className="mx-auto mt-6 flex max-w-md items-center gap-2 border-b border-line pb-2 text-left">
        <span className="min-w-0 flex-1 truncate font-display text-sm text-primary">
          {watchUrl}
        </span>
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(watchUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="label-caps shrink-0 px-3 py-2 text-[10px] text-primary transition hover:text-primary-deep"
        >
          {copied ? "Copied ✓" : "⧉ Copy link"}
        </button>
      </div>
      <p className="mt-2 text-xs italic text-soft">
        Send it ahead to whoever&apos;s running the TV — no sign-in needed.
      </p>
    </section>
  );
}
