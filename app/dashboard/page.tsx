import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/db/server";
import type { EventRow } from "@/lib/db/types";
import { EventStatusBadge } from "@/components/dashboard/EventStatusBadge";
import { CreateEventForm } from "@/components/dashboard/CreateEventForm";

export const dynamic = "force-dynamic";

type ProgressMap = Record<string, { questionIds: string[]; readyIds: string[] }>;

async function getEvents(userId: string) {
  const db = supabaseAdmin();
  const { data: events, error } = await db
    .from("events")
    .select("*")
    .eq("owner_clerk_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load events: ${error.message}`);

  const rows = (events ?? []) as EventRow[];
  const progress: ProgressMap = {};
  if (rows.length === 0) return { rows, progress };

  const { data: questions } = await db
    .from("questions")
    .select("id, event_id, responses(status)")
    .in(
      "event_id",
      rows.map((e) => e.id)
    );

  for (const q of (questions ?? []) as Array<{
    id: string;
    event_id: string;
    responses: Array<{ status: string }>;
  }>) {
    const p = (progress[q.event_id] ??= { questionIds: [], readyIds: [] });
    p.questionIds.push(q.id);
    if (q.responses.some((r) => r.status === "ready")) p.readyIds.push(q.id);
  }
  return { rows, progress };
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) return null; // proxy guarantees auth; satisfy TS
  const { rows: events, progress } = await getEvents(userId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Your events</h1>
        <p className="text-sm text-soft">
          Every party gets its own game, questions, and links.
        </p>
      </div>

      {events.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line bg-surface p-10 text-center">
          <p className="font-script text-4xl text-primary">
            Let&apos;s plan a game
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-soft">
            Create your first event below — you&apos;ll add questions next,
            then send him the link.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {events.map((event) => {
            const p = progress[event.id] ?? { questionIds: [], readyIds: [] };
            return (
              <li key={event.id}>
                <Link
                  href={`/dashboard/events/${event.id}`}
                  className="block rounded-3xl border border-line bg-surface p-6 transition hover:border-primary/50 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-bold leading-snug">
                      {event.title}
                    </h2>
                    <EventStatusBadge
                      status={event.status}
                      questionIds={p.questionIds}
                      readyIds={p.readyIds}
                      eventId={event.id}
                    />
                  </div>
                  <p className="mt-1 text-sm text-soft">
                    {event.honoree_name} ·{" "}
                    {new Date(
                      event.party_date + "T00:00:00"
                    ).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <CreateEventForm />
    </div>
  );
}
