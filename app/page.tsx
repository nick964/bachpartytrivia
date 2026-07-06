import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";

const steps = [
  {
    n: "1",
    title: "Write the questions",
    body: "Pick from our library or write your own — “Where was your first date?”, “Who said I love you first?” Send him one magic link.",
  },
  {
    n: "2",
    title: "He records",
    body: "He answers each one on video from his phone. No app, no account, 60 seconds max. You get an email when he's done. 👀",
  },
  {
    n: "3",
    title: "Play at the party",
    body: "Put it on the TV, hand the bride a drink. She guesses out loud, then his video plays. Wrong guess = drink.",
  },
];

export default function LandingPage() {
  return (
    <main className="flex-1">
      {/* Header */}
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-4">
        <span className="font-script text-3xl leading-none text-primary">
          Guess the Groom
        </span>
        <nav className="flex items-center gap-3 text-sm">
          <Show when="signed-out">
            <Link
              href="/sign-in"
              className="rounded-full px-4 py-2 font-medium text-ink/80 hover:text-ink"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-full bg-primary px-4 py-2 font-semibold text-on-primary shadow-sm transition hover:bg-primary-deep"
            >
              Get started
            </Link>
          </Show>
          <Show when="signed-in">
            <Link
              href="/dashboard"
              className="rounded-full bg-primary px-4 py-2 font-semibold text-on-primary shadow-sm transition hover:bg-primary-deep"
            >
              My events
            </Link>
            <UserButton />
          </Show>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-5 pb-16 pt-12 text-center sm:pt-20">
        <p className="mb-4 inline-block rounded-full border border-line bg-surface px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-soft">
          The bachelorette party game
        </p>
        <h1 className="animate-rise text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          He answers on video.
          <br />
          She guesses <span className="text-primary">live</span>.
          <br />
          <span className="font-script text-5xl font-normal text-primary-deep sm:text-6xl">
            Wrong guess = drink.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-soft">
          Send the groom a link before the party. He records his answers from
          his phone — then at the bachelorette, the bride guesses before each
          video plays on the TV.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/sign-up"
            className="w-full rounded-full bg-primary px-8 py-3.5 text-center text-base font-bold text-on-primary shadow-lg shadow-accent transition hover:bg-primary-deep sm:w-auto"
          >
            Create your game — free
          </Link>
          <span className="text-sm text-soft">
            3 questions free · no card needed
          </span>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-line bg-surface py-16">
        <div className="mx-auto max-w-5xl px-5">
          <h2 className="text-center text-3xl font-extrabold tracking-tight">
            How it works
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {steps.map((s) => (
              <div
                key={s.n}
                className="rounded-3xl border border-line bg-bg p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent font-script text-2xl text-primary-deep">
                  {s.n}
                </div>
                <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-soft">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-soft">
            Planning a bachelor party instead? Flip it — she records, he
            guesses. Same game, navy &amp; gold.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight">
            Simple pricing
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="rounded-3xl border border-line bg-surface p-8 text-left">
              <h3 className="text-lg font-bold">Free</h3>
              <p className="mt-1 text-4xl font-extrabold">$0</p>
              <ul className="mt-4 space-y-2 text-sm text-soft">
                <li>✓ 3 questions</li>
                <li>✓ Video answers &amp; TV mode</li>
                <li>✓ Phone remote for the host</li>
              </ul>
            </div>
            <div className="relative rounded-3xl border-2 border-primary bg-surface p-8 text-left shadow-lg shadow-accent">
              <span className="absolute -top-3 right-6 rounded-full bg-primary px-3 py-1 text-xs font-bold text-on-primary">
                MOST POPULAR
              </span>
              <h3 className="text-lg font-bold">Premium</h3>
              <p className="mt-1 text-4xl font-extrabold">
                $20
                <span className="text-base font-medium text-soft">
                  {" "}
                  / event, once
                </span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-soft">
                <li>✓ Unlimited questions</li>
                <li>✓ Everything in Free</li>
                <li>✓ One less thing to plan 🥂</li>
              </ul>
            </div>
          </div>
          <Link
            href="/sign-up"
            className="mt-10 inline-block rounded-full bg-primary px-8 py-3.5 text-base font-bold text-on-primary shadow-lg shadow-accent transition hover:bg-primary-deep"
          >
            Start free
          </Link>
        </div>
      </section>

      <footer className="border-t border-line py-8 text-center text-xs text-soft">
        <p>
          Guess the Groom · videos auto-delete 30 days after the party · drink
          responsibly 🥂
        </p>
      </footer>
    </main>
  );
}
