import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getWatchData } from "@/lib/watch";
import { normalizeTheme } from "@/lib/theme";
import { ThemeScope } from "@/components/theme/ThemeContext";
import { Remote } from "@/components/watch/Remote";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Remote",
  robots: { index: false },
};

export default async function RemotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getWatchData(token);
  if (!data) notFound();

  return (
    <ThemeScope theme={normalizeTheme(data.event.theme)} className="flex-1">
      <Remote
        event={data.event}
        questions={data.questions}
        initial={data.initial}
        playbackToken={token}
      />
    </ThemeScope>
  );
}
