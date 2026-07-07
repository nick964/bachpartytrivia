import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventByPlaybackToken } from "@/lib/respond";
import { normalizeTheme } from "@/lib/theme";
import { ThemeScope } from "@/components/theme/ThemeContext";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Party time 🎉",
  robots: { index: false },
};

export default async function WatchChooserPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const event = await getEventByPlaybackToken(token);
  if (!event) notFound();

  return (
    <ThemeScope theme={normalizeTheme(event.theme)} className="flex-1">
      <div className="bg-ticking mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10 text-center">
        <p className="font-display text-5xl italic text-primary">
          {event.title}
        </p>
        <p className="mt-3 text-sm italic text-soft">
          One phone casted to the TV, or two screens — your call.
        </p>

        <Link
          href={`/watch/${token}/solo`}
          className="double-keyline mt-8 p-6 shadow-lg transition hover:scale-[1.01]"
        >
          <p className="text-4xl">📱→📺</p>
          <p className="mt-2 font-display text-2xl text-primary">
            One device — cast it
          </p>
          <p className="mt-1 text-xs text-soft">
            Mirror this phone to the TV (AirPlay / Cast). You run the show and
            control it from the same screen — the buttons fade out for guests.
          </p>
        </Link>

        <Link
          href={`/watch/${token}/tv`}
          className="keyline mt-4 p-6 transition hover:scale-[1.01]"
        >
          <p className="text-4xl">📺</p>
          <p className="mt-2 font-display text-2xl text-primary">
            Open on the TV
          </p>
          <p className="mt-1 text-xs text-soft">
            Open this link on a smart TV browser or a laptop plugged into the
            TV, then drive it with the remote below.
          </p>
        </Link>

        <Link
          href={`/watch/${token}/remote`}
          className="keyline mt-4 p-6 transition hover:scale-[1.01]"
        >
          <p className="text-4xl">🎛️</p>
          <p className="mt-2 font-display text-2xl text-primary">
            Use as remote
          </p>
          <p className="mt-1 text-xs text-soft">
            Keep this on the host&apos;s phone — next, reveal, and the
            right/wrong tally.
          </p>
        </Link>

        <div className="mt-8 bg-raised p-4 text-left text-xs leading-relaxed text-soft">
          <p className="label-caps text-[10px] text-ink">Casting tips</p>
          <ul className="mt-1 space-y-1">
            <li>
              • One device: use Screen Mirroring (iPhone Control Center →
              Screen Mirroring, or Android Cast) — not the AirPlay button
              inside the video — so the whole show reaches the TV. Landscape
              looks best.
            </li>
            <li>
              • Two screens: open the TV link in a smart-TV browser or a
              laptop on HDMI — same wifi not required.
            </li>
          </ul>
        </div>
      </div>
    </ThemeScope>
  );
}
