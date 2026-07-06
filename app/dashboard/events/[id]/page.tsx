import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/db/server";
import type {
  EventRow,
  QuestionWithResponse,
  SampleQuestionRow,
} from "@/lib/db/types";
import { normalizeTheme } from "@/lib/theme";
import { ThemeScope } from "@/components/theme/ThemeContext";
import { EventStatusBadge } from "@/components/dashboard/EventStatusBadge";
import { QuestionEditor } from "@/components/editor/QuestionEditor";
import { SendCard } from "@/components/editor/SendCard";
import { EventSettings } from "@/components/editor/EventSettings";
import { PremiumPoller } from "@/components/editor/PremiumPoller";

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
      .or(`role.is.null,role.eq.${event.honoree_role}`)
      .order("sort_hint", { ascending: true }),
  ]);

  const questions = (questionRows ?? []) as QuestionWithResponse[];
  const samples = (sampleRows ?? []) as SampleQuestionRow[];

  return (
    <ThemeScope theme={normalizeTheme(event.theme)} className="min-h-full">
      <div className="space-y-8">
        <div>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-soft hover:text-ink"
          >
            ← All events
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight">
              {event.title}
            </h1>
            <EventStatusBadge
              status={event.status}
              questionIds={questions.map((q) => q.id)}
              readyIds={questions
                .filter((q) => q.responses.some((r) => r.status === "ready"))
                .map((q) => q.id)}
              eventId={event.id}
            />
          </div>
          <p className="mt-1 text-sm text-soft">
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
          <p className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold">
            ✨ Premium event — unlimited questions.
          </p>
        )}

        <QuestionEditor event={event} questions={questions} samples={samples} />

        <SendCard event={event} questionCount={questions.length} />

        <EventSettings event={event} />

        <p className="pb-4 text-center text-xs text-soft">
          Videos are automatically deleted 30 days after the party.
        </p>
      </div>
    </ThemeScope>
  );
}
