import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventByPlaybackToken } from "@/lib/respond";
import { normalizeTheme } from "@/lib/theme";
import { ThemeScope } from "@/components/theme/ThemeContext";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Party time 🥂",
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
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center bg-bg px-6 py-10 text-center">
        <p className="font-script text-5xl text-primary">{event.title}</p>
        <p className="mt-3 text-sm text-soft">
          Two screens, one game: the TV shows the show, your phone drives it.
        </p>

        <Link
          href={`/watch/${token}/tv`}
          className="mt-8 rounded-3xl border-2 border-primary bg-surface p-6 shadow-lg transition hover:scale-[1.01]"
        >
          <p className="text-4xl">📺</p>
          <p className="mt-2 text-lg font-extrabold">Open on the TV</p>
          <p className="mt-1 text-xs text-soft">
            Open this link on a smart TV browser or a laptop plugged into the
            TV. Full-screen it.
          </p>
        </Link>

        <Link
          href={`/watch/${token}/remote`}
          className="mt-4 rounded-3xl border border-line bg-surface p-6 transition hover:scale-[1.01]"
        >
          <p className="text-4xl">🎛️</p>
          <p className="mt-2 text-lg font-extrabold">Use as remote</p>
          <p className="mt-1 text-xs text-soft">
            Keep this on the host&apos;s phone — next, reveal, and the
            right/wrong tally.
          </p>
        </Link>

        <div className="mt-8 rounded-2xl bg-raised p-4 text-left text-xs leading-relaxed text-soft">
          <p className="font-bold text-ink">Casting tips</p>
          <ul className="mt-1 space-y-1">
            <li>
              • Best: open the TV link directly in a smart-TV browser, or use
              a laptop on HDMI.
            </li>
            <li>
              • iPhone: AirPlay works from Safari once a video is playing —
              but the question slides stay on the phone, so HDMI/TV browser
              beats it.
            </li>
            <li>• Same wifi not required — any two screens work.</li>
          </ul>
        </div>
      </div>
    </ThemeScope>
  );
}
