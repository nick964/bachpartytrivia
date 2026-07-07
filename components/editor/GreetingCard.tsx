"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { EventRow } from "@/lib/db/types";
import { responderRoleOf } from "@/lib/theme";
import { useRecorder } from "@/lib/recorder/useRecorder";
import { uploadToStream } from "@/lib/recorder/upload";
import { StreamPlayer } from "@/components/video/StreamPlayer";

const GREETING_MAX_SECONDS = 30;

type SaveState =
  | { kind: "idle" }
  | { kind: "uploading"; progress: number }
  | { kind: "error"; message: string };

/**
 * Optional host hello: a short video the groom/bride sees on the respond
 * page before the questions.
 */
export function GreetingCard({ event }: { event: EventRow }) {
  const router = useRouter();
  const [recording, setRecording] = useState(false);
  const [save, setSave] = useState<SaveState>({ kind: "idle" });
  const [busy, setBusy] = useState(false);
  const [playerSrc, setPlayerSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    phase,
    error: recError,
    secondsLeft,
    blob,
    playbackUrl,
    attachPreview,
    startCamera,
    beginRecording,
    stopRecording,
    discardTake,
    stopCamera,
  } = useRecorder(GREETING_MAX_SECONDS);

  const responder = responderRoleOf(event) === "groom" ? "he" : "she";

  async function saveGreeting() {
    if (!blob) return;
    setSave({ kind: "uploading", progress: 0 });
    try {
      const res = await fetch(`/api/events/${event.id}/greeting`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.uploadURL) {
        setSave({
          kind: "error",
          message: data.error ?? "Couldn't start the upload — try again.",
        });
        return;
      }
      await uploadToStream(data.uploadURL, blob, (fraction) =>
        setSave({ kind: "uploading", progress: fraction })
      );
      stopCamera();
      setRecording(false);
      setSave({ kind: "idle" });
      router.refresh();
    } catch (e) {
      setSave({ kind: "error", message: (e as Error).message });
    }
  }

  async function removeGreeting() {
    if (!window.confirm("Remove your greeting video?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${event.id}/greeting`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not remove the greeting.");
        return;
      }
      setPlayerSrc(null);
      router.refresh();
    } catch {
      setError("Network hiccup — try again.");
    } finally {
      setBusy(false);
    }
  }

  async function togglePlayer() {
    if (playerSrc) {
      setPlayerSrc(null);
      return;
    }
    if (!event.greeting_video_uid) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/stream/playback-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: event.greeting_video_uid }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          data.error ??
            "Could not load the video — it may still be processing."
        );
        return;
      }
      setPlayerSrc(data.urls.hls);
    } finally {
      setBusy(false);
    }
  }

  const uploading = save.kind === "uploading";

  /* ---------- recorder open ---------- */
  if (recording) {
    return (
      <section className="keyline p-6 sm:p-8">
        <h2 className="font-display text-2xl text-primary">
          Record your greeting
        </h2>
        <p className="mt-1 text-sm italic text-soft">
          Up to {GREETING_MAX_SECONDS} seconds — say hi, set the tone, make{" "}
          {event.honoree_name} sweat a little.
        </p>

        <div className="relative mx-auto mt-5 aspect-[3/4] w-full max-w-sm overflow-hidden bg-black">
          {phase === "reviewing" && playbackUrl ? (
            <video
              key="playback"
              src={playbackUrl}
              controls
              autoPlay
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <video
              key="preview"
              ref={attachPreview}
              muted
              playsInline
              autoPlay
              className="h-full w-full scale-x-[-1] object-cover"
            />
          )}
          {phase === "recording" && (
            <span
              className={`absolute left-4 top-4 rounded-full px-3 py-1 text-sm font-bold text-white ${
                secondsLeft <= 5 ? "bg-red-600" : "bg-black/60"
              }`}
            >
              ● 0:{String(secondsLeft).padStart(2, "0")}
            </span>
          )}
          {phase === "starting" && (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-white/70">
              Starting camera…
            </p>
          )}
          {uploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 px-8 text-white">
              <p className="text-sm font-bold">Uploading…</p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white transition-[width]"
                  style={{
                    width: `${Math.round(
                      (save.kind === "uploading" ? save.progress : 0) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {recError && (
          <p className="mx-auto mt-3 max-w-sm border border-line bg-raised px-4 py-2.5 text-sm">
            {recError.message}
          </p>
        )}
        {save.kind === "error" && (
          <div className="mx-auto mt-3 max-w-sm border border-line bg-raised px-4 py-2.5 text-sm">
            <p className="font-semibold">{save.message}</p>
            <button
              onClick={() => void saveGreeting()}
              className="label-caps mt-2 bg-primary px-4 py-2 text-[10px] text-on-primary"
            >
              Retry upload
            </button>
          </div>
        )}

        <div className="mx-auto mt-5 max-w-sm">
          {phase === "live" && (
            <button
              onClick={() => beginRecording()}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 border-line bg-surface"
              aria-label="Start recording"
            >
              <span className="h-11 w-11 rounded-full bg-red-600" />
            </button>
          )}
          {phase === "recording" && (
            <button
              onClick={stopRecording}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 border-red-600 bg-surface"
              aria-label="Stop recording"
            >
              <span className="h-7 w-7 rounded bg-red-600" />
            </button>
          )}
          {phase === "reviewing" && !uploading && save.kind !== "error" && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={discardTake}
                className="label-caps border border-primary px-4 py-3 text-[10px] text-primary"
              >
                Re-record
              </button>
              <button
                onClick={() => void saveGreeting()}
                className="label-caps bg-primary px-4 py-3 text-[10px] text-on-primary"
              >
                Save greeting ✓
              </button>
            </div>
          )}
          <button
            onClick={() => {
              stopCamera();
              setRecording(false);
              setSave({ kind: "idle" });
            }}
            disabled={uploading}
            className="mt-3 w-full py-2 text-center text-sm font-medium text-soft disabled:opacity-40"
          >
            Cancel
          </button>
        </div>
      </section>
    );
  }

  /* ---------- summary ---------- */
  return (
    <section className="keyline p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-display text-2xl text-primary">
            {event.greeting_video_uid
              ? "Your greeting is ready"
              : "Add a personal hello"}
          </h2>
          <p className="mt-1 text-sm italic text-soft">
            {event.greeting_video_uid
              ? `${event.honoree_name} will watch it before ${responder} answers the questions.`
              : `Record a short greeting ${event.honoree_name} watches before ${responder} starts answering. Optional, but a lovely touch.`}
          </p>
        </div>
        {event.greeting_video_uid ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              onClick={() => void togglePlayer()}
              disabled={busy}
              className="label-caps border border-primary px-4 py-2.5 text-[10px] text-primary disabled:opacity-50"
            >
              {playerSrc ? "Close ▴" : "▶ Watch"}
            </button>
            <button
              onClick={() => {
                setPlayerSrc(null);
                setRecording(true);
                void startCamera();
              }}
              disabled={busy}
              className="label-caps border border-line px-4 py-2.5 text-[10px] text-soft disabled:opacity-50"
            >
              Re-record
            </button>
            <button
              onClick={() => void removeGreeting()}
              disabled={busy}
              className="text-xs font-semibold text-soft underline-offset-2 hover:underline disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setRecording(true);
              void startCamera();
            }}
            className="label-caps shrink-0 bg-primary px-6 py-3 text-[10px] text-on-primary transition hover:bg-primary-deep"
          >
            🎥 Record greeting
          </button>
        )}
      </div>
      {error && (
        <p className="mt-4 border border-line bg-raised px-4 py-2.5 text-sm">
          {error}
        </p>
      )}
      {playerSrc && (
        <StreamPlayer
          src={playerSrc}
          className="mt-4 aspect-video w-full max-w-md bg-black"
        />
      )}
    </section>
  );
}
