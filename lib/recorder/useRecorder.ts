"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderPhase =
  | "idle" // camera off
  | "starting" // waiting on getUserMedia
  | "live" // camera on, not recording
  | "recording"
  | "reviewing"; // stopped, blob ready

export type RecorderErrorKind = "denied" | "nodevice" | "unsupported" | "other";

export interface RecorderError {
  kind: RecorderErrorKind;
  message: string;
}

/** Prefer H.264/MP4 where supported (iOS Safari); Stream transcodes anything. */
function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "video/mp4;codecs=avc1",
    "video/mp4",
    "video/webm;codecs=h264",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  return candidates.find((c) => MediaRecorder.isTypeSupported(c));
}

export function useRecorder(maxSeconds: number) {
  const [phase, setPhase] = useState<RecorderPhase>("idle");
  const [error, setError] = useState<RecorderError | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(maxSeconds);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const mimeRef = useRef<string | undefined>(undefined);

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const attachPreview = useCallback((el: HTMLVideoElement | null) => {
    previewRef.current = el;
    if (el && streamRef.current) {
      el.srcObject = streamRef.current;
      void el.play().catch(() => {});
    }
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setError({
        kind: "unsupported",
        message: "This browser can't record video.",
      });
      return false;
    }
    if (typeof MediaRecorder === "undefined") {
      setError({
        kind: "unsupported",
        message: "This browser can't record video.",
      });
      return false;
    }
    setPhase("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });
      streamRef.current = stream;
      mimeRef.current = pickMimeType();
      if (previewRef.current) {
        previewRef.current.srcObject = stream;
        void previewRef.current.play().catch(() => {});
      }
      setPhase("live");
      return true;
    } catch (e) {
      const err = e as DOMException;
      if (err.name === "NotAllowedError" || err.name === "SecurityError") {
        setError({
          kind: "denied",
          message: "Camera and microphone access was blocked.",
        });
      } else if (
        err.name === "NotFoundError" ||
        err.name === "OverconstrainedError"
      ) {
        setError({ kind: "nodevice", message: "No camera was found." });
      } else {
        setError({
          kind: "other",
          message: "Couldn't start the camera. Close other camera apps and retry.",
        });
      }
      setPhase("idle");
      return false;
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  }, []);

  const beginRecording = useCallback(
    (limitSeconds?: number) => {
      const stream = streamRef.current;
      if (!stream || phase === "recording") return;
      const limit = limitSeconds ?? maxSeconds;
      setBlob(null);
      if (playbackUrl) URL.revokeObjectURL(playbackUrl);
      setPlaybackUrl(null);
      setSecondsLeft(limit);

      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, {
          mimeType: mimeRef.current,
          videoBitsPerSecond: 2_500_000,
        });
      } catch {
        try {
          recorder = new MediaRecorder(stream);
        } catch {
          setError({
            kind: "unsupported",
            message: "This browser can't record video.",
          });
          return;
        }
      }
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        clearTimer();
        const type = recorder.mimeType || mimeRef.current || "video/webm";
        const out = new Blob(chunks, { type });
        setBlob(out);
        setPlaybackUrl(URL.createObjectURL(out));
        setDurationSeconds(
          Math.min(
            limit,
            Math.round((Date.now() - startedAtRef.current) / 1000)
          )
        );
        setPhase("reviewing");
      };
      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      recorder.start(1000);
      setPhase("recording");
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startedAtRef.current) / 1000;
        const left = Math.max(0, Math.ceil(limit - elapsed));
        setSecondsLeft(left);
        if (left <= 0) stopRecording();
      }, 250);
    },
    [maxSeconds, phase, playbackUrl, stopRecording]
  );

  /** Back to live preview, dropping the last take. */
  const discardTake = useCallback(() => {
    if (playbackUrl) URL.revokeObjectURL(playbackUrl);
    setPlaybackUrl(null);
    setBlob(null);
    setPhase(streamRef.current ? "live" : "idle");
    if (previewRef.current && streamRef.current) {
      previewRef.current.srcObject = streamRef.current;
      void previewRef.current.play().catch(() => {});
    }
  }, [playbackUrl]);

  const stopCamera = useCallback(() => {
    clearTimer();
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setPhase("idle");
  }, []);

  useEffect(() => {
    return () => {
      clearTimer();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (playbackUrl) URL.revokeObjectURL(playbackUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    phase,
    error,
    secondsLeft,
    blob,
    playbackUrl,
    durationSeconds,
    attachPreview,
    startCamera,
    beginRecording,
    stopRecording,
    discardTake,
    stopCamera,
  };
}
