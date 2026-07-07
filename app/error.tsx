"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="bg-ticking mx-auto flex min-h-screen w-full flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-5xl italic text-primary">
        Well, that fizzled
      </p>
      <p className="mt-4 max-w-md text-soft">
        Something went wrong on our side. Give it another go — the party
        must go on.
      </p>
      <button
        onClick={reset}
        className="label-caps mt-6 bg-primary px-8 py-3.5 text-[11px] text-on-primary"
      >
        Try again
      </button>
    </div>
  );
}
