import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { clerkClient } from "@clerk/nextjs/server";
import {
  getEventByRespondToken,
  getQuestionsWithResponses,
} from "@/lib/respond";
import { normalizeTheme } from "@/lib/theme";
import { ThemeScope } from "@/components/theme/ThemeContext";
import { RespondFlow } from "@/components/respond/RespondFlow";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Record Your Responses ✨",
  robots: { index: false },
};

export default async function RespondPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const event = await getEventByRespondToken(token);
  if (!event) notFound();

  const questions = await getQuestionsWithResponses(event.id);

  let hostName: string | null = null;
  try {
    const client = await clerkClient();
    const owner = await client.users.getUser(event.owner_clerk_id);
    hostName = owner.firstName;
  } catch {
    // Header copy degrades gracefully without a name.
  }

  const expired = event.status === "expired" || !!event.videos_deleted_at;

  return (
    <ThemeScope theme={normalizeTheme(event.theme)} className="flex-1">
      <div className="bg-ticking min-h-screen">
        {expired ? (
          <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
            <p className="font-display text-5xl italic text-primary">
              The party&apos;s over
            </p>
            <p className="mt-4 text-soft">
              This event has wrapped up and its videos are gone. Nice work if
              you were part of it. ✨
            </p>
          </div>
        ) : (
          <RespondFlow
            event={event}
            initialQuestions={questions}
            hostName={hostName}
            respondToken={token}
          />
        )}
      </div>
    </ThemeScope>
  );
}
