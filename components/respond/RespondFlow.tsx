"use client";

import { useEffect, useState } from "react";
import type { EventRow, QuestionWithResponse } from "@/lib/db/types";
import { partyNoun } from "@/lib/theme";
import { PreCheck } from "@/components/respond/PreCheck";
import { QuestionRecorder } from "@/components/respond/QuestionRecorder";
import { QuestionReveal } from "@/components/respond/QuestionReveal";
import { StreamPlayer } from "@/components/video/StreamPlayer";

type Step = "intro" | "precheck" | "questions" | "review" | "done";

export function RespondFlow({
  event,
  initialQuestions,
  hostName,
  respondToken,
}: {
  event: EventRow;
  initialQuestions: QuestionWithResponse[];
  hostName: string | null;
  respondToken: string;
}) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [step, setStep] = useState<Step>("intro");
  const [activeIdx, setActiveIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [locked, setLocked] = useState(event.status === "ready");
  // Bumped on every successful upload to (re)trigger the saved toast.
  const [savedAt, setSavedAt] = useState(0);
  // Questions whose wax seal was broken this session (fresh ones start sealed).
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  const isReady = (q: QuestionWithResponse) =>
    q.responses.some((r) => r.status === "ready");
  const readyCount = questions.filter(isReady).length;
  const allReady = readyCount === questions.length && questions.length > 0;
  const redoCount = questions.filter((q) => q.needs_redo).length;
  const isLockedQuestion = (q: QuestionWithResponse) =>
    locked && !q.needs_redo;

  function markSaved(questionId: string, uid: string, duration: number) {
    setSavedAt(Date.now());
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              needs_redo: false,
              redo_note: null,
              responses: [
                {
                  id: q.responses[0]?.id ?? uid,
                  question_id: q.id,
                  stream_video_uid: uid,
                  status: "ready" as const,
                  duration_seconds: duration,
                  recorded_at: new Date().toISOString(),
                },
              ],
            }
          : q
      )
    );
    // Auto-advance to the next question still needing an answer.
    const next = questions.findIndex(
      (q, i) =>
        i !== activeIdx &&
        (!isReady(q) || q.needs_redo) &&
        q.id !== questionId &&
        i > activeIdx
    );
    if (next >= 0) setActiveIdx(next);
  }

  async function submit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/respond/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respond_token: respondToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(data.error ?? "Couldn't submit — try again.");
        return;
      }
      setLocked(true);
      setStep("done");
    } catch {
      setSubmitError("Network hiccup — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------- intro ---------- */
  if (step === "intro") {
    const already = readyCount > 0;
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10 text-center">
        <p className="font-display text-5xl italic leading-tight text-primary animate-rise">
          Record Your Responses for {event.title}
        </p>
        <p className="mt-6 text-base leading-relaxed">
          {hostName ?? "Someone who loves chaos"} set up a game for{" "}
          <strong>{event.title}</strong>. Answer{" "}
          {questions.length === 1
            ? "this question"
            : `these ${questions.length} questions`}{" "}
          on video. They&apos;ll play on the big screen at the{" "}
          {partyNoun(event.honoree_role)}.
        </p>
        <p className="mt-4 font-semibold">
          Be funny. Be honest. Be brave. ✨
        </p>

        {event.respond_message && (
          <div className="keyline letterpress animate-rise mt-6 p-5 text-left">
            <p className="label-caps text-[10px] text-primary">
              ✎ A note from {hostName ?? "your host"}
            </p>
            <p className="mt-2 whitespace-pre-line font-serif text-sm italic leading-relaxed text-ink">
              &ldquo;{event.respond_message}&rdquo;
            </p>
          </div>
        )}

        {event.greeting_video_uid && (
          <GreetingMessage
            uid={event.greeting_video_uid}
            hostName={hostName}
            respondToken={respondToken}
          />
        )}

        <ul className="mx-auto mt-6 max-w-xs space-y-1.5 text-left text-sm text-soft">
          <li>• 60 seconds max per answer</li>
          <li>• You can re-record any of them</li>
          <li>• Your progress saves automatically</li>
        </ul>
        <button
          onClick={() => {
            if (locked && redoCount === 0) setStep("done");
            else if (allReady && redoCount === 0) setStep("review");
            else if (already || locked) setStep("questions");
            else setStep("precheck");
          }}
          className="label-caps mt-8 bg-primary px-8 py-4 text-xs text-on-primary shadow-lg animate-pop"
        >
          {locked && redoCount > 0
            ? `Fix ${redoCount} redo${redoCount === 1 ? "" : "s"} 😅`
            : locked
              ? "See your status"
              : already
                ? `Keep going (${readyCount}/${questions.length} done)`
                : "Let's do this"}
        </button>
        <p className="mt-6 text-xs text-soft">
          Videos are automatically deleted 30 days after the party.
        </p>
      </div>
    );
  }

  /* ---------- pre-check ---------- */
  if (step === "precheck") {
    return (
      <PreCheck
        onPass={() => setStep("questions")}
        onSkip={() => setStep("questions")}
      />
    );
  }

  /* ---------- done ---------- */
  if (step === "done") {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <p className="text-6xl animate-pop">🎉</p>
        <p className="mt-4 font-display text-5xl italic text-primary">
          Locked in!
        </p>
        <p className="mt-4 text-soft">
          All {questions.length} answers are in.{" "}
          {hostName ?? "The host"} just got the good news. Your only job now
          is showing up to the wedding.
        </p>
        {redoCount > 0 && (
          <button
            onClick={() => setStep("questions")}
            className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-bold text-on-primary"
          >
            Wait — there are {redoCount} redo requests
          </button>
        )}
      </div>
    );
  }

  /* ---------- review ---------- */
  if (step === "review") {
    return (
      <div className="mx-auto min-h-screen max-w-md px-5 py-8">
        <h1 className="font-display text-3xl text-primary">One last look</h1>
        <p className="mt-1 text-sm text-soft">
          Happy with everything? Then lock it in and you&apos;re done.
        </p>
        <ul className="mt-5 space-y-2">
          {questions.map((q, i) => (
            <li
              key={q.id}
              className="keyline flex items-center gap-3 p-3"
            >
              <ResponseThumb
                uid={q.responses[0]?.stream_video_uid ?? null}
                respondToken={respondToken}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {i + 1}. {q.text}
                </p>
                <p className="text-xs text-soft">
                  {isReady(q)
                    ? `✓ ${q.responses[0]?.duration_seconds ?? "–"}s`
                    : "Missing!"}
                </p>
              </div>
              {!isLockedQuestion(q) && (
                <button
                  onClick={() => {
                    setActiveIdx(i);
                    setStep("questions");
                  }}
                  className="shrink-0 text-xs font-bold text-primary"
                >
                  Redo
                </button>
              )}
            </li>
          ))}
        </ul>
        {submitError && (
          <p className="mt-4 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium">
            {submitError}
          </p>
        )}
        <button
          onClick={() => void submit()}
          disabled={!allReady || submitting}
          className="label-caps mt-6 w-full bg-primary px-6 py-4 text-xs text-on-primary disabled:opacity-50"
        >
          {submitting ? "Locking in…" : "Submit & lock in 🔒"}
        </button>
        <button
          onClick={() => setStep("questions")}
          className="mt-3 w-full py-2 text-center text-sm font-medium text-soft"
        >
          Back to the questions
        </button>
      </div>
    );
  }

  /* ---------- questions ---------- */
  const active = questions[activeIdx];
  if (!active) return null;
  const activeReady = isReady(active);
  // Only a fresh, never-answered question hides behind the seal — anything
  // already answered, redo-flagged, or locked has lost the surprise anyway.
  const activeRevealed =
    activeReady ||
    active.needs_redo ||
    isLockedQuestion(active) ||
    revealedIds.has(active.id);

  return (
    <div className="mx-auto min-h-screen max-w-md px-5 py-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-soft">
          {activeIdx + 1} of {questions.length}
        </p>
        <p className="text-sm font-semibold text-primary">
          {readyCount}/{questions.length} answered
        </p>
      </div>

      {/* dot nav */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => setActiveIdx(i)}
            aria-label={`Question ${i + 1}`}
            className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold transition ${
              i === activeIdx
                ? "bg-primary text-on-primary"
                : q.needs_redo
                  ? "bg-accent"
                  : isReady(q)
                    ? "bg-primary/20 text-primary"
                    : "bg-raised text-soft"
            }`}
          >
            {q.needs_redo ? "!" : isReady(q) ? "✓" : i + 1}
          </button>
        ))}
      </div>

      {active.needs_redo && (
        <div className="mt-4 rounded-2xl bg-accent px-4 py-3 text-sm">
          <p className="font-bold">
            {event.honoree_role === "bride" ? "She" : "He"} wants a better
            answer for this one 😅
          </p>
          {active.redo_note && (
            <p className="mt-1 text-soft">“{active.redo_note}”</p>
          )}
        </div>
      )}

      {!activeRevealed ? (
        <QuestionReveal
          key={active.id}
          index={activeIdx}
          total={questions.length}
          onReveal={() =>
            setRevealedIds((prev) => new Set(prev).add(active.id))
          }
        />
      ) : (
        <div key={active.id} className="animate-rise">
          <h1 className="mt-4 font-display text-2xl italic leading-snug text-ink">
            {active.text}
          </h1>

          <div className="mt-4">
            <QuestionRecorder
              question={active}
              respondToken={respondToken}
              locked={isLockedQuestion(active)}
              onSaved={markSaved}
            />
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
          disabled={activeIdx === 0}
          className="rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-bold disabled:opacity-40"
        >
          ← Back
        </button>
        {activeIdx < questions.length - 1 ? (
          <button
            onClick={() =>
              setActiveIdx((i) => Math.min(questions.length - 1, i + 1))
            }
            className="rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-bold"
          >
            {activeReady ? "Next →" : "Skip for now →"}
          </button>
        ) : (
          <button
            onClick={() => setStep("review")}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-on-primary"
          >
            Review all →
          </button>
        )}
      </div>

      {allReady && redoCount === 0 && !locked && (
        <button
          onClick={() => setStep("review")}
          className="mt-4 w-full rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-on-primary animate-pop"
        >
          All answered — review &amp; submit 🎉
        </button>
      )}

      <SavedToast trigger={savedAt} />
    </div>
  );
}

/** Bottom-center "Response saved!" toast; auto-dismisses after a beat. */
function SavedToast({ trigger }: { trigger: number }) {
  // Visible while the latest trigger hasn't been dismissed yet.
  const [dismissed, setDismissed] = useState(0);

  useEffect(() => {
    if (!trigger) return;
    const t = setTimeout(() => setDismissed(trigger), 2800);
    return () => clearTimeout(t);
  }, [trigger]);

  if (!trigger || dismissed >= trigger) return null;
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-5"
      role="status"
      aria-live="polite"
    >
      <div
        key={trigger}
        className="double-keyline animate-pop flex items-center gap-3.5 px-5 py-3.5 shadow-xl"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-base text-primary">
          ✓
        </span>
        <div className="text-left">
          <p className="font-display text-lg italic leading-tight text-primary">
            Response saved!
          </p>
          <p className="mt-0.5 text-xs text-soft">
            Your answer is safely tucked away.
          </p>
        </div>
      </div>
    </div>
  );
}

/** The host's recorded hello, shown on the intro before the questions. */
function GreetingMessage({
  uid,
  hostName,
  respondToken,
}: {
  uid: string;
  hostName: string | null;
  respondToken: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function play() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stream/playback-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, respond_token: respondToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError("Couldn't load the video — try again in a moment.");
        return;
      }
      setSrc(data.urls.hls);
    } catch {
      setError("Couldn't load the video — try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="double-keyline animate-rise mt-6 p-4">
      <p className="label-caps text-[10px] text-primary">
        ✉ A message from {hostName ?? "your host"}
      </p>
      {src ? (
        <StreamPlayer
          src={src}
          autoPlay
          className="mt-3 aspect-video w-full bg-black"
        />
      ) : (
        <button
          onClick={() => void play()}
          disabled={loading}
          className="mt-3 flex aspect-video w-full flex-col items-center justify-center gap-2 bg-raised transition hover:bg-accent disabled:opacity-60"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl text-on-primary">
            ▶
          </span>
          <span className="font-display text-base italic text-primary">
            {loading ? "One sec…" : "Press play before you start"}
          </span>
        </button>
      )}
      {error && <p className="mt-2 text-xs text-soft">{error}</p>}
    </div>
  );
}

/** Tiny signed thumbnail for the review list. */
function ResponseThumb({
  uid,
  respondToken,
}: {
  uid: string | null;
  respondToken: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const stableUid = uid ?? "";

  useEffect(() => {
    if (!stableUid) return;
    let cancelled = false;
    void fetch("/api/stream/playback-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: stableUid, respond_token: respondToken }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.urls?.thumbnail) setSrc(d.urls.thumbnail);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [stableUid, respondToken]);

  return (
    <div className="h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-raised">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : null}
    </div>
  );
}
