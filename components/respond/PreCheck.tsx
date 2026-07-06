"use client";

import { useState } from "react";
import { useRecorder } from "@/lib/recorder/useRecorder";

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * Device pre-check: permissions, live preview, 5-second test clip with
 * audio playback so he knows the mic works before the real thing.
 */
export function PreCheck({
  onPass,
  onSkip,
}: {
  onPass: () => void;
  onSkip: () => void;
}) {
  const rec = useRecorder(5);
  const [testDone, setTestDone] = useState(false);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-8">
      <h1 className="text-xl font-extrabold tracking-tight">
        Quick camera check
      </h1>
      <p className="mt-1 text-sm text-soft">
        30 seconds now saves a &quot;wait, was my mic off?&quot; later.
      </p>

      <div className="relative mt-5 aspect-[3/4] w-full overflow-hidden rounded-3xl bg-black">
        {rec.phase === "reviewing" && rec.playbackUrl ? (
          <video
            src={rec.playbackUrl}
            controls
            autoPlay
            playsInline
            className="h-full w-full object-cover"
            onEnded={() => setTestDone(true)}
            onPlay={() => setTestDone(true)}
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
          <span className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-sm font-bold text-white">
            ● {rec.secondsLeft}s
          </span>
        )}
        {rec.phase === "idle" && !rec.error && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white/70">
            Camera preview appears here
          </div>
        )}
      </div>

      {rec.error && (
        <div className="mt-4 rounded-2xl bg-accent p-4 text-sm">
          <p className="font-bold">{rec.error.message}</p>
          {rec.error.kind === "denied" && (
            <div className="mt-2 space-y-2 text-soft">
              {isIOS() ? (
                <p>
                  <strong>iPhone (Safari):</strong> tap the <strong>ᴀA</strong>{" "}
                  button in the address bar → Website Settings → allow Camera
                  and Microphone. Or Settings app → Safari → Camera &amp;
                  Microphone → Allow. Then reload this page.
                </p>
              ) : (
                <p>
                  <strong>Chrome:</strong> tap the lock/tune icon next to the
                  address → Permissions → allow Camera and Microphone, then
                  reload.
                </p>
              )}
              <button
                onClick={() => window.location.reload()}
                className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-on-primary"
              >
                Reload page
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mt-5 space-y-3">
        {rec.phase === "idle" && (
          <button
            onClick={() => void rec.startCamera()}
            className="w-full rounded-full bg-primary px-6 py-3.5 font-bold text-on-primary"
          >
            Enable camera &amp; mic
          </button>
        )}
        {rec.phase === "starting" && (
          <p className="text-center text-sm text-soft">
            Waiting for permission… (tap Allow)
          </p>
        )}
        {rec.phase === "live" && (
          <button
            onClick={() => rec.beginRecording(5)}
            className="w-full rounded-full bg-primary px-6 py-3.5 font-bold text-on-primary"
          >
            Record a 5-second test
          </button>
        )}
        {rec.phase === "recording" && (
          <p className="text-center text-sm font-semibold">
            Say something! Anything. &quot;Test test, I look great.&quot;
          </p>
        )}
        {rec.phase === "reviewing" && (
          <>
            <p className="text-center text-sm font-semibold">
              Play it back — could you hear yourself clearly?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={rec.discardTake}
                className="rounded-full border border-line bg-surface px-4 py-3 text-sm font-bold"
              >
                Try again
              </button>
              <button
                onClick={() => {
                  rec.stopCamera();
                  onPass();
                }}
                disabled={!testDone}
                className="rounded-full bg-primary px-4 py-3 text-sm font-bold text-on-primary disabled:opacity-50"
              >
                Loud &amp; clear ✓
              </button>
            </div>
          </>
        )}
        <button
          onClick={() => {
            rec.stopCamera();
            onSkip();
          }}
          className="w-full py-2 text-center text-xs font-medium text-soft"
        >
          Skip the check (living dangerously)
        </button>
      </div>
    </div>
  );
}
