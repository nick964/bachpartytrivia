"use client";

import { useState } from "react";
import type { QuestionWithResponse } from "@/lib/db/types";
import { useRecorder } from "@/lib/recorder/useRecorder";
import { uploadToStream } from "@/lib/recorder/upload";

type SaveState =
  | { kind: "idle" }
  | { kind: "uploading"; progress: number }
  | { kind: "error"; message: string };

/** Record → review → save loop for a single question. */
export function QuestionRecorder({
  question,
  respondToken,
  locked,
  onSaved,
}: {
  question: QuestionWithResponse;
  respondToken: string;
  locked: boolean;
  onSaved: (questionId: string, uid: string, duration: number) => void;
}) {
  const rec = useRecorder(60);
  const [save, setSave] = useState<SaveState>({ kind: "idle" });
  const [rerecording, setRerecording] = useState(false);

  const answered = question.responses.some((r) => r.status === "ready");
  const showRecorder = !answered || rerecording;

  async function saveAnswer() {
    if (!rec.blob) return;
    setSave({ kind: "uploading", progress: 0 });
    try {
      const urlRes = await fetch("/api/stream/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          respond_token: respondToken,
          question_id: question.id,
        }),
      });
      const urlData = await urlRes.json().catch(() => ({}));
      if (!urlRes.ok) {
        throw new Error(urlData.error ?? "Couldn't start the upload.");
      }
      const { uploadURL, uid } = urlData as { uploadURL: string; uid: string };

      try {
        await uploadToStream(uploadURL, rec.blob, (f) =>
          setSave({ kind: "uploading", progress: f })
        );
      } catch (uploadErr) {
        // Mark the row errored so the host sees the hiccup, then rethrow.
        void fetch("/api/respond/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            respond_token: respondToken,
            question_id: question.id,
            uid,
            failed: true,
          }),
        });
        throw uploadErr;
      }

      const doneRes = await fetch("/api/respond/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          respond_token: respondToken,
          question_id: question.id,
          uid,
          duration_seconds: rec.durationSeconds,
        }),
      });
      if (!doneRes.ok) {
        const d = await doneRes.json().catch(() => ({}));
        throw new Error(d.error ?? "Couldn't confirm the upload.");
      }

      rec.stopCamera();
      setSave({ kind: "idle" });
      setRerecording(false);
      onSaved(question.id, uid, rec.durationSeconds);
    } catch (e) {
      setSave({ kind: "error", message: (e as Error).message });
    }
  }

  if (locked) {
    return (
      <div className="rounded-3xl border border-line bg-surface p-6 text-center">
        <p className="text-3xl">🔒</p>
        <p className="mt-2 text-sm font-semibold">
          This one&apos;s locked in.
        </p>
        <p className="mt-1 text-xs text-soft">
          You already submitted it — only redo requests can be re-recorded.
        </p>
      </div>
    );
  }

  if (!showRecorder) {
    return (
      <div className="rounded-3xl border border-line bg-surface p-6 text-center">
        <p className="text-3xl">✅</p>
        <p className="mt-2 text-sm font-semibold">Answered!</p>
        <p className="mt-1 text-xs text-soft">
          Not happy with it? You can go again — the old take is deleted.
        </p>
        <button
          onClick={() => {
            setRerecording(true);
            void rec.startCamera();
          }}
          className="mt-4 rounded-full border border-line bg-bg px-5 py-2.5 text-sm font-bold"
        >
          Re-record this answer
        </button>
      </div>
    );
  }

  const uploading = save.kind === "uploading";

  return (
    <div>
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl bg-black">
        {rec.phase === "reviewing" && rec.playbackUrl ? (
          <video
            src={rec.playbackUrl}
            controls
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          />
        ) : (
          <video
            ref={rec.attachPreview}
            muted
            playsInline
            autoPlay
            className="h-full w-full scale-x-[-1] object-cover"
          />
        )}

        {rec.phase === "recording" && (
          <span
            className={`absolute left-4 top-4 rounded-full px-3 py-1 text-sm font-bold text-white ${
              rec.secondsLeft <= 10 ? "bg-red-600" : "bg-black/60"
            }`}
          >
            ● 0:{String(rec.secondsLeft).padStart(2, "0")}
          </span>
        )}

        {rec.phase === "idle" && !rec.error && (
          <button
            onClick={() => void rec.startCamera()}
            className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white"
          >
            Tap to turn on the camera
          </button>
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
            <p className="mt-2 text-xs text-white/70">
              Keep this page open a sec
            </p>
          </div>
        )}
      </div>

      {rec.error && (
        <div className="mt-3 rounded-2xl bg-accent p-4 text-sm">
          <p className="font-bold">{rec.error.message}</p>
          {rec.error.kind === "denied" && (
            <p className="mt-1 text-soft">
              Allow camera &amp; mic in your browser settings, then reload.
            </p>
          )}
        </div>
      )}

      {save.kind === "error" && (
        <div className="mt-3 rounded-2xl bg-accent p-4 text-sm">
          <p className="font-bold">{save.message}</p>
          <button
            onClick={() => void saveAnswer()}
            className="mt-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-on-primary"
          >
            Retry upload
          </button>
        </div>
      )}

      <div className="mt-4">
        {rec.phase === "live" && (
          <button
            onClick={() => rec.beginRecording()}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-line bg-surface"
            aria-label="Start recording"
          >
            <span className="h-14 w-14 rounded-full bg-red-600" />
          </button>
        )}
        {rec.phase === "recording" && (
          <button
            onClick={rec.stopRecording}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-red-600 bg-surface"
            aria-label="Stop recording"
          >
            <span className="h-8 w-8 rounded bg-red-600" />
          </button>
        )}
        {rec.phase === "starting" && (
          <p className="text-center text-sm text-soft">Starting camera…</p>
        )}
        {rec.phase === "reviewing" && !uploading && save.kind !== "error" && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={rec.discardTake}
              className="rounded-full border border-line bg-surface px-4 py-3.5 text-sm font-bold"
            >
              Re-record
            </button>
            <button
              onClick={() => void saveAnswer()}
              className="rounded-full bg-primary px-4 py-3.5 text-sm font-bold text-on-primary"
            >
              Save answer ✓
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
