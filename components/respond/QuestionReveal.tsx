"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Sealed-envelope moment before an unanswered question: the question text
 * hides behind a wax seal until the responder taps to break it. Purely
 * theatrical — the reveal state lives in RespondFlow so navigating away and
 * back doesn't re-seal a question mid-session.
 */
export function QuestionReveal({
  index,
  total,
  onReveal,
}: {
  index: number;
  total: number;
  onReveal: () => void;
}) {
  const [breaking, setBreaking] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function crack() {
    if (breaking) return;
    setBreaking(true);
    // Let the seal-break animation play before the question rises in.
    timer.current = setTimeout(onReveal, 420);
  }

  return (
    <button
      onClick={crack}
      className="double-keyline animate-rise mt-4 flex w-full flex-col items-center px-6 py-12 text-center transition hover:scale-[1.005]"
    >
      <span className="label-caps text-[10px] text-soft">
        Question {index + 1} of {total}
      </span>
      <span
        className={`wax-seal mt-6 flex h-16 w-16 items-center justify-center rounded-full font-display text-3xl text-white/90 ${
          breaking ? "animate-seal-break" : "animate-float"
        }`}
        aria-hidden
      >
        ?
      </span>
      <span className="mt-6 font-display text-2xl italic text-primary">
        {breaking ? "Opening…" : "Tap to reveal the question"}
      </span>
      <span className="mt-1.5 text-xs italic text-soft">
        No peeking — reveal it when the camera&apos;s ready for your reaction.
      </span>
    </button>
  );
}
