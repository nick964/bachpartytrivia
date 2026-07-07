"use client";

import { useState } from "react";
import type { EventRow } from "@/lib/db/types";
import {
  useLivePlayback,
  type LivePlaybackState,
  type WatchQuestion,
} from "@/components/watch/useLivePlayback";

export function Remote({
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Optimistic overlay so taps feel instant even before Realtime echoes.
  const [optimistic, setOptimistic] = useState<LivePlaybackState | null>(null);
  const view = optimistic ?? state;

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/watch/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playback_token: playbackToken, ...body }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "That didn't stick — try again.");
        setOptimistic(null);
      }
    } catch {
      setError("Network hiccup — try again.");
      setOptimistic(null);
    } finally {
      setBusy(false);
    }
  }

  function goto(index: number, phase: "question" | "reveal" = "question") {
    const clamped = Math.max(0, Math.min(questions.length + 1, index));
    setOptimistic({ ...view, index: clamped, phase });
    void post({ op: "goto", index: clamped, phase });
  }

  function tally(questionId: string, result: "right" | "wrong") {
    setOptimistic({
      ...view,
      tally: { ...view.tally, [questionId]: result },
    });
    void post({ op: "tally", question_id: questionId, result });
  }

  const onTitle = view.index <= 0;
  const onEnd = view.index > questions.length;
  const question =
    !onTitle && !onEnd ? questions[view.index - 1] : null;
  const verdict = question ? view.tally[question.id] : undefined;
  const rightCount = Object.values(view.tally).filter((v) => v === "right").length;
  const wrongCount = Object.values(view.tally).filter((v) => v === "wrong").length;

  return (
    <div className="bg-ticking mx-auto flex min-h-screen max-w-md flex-col px-5 py-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="font-display text-2xl leading-none text-primary">
            Game Master
          </p>
          <p className="label-caps mt-1.5 text-[9px] text-soft">
            Remote control active · {event.title}
          </p>
        </div>
        <span className="label-caps shrink-0 border border-line bg-surface px-2.5 py-1.5 text-[9px] text-primary">
          ✅ {rightCount} · ❌ {wrongCount}
        </span>
      </div>

      {/* status card */}
      <div className="double-keyline mt-5 flex-1 p-6">
        {onTitle && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="font-display text-4xl italic text-primary">Ready?</p>
            <p className="mt-2 text-sm text-soft">
              The TV is on the title slide. Get everyone gathered round, then —
            </p>
            <p className="mt-3 font-display text-lg italic text-primary-deep">
              you may now quiz the {event.honoree_role} 💍
            </p>
          </div>
        )}
        {onEnd && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="font-display text-4xl italic text-primary">
              That&apos;s a wrap
            </p>
            <p className="mt-2 text-sm text-soft">
              Final score on the TV: {rightCount} right, {wrongCount} missed.
            </p>
          </div>
        )}
        {question && (
          <div>
            <p className="label-caps text-[10px] text-primary">
              Question {view.index} of {questions.length}
              {view.phase === "reveal" && " · video playing"}
            </p>
            <p className="mt-3 font-display text-xl italic leading-snug">
              {question.text}
            </p>
            {!question.uid && (
              <p className="mt-3 border border-line bg-raised px-3 py-2 text-xs font-semibold">
                No video for this one — skip it or run it on the honor
                system.
              </p>
            )}
            {view.phase === "question" ? (
              <p className="mt-3 text-sm italic text-soft">
                Let {event.honoree_role === "bride" ? "her" : "him"} guess out
                loud… then hit reveal.
              </p>
            ) : (
              <div className="mt-4">
                <p className="text-sm font-semibold">Did they get it right?</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => tally(question.id, "right")}
                    className={`border-2 px-4 py-4 text-sm font-bold transition ${
                      verdict === "right"
                        ? "border-primary bg-accent"
                        : "border-line bg-surface"
                    }`}
                  >
                    ✅ Got it right
                  </button>
                  <button
                    onClick={() => tally(question.id, "wrong")}
                    className={`border-2 px-4 py-4 text-sm font-bold transition ${
                      verdict === "wrong"
                        ? "border-primary bg-accent"
                        : "border-line bg-surface"
                    }`}
                  >
                    ❌ Missed it
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 border border-line bg-raised px-4 py-2.5 text-sm font-medium">
          {error}
        </p>
      )}

      {/* controls */}
      <div className="mt-4 space-y-3 pb-4">
        {onTitle ? (
          <button
            onClick={() => goto(1)}
            disabled={busy || questions.length === 0}
            className="label-caps w-full bg-primary px-6 py-4 text-xs text-on-primary animate-pop disabled:opacity-50"
          >
            Start the show 🎬
          </button>
        ) : (
          <>
            {question && view.phase === "question" && (
              <button
                onClick={() => goto(view.index, "reveal")}
                disabled={busy || !question.uid}
                className="label-caps w-full bg-primary px-6 py-4 text-xs text-on-primary disabled:opacity-50"
              >
                🎬 Reveal the video
              </button>
            )}
            {question && view.phase === "reveal" && (
              <button
                onClick={() => goto(view.index + 1)}
                disabled={busy}
                className="label-caps w-full bg-primary px-6 py-4 text-xs text-on-primary"
              >
                {view.index === questions.length
                  ? "Finish → final score 🏁"
                  : "Next question →"}
              </button>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() =>
                  view.phase === "reveal"
                    ? goto(view.index)
                    : goto(view.index - 1)
                }
                disabled={busy || (onTitle && view.phase === "question")}
                className="label-caps border border-primary bg-surface px-4 py-3 text-[10px] text-primary disabled:opacity-40"
              >
                ← Back
              </button>
              {onEnd ? (
                <button
                  onClick={() => goto(0)}
                  disabled={busy}
                  className="label-caps border border-primary bg-surface px-4 py-3 text-[10px] text-primary"
                >
                  ⟲ Restart show
                </button>
              ) : (
                <button
                  onClick={() => goto(view.index + 1)}
                  disabled={busy}
                  className="label-caps border border-primary bg-surface px-4 py-3 text-[10px] text-primary"
                >
                  Skip →
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
