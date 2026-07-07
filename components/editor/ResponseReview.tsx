"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { EventRow, QuestionWithResponse } from "@/lib/db/types";
import { StreamPlayer } from "@/components/video/StreamPlayer";

/**
 * Inline response status + review tools for one question row:
 * signed playback, hide-from-party toggle, request-redo.
 */
export function ResponseReview({
  event,
  question,
}: {
  event: EventRow;
  question: QuestionWithResponse;
}) {
  const router = useRouter();
  const response = question.responses[0];
  const [playerSrc, setPlayerSrc] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (event.status === "draft") return null;

  const chip =
    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold";

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/questions/${question.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not save.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function togglePlayer() {
    if (playerSrc) {
      setPlayerSrc(null);
      return;
    }
    if (!response?.stream_video_uid) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/stream/playback-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: response.stream_video_uid }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not load the video.");
        return;
      }
      setPlayerSrc(data.urls.hls);
    } finally {
      setBusy(false);
    }
  }

  function requestRedo() {
    const note = window.prompt(
      `Ask ${event.honoree_name} for a better take — add a note? (optional)`,
      ""
    );
    if (note === null) return;
    void patch({
      needs_redo: true,
      redo_note: note.trim() ? note.trim() : null,
    });
  }

  const isReady = response?.status === "ready";

  return (
    <div className="mt-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {isReady ? (
          <span className={`${chip} bg-primary/15 text-primary`}>
            ✓ Answered
          </span>
        ) : response?.status === "uploading" ? (
          <span className={`${chip} bg-accent`}>Uploading…</span>
        ) : response?.status === "errored" ? (
          <span className={`${chip} bg-accent`}>Upload failed</span>
        ) : (
          <span className={`${chip} bg-raised text-soft`}>
            Waiting for {event.honoree_name}
          </span>
        )}
        {question.needs_redo && (
          <span className={`${chip} bg-accent`}>Redo requested</span>
        )}
        {question.is_hidden && (
          <span className={`${chip} bg-raised text-soft`}>
            Hidden from party
          </span>
        )}

        {isReady && response?.stream_video_uid && (
          <>
            <button
              onClick={togglePlayer}
              disabled={busy}
              className="text-[11px] font-bold text-primary hover:text-primary-deep"
            >
              {playerSrc ? "Close ▴" : "▶ Watch"}
            </button>
            {!question.needs_redo && (
              <button
                onClick={requestRedo}
                disabled={busy}
                className="text-[11px] font-semibold text-soft hover:text-ink"
              >
                Request redo
              </button>
            )}
          </>
        )}
        <button
          onClick={() => void patch({ is_hidden: !question.is_hidden })}
          disabled={busy}
          className="text-[11px] font-semibold text-soft hover:text-ink"
        >
          {question.is_hidden ? "Unhide" : "Hide from party"}
        </button>
        {question.needs_redo && (
          <button
            onClick={() =>
              void patch({ needs_redo: false, redo_note: null })
            }
            disabled={busy}
            className="text-[11px] font-semibold text-soft hover:text-ink"
          >
            Cancel redo
          </button>
        )}
      </div>
      {question.redo_note && question.needs_redo && (
        <p className="mt-1 text-[11px] italic text-soft">
          Note to {event.honoree_name}: “{question.redo_note}”
        </p>
      )}
      {error && <p className="mt-1 text-[11px] font-medium">{error}</p>}
      {playerSrc && (
        <StreamPlayer
          src={playerSrc}
          className="mt-2 aspect-video w-full max-w-md rounded-xl bg-black"
        />
      )}
    </div>
  );
}
