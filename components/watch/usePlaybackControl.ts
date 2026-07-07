"use client";

import { useEffect, useState } from "react";
import type { LivePlaybackState } from "@/components/watch/useLivePlayback";

/**
 * Game-master controls on top of the live playback state. Applies an
 * optimistic overlay so taps feel instant, then yields back to the server
 * state as soon as Realtime (or the poll) echoes an update.
 */
export function usePlaybackControl(
  playbackToken: string,
  questionCount: number,
  state: LivePlaybackState
) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimistic, setOptimistic] = useState<LivePlaybackState | null>(null);
  const view = optimistic ?? state;

  // Any fresh server state (our echo or another remote) wins over the overlay.
  useEffect(() => {
    setOptimistic(null);
  }, [state]);

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
    const clamped = Math.max(0, Math.min(questionCount + 1, index));
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

  return { view, busy, error, goto, tally };
}
