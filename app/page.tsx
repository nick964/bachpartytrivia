import Image from "next/image";
import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";

const steps = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
        <path strokeLinecap="round" d="M4 6h10M4 10h7M4 14h5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m13.5 16.5 5-5 2 2-5 5-2.5.5.5-2.5Z" />
      </svg>
    ),
    title: "Write the questions",
    body: "Pick from our library or write your own — “Where was your first date?”, “Who said I love you first?” Send one magic link.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
        <rect x="3" y="6" width="12" height="12" rx="2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m15 10 6-3v10l-6-3" />
      </svg>
    ),
    title: "They record",
    body: "The groom or bride answers each one on video from their phone. No app, no account, 60 seconds max. You get an email the moment they finish. 👀",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 3h8l-3.2 8H16l-6 10 1.5-7H8.5L8 3Z" />
      </svg>
    ),
    title: "Play at the party",
    body: "Put it on the TV and gather everyone around. The guest of honor guesses out loud, then the video plays — and everyone sees how well they really know each other.",
  },
];

/** CTA that sends new visitors to sign-up and signed-in hosts to their events. */
function AuthCta({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Show when="signed-out">
        <Link href="/sign-up" className={className}>
          {children}
        </Link>
      </Show>
      <Show when="signed-in">
        <Link href="/dashboard" className={className}>
          {children}
        </Link>
      </Show>
    </>
  );
}

function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2c.6 4.8 2.4 7.4 8 8-5.6.6-7.4 3.2-8 8-.6-4.8-2.4-7.4-8-8 5.6-.6 7.4-3.2 8-8Z" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <main className="flex-1 bg-ticking">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-primary/10 bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-3.5">
          <span className="flex items-center gap-3">
            <Image
              src="/bachtrivia_logo.png"
              alt="Bach Party Trivia logo"
              width={36}
              height={36}
              className="h-9 w-9 rounded-full object-cover"
            />
            <span className="font-display text-2xl leading-none text-primary">
              Bach Party Trivia
            </span>
          </span>
          <nav className="flex items-center gap-4">
            <a
              href="#how-it-works"
              className="label-caps hidden text-[11px] text-soft transition hover:text-primary sm:block"
            >
              How it works
            </a>
            <a
              href="#pricing"
              className="label-caps hidden text-[11px] text-soft transition hover:text-primary sm:block"
            >
              Pricing
            </a>
            <Show when="signed-out">
              <Link
                href="/sign-in"
                className="label-caps px-2 py-2 text-[11px] text-soft transition hover:text-primary"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="label-caps bg-primary px-5 py-2.5 text-[11px] text-on-primary shadow-sm transition hover:bg-primary-deep"
              >
                Get started
              </Link>
            </Show>
            <Show when="signed-in">
              <Link
                href="/dashboard"
                className="label-caps bg-primary px-5 py-2.5 text-[11px] text-on-primary shadow-sm transition hover:bg-primary-deep"
              >
                My events
              </Link>
              <UserButton />
            </Show>
          </nav>
        </div>
      </header>

      {/* Hero — the party moment itself */}
      <section className="relative mx-auto max-w-5xl px-5 pb-6 pt-12 sm:pt-16">
        <Sparkle className="pointer-events-none absolute left-4 top-6 h-8 w-8 text-gold/50 sm:left-0" />
        <Sparkle className="pointer-events-none absolute right-6 top-24 h-5 w-5 text-accent" />

        <div className="double-keyline animate-rise p-3 sm:p-4">
          <div className="relative aspect-video w-full overflow-hidden">
            <Image
              src="/party-highlight.jpg"
              alt="A party laughing along as the game plays on the TV"
              fill
              sizes="(min-width: 1024px) 960px, 100vw"
              className="object-cover"
              priority
            />
          </div>
          <div className="mx-auto max-w-2xl px-2 py-8 text-center sm:py-10">
            <p className="label-caps text-[11px] text-soft">
              The bachelorette &amp; bachelor party game
            </p>
            <h1 className="mt-3 font-display text-4xl text-primary sm:text-5xl">
              Make A Quiz for Your Fiance!
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base italic leading-relaxed text-soft">
              &ldquo;There&apos;s nothing like the energy of the room when the
              guest of honor hears those answers for the first time. It&apos;s
              the heart of the celebration.&rdquo;
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4">
              <AuthCta className="label-caps bg-primary px-10 py-4 text-xs text-on-primary shadow-md transition hover:bg-primary-deep active:scale-95">
                Create your game
              </AuthCta>
              <p className="font-display text-2xl italic text-primary">
                You may now quiz the bride!
              </p>
              <span className="text-sm italic text-soft">
                5 questions free · no card needed
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="mx-auto max-w-5xl scroll-mt-20 px-5 py-14"
      >
        <div className="mb-8 flex items-center justify-center gap-6">
          <div className="h-px w-12 bg-accent" />
          <h2 className="label-caps text-xs text-primary">How it works</h2>
          <div className="h-px w-12 bg-accent" />
        </div>
        <p className="mx-auto mb-12 max-w-xl text-center text-base leading-relaxed text-soft sm:text-lg">
          Send the groom or bride a link before the party. They record their
          answers from their phone — then at the party, the guest of honor
          guesses before each video plays on the TV.{" "}
          <em className="font-display text-primary">
            How well do they really know each other?
          </em>
        </p>
        <div className="grid gap-8 sm:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.title}
              className="keyline p-8 text-center transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent/40 text-primary">
                {s.icon}
              </div>
              <h3 className="font-display text-2xl text-primary">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-soft">{s.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-center text-sm italic text-soft">
          Bachelorette or bachelor party, any couple — you pick who records
          and who guesses. Two themes: blush or navy &amp; gold.
        </p>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-20 bg-raised/60 py-16">
        <div className="mx-auto max-w-4xl px-5">
          <div className="text-center">
            <h2 className="font-display text-4xl text-primary">
              Choose Your Experience
            </h2>
            <p className="mt-3 text-base italic text-soft">
              From intimate gatherings to the grandest galas.
            </p>
          </div>
          <div className="mt-12 grid items-stretch gap-10 sm:grid-cols-2">
            {/* Free */}
            <div className="double-keyline flex h-full flex-col p-8 sm:p-10">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-2xl text-primary">Free</h3>
                  <p className="label-caps mt-1 text-[10px] text-soft">
                    Basic kit
                  </p>
                </div>
                <span className="font-display text-3xl text-primary">$0</span>
              </div>
              <ul className="mt-8 flex-1 space-y-3.5 text-sm text-soft">
                <li className="flex items-center gap-3">
                  <span className="text-primary">✓</span> 5 custom questions
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-primary">✓</span> Video answers &amp; TV
                  mode
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-primary">✓</span> Phone remote for the
                  host
                </li>
              </ul>
              <AuthCta className="label-caps mt-10 block border border-primary px-6 py-3.5 text-center text-[11px] text-primary transition hover:bg-primary hover:text-on-primary">
                Start free
              </AuthCta>
            </div>
            {/* Premium */}
            <div className="double-keyline relative flex h-full flex-col p-8 shadow-xl sm:p-10">
              <div className="wax-seal absolute -right-5 -top-5 z-10 flex h-16 w-16 rotate-12 items-center justify-center rounded-full text-white">
                <span className="font-display text-2xl">B</span>
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-2xl text-primary">
                    Premium
                  </h3>
                  <p className="label-caps mt-1 text-[10px] text-gold">
                    The heirloom
                  </p>
                </div>
                <span className="font-display text-3xl text-primary">
                  $20
                  <span className="ml-1 align-middle font-serif text-xs italic text-soft">
                    / event, once
                  </span>
                </span>
              </div>
              <ul className="mt-8 flex-1 space-y-3.5 text-sm text-soft">
                <li className="flex items-center gap-3 font-semibold text-ink">
                  <span className="text-gold">✓</span> Unlimited questions
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-gold">✓</span> Everything in Free
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-gold">✓</span> One less thing to plan ✨
                </li>
              </ul>
              <AuthCta className="label-caps mt-10 block bg-primary px-6 py-3.5 text-center text-[11px] text-on-primary transition hover:bg-primary-deep">
                Get premium
              </AuthCta>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="mx-auto max-w-4xl px-5 py-16">
        <div className="double-keyline px-8 py-12 text-center sm:px-20">
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="mx-auto mb-6 h-10 w-10 text-accent"
            aria-hidden
          >
            <path d="M6.5 5C4 6.5 2.5 9 2.5 12.5V19h7v-7h-4c0-2.5 1.2-4.2 3-5.3L6.5 5Zm11 0C15 6.5 13.5 9 13.5 12.5V19h7v-7h-4c0-2.5 1.2-4.2 3-5.3L17.5 5Z" />
          </svg>
          <p className="mx-auto max-w-xl font-display text-2xl italic leading-relaxed text-primary">
            &ldquo;The highlight of the entire weekend. We laughed, we cried,
            and Sarah has a video of her groom she&apos;ll treasure
            forever.&rdquo;
          </p>
          <div className="mx-auto mt-8 flex max-w-xs items-center justify-center gap-4">
            <div className="h-px w-8 bg-gold" />
            <p className="label-caps text-[10px] text-primary">
              Catherine, maid of honor
            </p>
            <div className="h-px w-8 bg-gold" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-primary/10 bg-bg py-12 text-center">
        <span className="flex items-center justify-center gap-2.5">
          <span className="wax-seal flex h-7 w-7 items-center justify-center rounded-full font-display text-sm text-white">
            B
          </span>
          <span className="font-display text-xl text-primary">
            Bach Party Trivia
          </span>
        </span>
        <p className="mt-5 text-xs italic text-soft">
          Party Games For The Bach! · videos auto-delete 30 days after the
          party · made with love ♡
        </p>
        <div className="mt-6">
          <p className="label-caps text-[10px] text-soft">Made by Nick</p>
          <p className="mt-2 space-x-4 text-xs">
            <a
              href="mailto:nickr964@gmail.com"
              className="text-soft underline-offset-2 transition hover:text-primary hover:underline"
            >
              ✉ nickr964@gmail.com
            </a>
            <a
              href="https://twitter.com/nicky_robby"
              target="_blank"
              rel="noopener noreferrer"
              className="text-soft underline-offset-2 transition hover:text-primary hover:underline"
            >
              𝕏 @nicky_robby
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
