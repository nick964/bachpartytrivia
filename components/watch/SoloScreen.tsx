"use client";

import { useEffect } from "react";
import type { EventRow } from "@/lib/db/types";
import { TvSlides } from "@/components/watch/TvScreen";
import {
  useLivePlayback,
  type LivePlaybackState,
  type WatchQuestion,
} from "@/components/watch/useLivePlayback";
import { usePlaybackControl } from "@/components/watch/usePlaybackControl";

/**
 * Solo / cast mode: one phone mirrored to the TV runs the whole show.
 * Renders the full TV presentation with a game-master control bar overlaid;
 * the controls stay pinned so right/wrong/skip are reachable at any moment
 * of the video.
 */
export function SoloScreen({
  event,
  questions,
  initial,
  playbackToken,
}: {
  event: EventRow;
  questions: WatchQuestion[];
  initial: LivePlaybackState;
  playbackToken: string;
}) {
  const state = useLivePlayback(event.id, playbackToken, initial);
  const { view, busy, error, goto, tally } = usePlaybackControl(
    playbackToken,
    questions.length,
    state
  );

  const onTitle = view.index <= 0 || questions.length === 0;
  const onEnd = !onTitle && view.index > questions.length;
  const question = !onTitle && !onEnd ? questions[view.index - 1] : null;
  const verdict = question ? view.tally[question.id] : undefined;

  // Keep the phone awake while it's driving the TV.
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    async function acquire() {
      try {
        lock = await navigator.wakeLock?.request("screen");
      } catch {
        // unsupported or low battery — casting still works, screen may sleep
      }
    }
    void acquire();
    const onVisibility = () => {
      if (document.visibilityState === "visible") void acquire();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      void lock?.release().catch(() => {});
    };
  }, []);

  return (
    <div className="fixed inset-0">
      <TvSlides
        event={event}
        questions={questions}
        state={view}
        playbackToken={playbackToken}
      />

      {/* control bar — always in view so the host can tally or skip mid-video */}
      <div
        className="fixed inset-x-0 bottom-0 z-10 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-10"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0))",
        }}
      >
        {error && (
          <p className="mx-auto mb-2 w-fit rounded-full bg-black/60 px-4 py-1.5 text-xs font-medium text-white backdrop-blur">
            {error}
          </p>
        )}

        <div className="mx-auto flex w-fit max-w-[94vw] items-center gap-2">
          {onTitle && (
            <Btn
              primary
              onClick={() => goto(1)}
              disabled={busy || questions.length === 0}
            >
              Start the show 🎬
            </Btn>
          )}

          {question && (
            <>
              <Btn
                onClick={() =>
                  view.phase === "reveal"
                    ? goto(view.index)
                    : goto(view.index - 1)
                }
                disabled={busy}
              >
                ← Back
              </Btn>

              {view.phase === "question" ? (
                <>
                  <Btn
                    primary
                    onClick={() => goto(view.index, "reveal")}
                    disabled={busy || !question.uid}
                  >
                    🎬 Reveal
                  </Btn>
                  <Btn onClick={() => goto(view.index + 1)} disabled={busy}>
                    Skip →
                  </Btn>
                </>
              ) : (
                <>
                  <Btn
                    onClick={() => tally(question.id, "right")}
                    disabled={busy}
                    active={verdict === "right"}
                  >
                    ✅
                  </Btn>
                  <Btn
                    onClick={() => tally(question.id, "wrong")}
                    disabled={busy}
                    active={verdict === "wrong"}
                  >
                    ❌
                  </Btn>
                  <Btn
                    primary
                    onClick={() => goto(view.index + 1)}
                    disabled={busy}
                  >
                    {view.index === questions.length ? "Finish 🏁" : "Next →"}
                  </Btn>
                </>
              )}
            </>
          )}

          {onEnd && (
            <>
              <Btn onClick={() => goto(questions.length, "reveal")} disabled={busy}>
                ← Back
              </Btn>
              <Btn primary onClick={() => goto(0)} disabled={busy}>
                ⟲ Restart show
              </Btn>
            </>
          )}
        </div>

        {onTitle && (
          <p className="mt-2 text-center text-[11px] italic text-white/85">
            Mirror this phone to the TV (AirPlay / Cast), rotate to landscape,
            then hit start.
          </p>
        )}
      </div>
    </div>
  );
}

function Btn({
  children,
  onClick,
  disabled,
  primary,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`label-caps whitespace-nowrap rounded-full px-4 py-3 text-[11px] backdrop-blur transition disabled:opacity-40 ${
        primary
          ? "bg-primary text-on-primary"
          : active
            ? "bg-white text-black"
            : "bg-black/50 text-white"
      }`}
    >
      {children}
    </button>
  );
}
