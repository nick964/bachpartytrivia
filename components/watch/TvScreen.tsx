"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EventRow } from "@/lib/db/types";
import { StreamPlayer } from "@/components/video/StreamPlayer";
import {
  useLivePlayback,
  type LivePlaybackState,
  type WatchQuestion,
} from "@/components/watch/useLivePlayback";

export function TvScreen({
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
  const urlCache = useRef(new Map<string, string>());
  const [, forceRender] = useState(0);

  const fetchUrl = useCallback(
    async (uid: string) => {
      if (urlCache.current.has(uid)) return urlCache.current.get(uid)!;
      const res = await fetch("/api/stream/playback-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, playback_token: playbackToken }),
      });
      if (!res.ok) throw new Error("token");
      const data = await res.json();
      urlCache.current.set(uid, data.urls.hls as string);
      return data.urls.hls as string;
    },
    [playbackToken]
  );

  // Prefetch the current question's video URL during the guessing phase so
  // the reveal is instant.
  const q =
    state.index >= 1 && state.index <= questions.length
      ? questions[state.index - 1]
      : null;
  useEffect(() => {
    if (q?.uid) {
      void fetchUrl(q.uid)
        .then(() => forceRender((n) => n + 1))
        .catch(() => {});
    }
  }, [q?.uid, fetchUrl]);

  const rightCount = Object.values(state.tally).filter(
    (v) => v === "right"
  ).length;
  const wrongCount = Object.values(state.tally).filter(
    (v) => v === "wrong"
  ).length;

  /* title slide */
  if (state.index <= 0 || questions.length === 0) {
    return (
      <Shell>
        <p className="font-script text-[clamp(3rem,10vw,9rem)] leading-tight text-primary animate-rise">
          {event.title}
        </p>
        <p className="mt-6 text-[clamp(1.1rem,2.5vw,2rem)] font-semibold text-soft">
          {questions.length} questions. One{" "}
          {event.honoree_role === "bride" ? "bride" : "groom"}. Wrong guess =
          drink. 🥂
        </p>
        <p className="mt-12 text-[clamp(0.8rem,1.5vw,1.1rem)] uppercase tracking-[0.3em] text-soft/70 animate-pulse">
          Waiting for the remote…
        </p>
      </Shell>
    );
  }

  /* end slide */
  if (state.index > questions.length) {
    return (
      <Shell>
        <p className="font-script text-[clamp(3rem,9vw,8rem)] text-primary animate-pop">
          That&apos;s the game!
        </p>
        <div className="mt-10 flex items-center justify-center gap-14 text-center">
          <div>
            <p className="text-[clamp(3rem,8vw,7rem)] font-extrabold">
              {rightCount}
            </p>
            <p className="text-[clamp(1rem,2vw,1.5rem)] font-bold uppercase tracking-widest text-soft">
              Nailed it
            </p>
          </div>
          <div>
            <p className="text-[clamp(3rem,8vw,7rem)] font-extrabold text-primary">
              {wrongCount}
            </p>
            <p className="text-[clamp(1rem,2vw,1.5rem)] font-bold uppercase tracking-widest text-soft">
              Drinks owed
            </p>
          </div>
        </div>
        <p className="mt-12 text-[clamp(1.2rem,3vw,2.2rem)] font-semibold">
          {wrongCount > 0
            ? `${wrongCount} wrong guess${wrongCount === 1 ? "" : "es"} — bottoms up! 🍾`
            : "A perfect score?! Someone knows their person. 💍"}
        </p>
      </Shell>
    );
  }

  /* question / reveal slides */
  const question = questions[state.index - 1];
  const verdict = state.tally[question.id];

  if (state.phase === "reveal" && question.uid) {
    return (
      <div className="fixed inset-0 bg-black">
        <RevealVideo
          key={question.uid}
          uid={question.uid}
          getUrl={fetchUrl}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-6">
          <p className="max-w-[70%] rounded-2xl bg-black/50 px-5 py-3 text-[clamp(1rem,2vw,1.6rem)] font-bold text-white backdrop-blur">
            {question.text}
          </p>
          {verdict && (
            <p className="animate-pop rounded-2xl bg-black/50 px-5 py-3 text-[clamp(1.4rem,3vw,2.4rem)] backdrop-blur">
              {verdict === "right" ? "✅" : "🍹"}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <Shell>
      <p className="text-[clamp(1rem,2vw,1.6rem)] font-bold uppercase tracking-[0.3em] text-soft">
        Question {state.index} of {questions.length}
      </p>
      <p
        key={question.id}
        className="mt-8 max-w-[16ch] text-balance text-[clamp(2.2rem,6vw,5.5rem)] font-extrabold leading-tight tracking-tight animate-rise"
      >
        {question.text}
      </p>
      <p className="mt-12 font-script text-[clamp(1.8rem,4vw,3.5rem)] text-primary animate-pulse">
        Lock in your guess!
      </p>
      {!question.uid && (
        <p className="mt-6 rounded-full bg-raised px-5 py-2 text-sm text-soft">
          (No video for this one — honor system!)
        </p>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-bg px-[6vw] text-center text-ink">
      {children}
    </div>
  );
}

/** Full-bleed reveal player; falls back to tap-to-play if autoplay is blocked. */
function RevealVideo({
  uid,
  getUrl,
}: {
  uid: string;
  getUrl: (uid: string) => Promise<string>;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    getUrl(uid)
      .then((u) => {
        if (!cancelled) setSrc(u);
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [uid, getUrl]);

  // Detect blocked autoplay shortly after mount.
  useEffect(() => {
    if (!src) return;
    const t = setTimeout(() => {
      const video = wrapRef.current?.querySelector("video");
      if (video && video.paused) setNeedsTap(true);
    }, 1200);
    return () => clearTimeout(t);
  }, [src]);

  if (failed) {
    return (
      <div className="flex h-full items-center justify-center text-white/80">
        Couldn&apos;t load the video — check the wifi and hit reveal again.
      </div>
    );
  }
  if (!src) {
    return (
      <div className="flex h-full items-center justify-center text-white/60 animate-pulse">
        Rolling the tape…
      </div>
    );
  }
  return (
    <div ref={wrapRef} className="h-full w-full">
      <StreamPlayer
        src={src}
        autoPlay
        className="h-full w-full object-contain"
      />
      {needsTap && (
        <button
          onClick={() => {
            const video = wrapRef.current?.querySelector("video");
            void video?.play().then(() => setNeedsTap(false));
          }}
          className="absolute inset-0 flex items-center justify-center bg-black/60 text-white"
        >
          <span className="animate-pop rounded-full bg-white/15 px-10 py-6 text-3xl font-bold backdrop-blur">
            ▶ Tap to play
          </span>
        </button>
      )}
    </div>
  );
}
