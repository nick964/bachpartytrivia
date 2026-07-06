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
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-bg px-5 py-6">
      <div className="flex items-center justify-between text-xs font-semibold text-soft">
        <span>🎛️ Remote · {event.title}</span>
        <span>
          ✅ {rightCount} · 🍹 {wrongCount}
        </span>
      </div>

      {/* status card */}
      <div className="mt-4 flex-1 rounded-3xl border border-line bg-surface p-6">
        {onTitle && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="font-script text-4xl text-primary">Ready?</p>
            <p className="mt-2 text-sm text-soft">
              The TV is on the title slide. Get everyone a drink first.
            </p>
          </div>
        )}
        {onEnd && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="font-script text-4xl text-primary">That's a wrap</p>
            <p className="mt-2 text-sm text-soft">
              Final score on the TV: {rightCount} right, {wrongCount} drinks
              owed.
            </p>
          </div>
        )}
        {question && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-soft">
              Question {view.index} of {questions.length}
              {view.phase === "reveal" && " · video playing"}
            </p>
            <p className="mt-3 text-xl font-extrabold leading-snug">
              {question.text}
            </p>
            {!question.uid && (
              <p className="mt-3 rounded-xl bg-accent px-3 py-2 text-xs font-semibold">
                No video for this one — skip it or run it on the honor
                system.
              </p>
            )}
            {view.phase === "question" ? (
              <p className="mt-3 text-sm text-soft">
                Let {event.honoree_role === "bride" ? "her" : "him"} guess out
                loud… then hit reveal.
              </p>
            ) : (
              <div className="mt-4">
                <p className="text-sm font-semibold">Did they get it right?</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => tally(question.id, "right")}
                    className={`rounded-2xl border-2 px-4 py-4 text-sm font-bold transition ${
                      verdict === "right"
                        ? "border-primary bg-accent"
                        : "border-line bg-bg"
                    }`}
                  >
                    ✅ Got it right
                  </button>
                  <button
                    onClick={() => tally(question.id, "wrong")}
                    className={`rounded-2xl border-2 px-4 py-4 text-sm font-bold transition ${
                      verdict === "wrong"
                        ? "border-primary bg-accent"
                        : "border-line bg-bg"
                    }`}
                  >
                    🍹 Wrong — drink!
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium">
          {error}
        </p>
      )}

      {/* controls */}
      <div className="mt-4 space-y-3 pb-4">
        {onTitle ? (
          <button
            onClick={() => goto(1)}
            disabled={busy || questions.length === 0}
            className="w-full rounded-full bg-primary px-6 py-4 text-base font-bold text-on-primary animate-pop disabled:opacity-50"
          >
            Start the show 🎬
          </button>
        ) : (
          <>
            {question && view.phase === "question" && (
              <button
                onClick={() => goto(view.index, "reveal")}
                disabled={busy || !question.uid}
                className="w-full rounded-full bg-primary px-6 py-4 text-base font-bold text-on-primary disabled:opacity-50"
              >
                🎬 Reveal the video
              </button>
            )}
            {question && view.phase === "reveal" && (
              <button
                onClick={() => goto(view.index + 1)}
                disabled={busy}
                className="w-full rounded-full bg-primary px-6 py-4 text-base font-bold text-on-primary"
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
                className="rounded-full border border-line bg-surface px-4 py-3 text-sm font-bold disabled:opacity-40"
              >
                ← Back
              </button>
              {onEnd ? (
                <button
                  onClick={() => goto(0)}
                  disabled={busy}
                  className="rounded-full border border-line bg-surface px-4 py-3 text-sm font-bold"
                >
                  ⟲ Restart show
                </button>
              ) : (
                <button
                  onClick={() => goto(view.index + 1)}
                  disabled={busy}
                  className="rounded-full border border-line bg-surface px-4 py-3 text-sm font-bold"
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
