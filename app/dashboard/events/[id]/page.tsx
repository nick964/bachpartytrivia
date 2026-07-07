import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/db/server";
import {
  embeddedRows,
  type EventRow,
  type QuestionWithResponse,
  type ResponseRow,
  type SampleQuestionRow,
} from "@/lib/db/types";
import { responderRoleOf } from "@/lib/theme";
import { EventStatusBadge } from "@/components/dashboard/EventStatusBadge";
import { QuestionEditor } from "@/components/editor/QuestionEditor";
import { GreetingCard } from "@/components/editor/GreetingCard";
import { SendCard } from "@/components/editor/SendCard";
import { EventSettings } from "@/components/editor/EventSettings";
import { PremiumPoller } from "@/components/editor/PremiumPoller";
import { DownloadVideos } from "@/components/dashboard/DownloadVideos";
import { PlayBanner } from "@/components/dashboard/PlayBanner";

export const dynamic = "force-dynamic";

export default async function EventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ upgraded?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) return null;
  const { id } = await params;
  const { upgraded } = await searchParams;

  const db = supabaseAdmin();
  const { data: eventRow } = await db
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const event = eventRow as EventRow | null;
  if (!event || event.owner_clerk_id !== userId) notFound();

  const [{ data: questionRows }, { data: sampleRows }] = await Promise.all([
    db
      .from("questions")
      .select("*, responses(*)")
      .eq("event_id", id)
      .order("sort_order", { ascending: true }),
    db
      .from("sample_questions")
      .select("*")
      // Role-tagged samples are questions asked TO that role (the recorder).
      .or(`role.is.null,role.eq.${responderRoleOf(event)}`)
      .order("sort_hint", { ascending: true }),
  ]);

  const questions: QuestionWithResponse[] = (questionRows ?? []).map((row) => ({
    ...(row as QuestionWithResponse),
    responses: embeddedRows(row.responses as ResponseRow | ResponseRow[] | null),
  }));
  const samples = (sampleRows ?? []) as SampleQuestionRow[];

  // The event's theme (navy/blush) styles the guest-facing screens only —
  // the dashboard editor always uses the light site palette.
  return (
    <div className="min-h-full">
      <div className="space-y-10">
        <div>
          <Link
            href="/dashboard"
            className="label-caps text-[10px] text-soft transition hover:text-primary"
          >
            ← All games
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <h1 className="font-display text-4xl text-primary">
              {event.title}
            </h1>
            <EventStatusBadge
              status={event.status}
              questionIds={questions.map((q) => q.id)}
              readyIds={questions
                .filter((q) => q.responses.some((r) => r.status === "ready"))
                .map((q) => q.id)}
              eventId={event.id}
              responderRole={responderRoleOf(event)}
            />
          </div>
          <p className="mt-1.5 text-sm italic text-soft">
            {event.honoree_name} records ·{" "}
            {new Date(event.party_date + "T00:00:00").toLocaleDateString(
              undefined,
              { weekday: "long", month: "long", day: "numeric" }
            )}
          </p>
        </div>

        {upgraded === "1" && !event.is_premium && (
          <PremiumPoller eventId={event.id} />
        )}
        {event.is_premium && (
          <p className="border border-gold/40 bg-raised px-4 py-3 text-sm">
            <span className="label-caps mr-2 text-[10px] text-gold">
              Premium
            </span>
            Unlimited questions unlocked for this event. ✨
          </p>
        )}

        {(event.status === "ready" || event.status === "completed") && (
          <PlayBanner event={event} />
        )}

        <QuestionEditor event={event} questions={questions} samples={samples} />

        <GreetingCard event={event} />

        <SendCard event={event} questionCount={questions.length} />

        {questions.some((q) =>
          q.responses.some((r) => r.status === "ready")
        ) &&
          !event.videos_deleted_at && <DownloadVideos eventId={event.id} />}

        <EventSettings event={event} />

        <p className="pb-4 text-center text-xs italic text-soft">
          Videos are automatically deleted 30 days after the party.
        </p>
      </div>
    </div>
  );
}
