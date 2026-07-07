"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EventRow } from "@/lib/db/types";
import { StreamPlayer } from "@/components/video/StreamPlayer";
import {
  useLivePlayback,
  type LivePlaybackState,
  type WatchQuestion,
} from "@/components/watch/useLivePlayback";

function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2c.6 4.8 2.4 7.4 8 8-5.6.6-7.4 3.2-8 8-.6-4.8-2.4-7.4-8-8 5.6-.6 7.4-3.2 8-8Z" />
    </svg>
  );
}

function DiamondDivider({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className ?? ""}`}>
      <span className="h-px w-16 bg-primary/40" />
      <span className="text-[10px] text-primary">⬥</span>
      <span className="h-px w-16 bg-primary/40" />
    </div>
  );
}

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

  const responder = event.honoree_role === "bride" ? "groom" : "bride";

  /* title slide */
  if (state.index <= 0 || questions.length === 0) {
    return (
      <Shell>
        <Sparkle className="absolute left-[8vw] top-[14vh] h-[3vw] w-[3vw] text-primary/25 animate-float" />
        <Sparkle className="absolute right-[10vw] bottom-[16vh] h-[2vw] w-[2vw] text-gold/40 animate-float" />
        <div className="double-keyline animate-rise relative w-[min(78vw,68rem)] px-[6vw] py-[9vh] text-center">
          <div className="wax-seal absolute -right-8 -top-8 flex h-[7vw] max-h-28 min-h-16 w-[7vw] max-w-28 min-w-16 rotate-12 flex-col items-center justify-center rounded-2xl text-white animate-float">
            <span className="font-display text-[2.2vw]">B</span>
            <span className="label-caps text-[0.6vw]">Official</span>
          </div>
          <p className="label-caps text-[clamp(0.8rem,1.4vw,1.4rem)] text-primary">
            {event.title}
          </p>
          <DiamondDivider className="mt-[2vh]" />
          <p className="mt-[4vh] font-display text-[clamp(2.6rem,7.5vw,7.5rem)] italic leading-[1.1] text-primary text-balance">
            What did the {responder} say?
          </p>
          <p className="mt-[4vh] font-display text-[clamp(1.1rem,2vw,2rem)] italic text-primary-deep">
            You may now quiz the {event.honoree_role} 💍
          </p>
          <p className="mt-[1.5vh] text-[clamp(0.9rem,1.5vw,1.5rem)] italic text-soft">
            {questions.length} questions · how well do they really know each
            other?
          </p>
          <p className="label-caps mt-[6vh] text-[clamp(0.7rem,1.2vw,1.2rem)] text-soft/80 animate-pulse">
            Waiting for the remote…
          </p>
        </div>
      </Shell>
    );
  }

  /* end slide */
  if (state.index > questions.length) {
    return (
      <Shell>
        <BuntingWide className="absolute inset-x-0 top-0 h-[6vh] w-full text-primary/70" />
        <p className="font-serif text-[clamp(1rem,1.6vw,1.6rem)] text-ink">
          That&apos;s a wrap
        </p>
        <DiamondDivider className="mt-[1.5vh]" />
        <div className="double-keyline animate-pop mt-[6vh] px-[7vw] py-[6vh] text-center">
          <p className="label-caps text-[clamp(0.8rem,1.4vw,1.4rem)] text-soft">
            Final tally
          </p>
          <p className="mt-[3vh] font-display text-[clamp(1.6rem,3.2vw,3.4rem)] text-ink">
            {rightCount} <em className="text-primary">right</em>
            <span className="mx-[1.5vw] text-soft">·</span>
            {wrongCount} <em className="text-primary">missed</em>
          </p>
        </div>
        <p className="mt-[6vh] max-w-[80vw] font-display text-[clamp(1.8rem,4.5vw,4.6rem)] italic text-primary text-balance">
          {wrongCount > 0
            ? `${rightCount} out of ${rightCount + wrongCount} — not bad at all! 🎉`
            : "A perfect score?! Someone knows their person. 💍"}
        </p>
        <div className="mt-[7vh] flex items-center gap-4">
          <span className="wax-seal flex h-12 w-12 items-center justify-center rounded-xl font-display text-lg text-white">
            B
          </span>
          <span className="text-left">
            <span className="block font-display text-xl text-primary">
              Bach Party Trivia
            </span>
            <span className="label-caps block text-[10px] text-soft">
              A modern heirloom experience
            </span>
          </span>
        </div>
      </Shell>
    );
  }

  /* question / reveal slides */
  const question = questions[state.index - 1];
  const verdict = state.tally[question.id];

  if (state.phase === "reveal" && question.uid) {
    return (
      <div className="bg-ticking fixed inset-0 flex flex-col px-[4vw] py-[4vh]">
        <div className="flex items-center justify-between pb-[2.5vh]">
          <span className="font-display text-[clamp(1.1rem,1.8vw,1.8rem)] text-primary">
            Bach Party Trivia
          </span>
          <span className="label-caps text-[clamp(0.7rem,1.1vw,1.1rem)] text-soft">
            Round {state.index} of {questions.length}
          </span>
        </div>
        <p className="text-center font-display text-[clamp(1.2rem,2.4vw,2.4rem)] italic text-primary">
          &ldquo;{question.text}&rdquo;
        </p>
        <div className="double-keyline relative mt-[2.5vh] min-h-0 flex-1">
          <div className="relative h-full w-full bg-black">
            <RevealVideo
              key={question.uid}
              uid={question.uid}
              getUrl={fetchUrl}
            />
            {verdict && (
              <p className="animate-pop absolute right-4 top-4 rounded-full bg-black/50 px-5 py-3 text-[clamp(1.4rem,3vw,2.4rem)] backdrop-blur">
                {verdict === "right" ? "✅" : "❌"}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-ticking fixed inset-0 flex flex-col px-[4vw] py-[4vh]">
      <div className="flex items-center justify-between">
        <span className="font-display text-[clamp(1.1rem,1.8vw,1.8rem)] text-primary">
          {event.title}
        </span>
        <span className="double-keyline label-caps px-[1.5vw] py-[1vh] text-[clamp(0.7rem,1.1vw,1.1rem)] text-primary">
          Right {rightCount} <span className="mx-1 text-soft">•</span> Missed{" "}
          {wrongCount}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center">
        <p className="font-display text-[clamp(1.3rem,2.6vw,2.6rem)] italic text-primary">
          Question {state.index}
        </p>
        <span className="mt-[1vh] h-px w-[8vw] bg-primary/50" />
        <div
          key={question.id}
          className="double-keyline animate-rise mt-[4vh] w-[min(86vw,80rem)] px-[5vw] py-[6vh]"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="mx-auto h-[3vw] min-h-8 w-[3vw] min-w-8 text-primary"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 20s-7-4.3-9-8.5C1.5 8 3.5 5 6.5 5c2 0 3.5 1 4.5 2.5H12C13 6 14.5 5 16.5 5c3 0 5 3 3.5 6.5-2 4.2-9 8.5-9 8.5Z"
            />
          </svg>
          <p className="mx-auto mt-[3vh] max-w-[22ch] font-display text-[clamp(1.8rem,4.8vw,5rem)] leading-tight text-ink text-balance">
            &ldquo;{question.text}&rdquo;
          </p>
          <DiamondDivider className="mt-[4vh]" />
          <p className="mt-[3vh] font-display text-[clamp(1.1rem,2.2vw,2.2rem)] italic text-soft animate-pulse">
            Lock in your guess!
          </p>
          {!question.uid && (
            <p className="label-caps mt-[3vh] inline-block rounded-full bg-raised px-5 py-2 text-[clamp(0.6rem,1vw,1rem)] text-soft">
              No video for this one — honor system!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-ticking fixed inset-0 flex flex-col items-center justify-center px-[6vw] text-center text-ink">
      {children}
    </div>
  );
}

/** Scalloped bunting garland across the top of the end slide. */
function BuntingWide({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 60"
      preserveAspectRatio="none"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden
    >
      <path d="M0 8 Q 75 40 150 12 T 300 12 T 450 12 T 600 12 T 750 12 T 900 12 T 1050 12 T 1200 8" />
      {Array.from({ length: 8 }, (_, i) => 150 * i + 75).map((x) => (
        <path key={x} d={`M${x - 6} 26 L${x} 40 L${x + 6} 26`} fill="currentColor" />
      ))}
    </svg>
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
      <div className="flex h-full items-center justify-center font-serif italic text-white/80">
        Couldn&apos;t load the video — check the wifi and hit reveal again.
      </div>
    );
  }
  if (!src) {
    return (
      <div className="flex h-full items-center justify-center font-serif italic text-white/60 animate-pulse">
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
          <span className="animate-pop rounded-full bg-white/15 px-10 py-6 font-display text-3xl backdrop-blur">
            ▶ Tap to play
          </span>
        </button>
      )}
    </div>
  );
}
