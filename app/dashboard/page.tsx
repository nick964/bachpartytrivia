import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/db/server";
import { embeddedRows, type EventRow } from "@/lib/db/types";
import { EventCard } from "@/components/dashboard/EventCard";
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
    responses: { status: string } | Array<{ status: string }> | null;
  }>) {
    const p = (progress[q.event_id] ??= { questionIds: [], readyIds: [] });
    p.questionIds.push(q.id);
    if (embeddedRows(q.responses).some((r) => r.status === "ready")) {
      p.readyIds.push(q.id);
    }
  }
  return { rows, progress };
}

function CoupeIcon() {
  return (
    <svg
      viewBox="0 0 48 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="mx-auto h-20 w-14 text-primary"
      aria-hidden
    >
      <path d="M10 6h28c0 14-5 22-14 22S10 20 10 6Z" strokeLinejoin="round" />
      <path strokeLinecap="round" d="M24 28v24M14 56h20M14 12h20" />
      <circle cx="20" cy="3" r="0.8" fill="currentColor" />
      <circle cx="27" cy="1.5" r="0.8" fill="currentColor" />
      <circle cx="24" cy="4.5" r="0.8" fill="currentColor" />
    </svg>
  );
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) return null; // proxy guarantees auth; satisfy TS
  const { rows: events, progress } = await getEvents(userId);

  const activeCount = events.filter(
    (e) => e.status !== "completed" && e.status !== "expired"
  ).length;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-4xl text-primary sm:text-5xl">
          Your Games
        </h1>
        {events.length > 0 && (
          <p className="text-sm italic text-soft">
            {activeCount} active celebration{activeCount === 1 ? "" : "s"}
          </p>
        )}
      </div>

      {events.length === 0 ? (
        <div className="py-10 text-center">
          <CoupeIcon />
          <h2 className="mt-6 font-display text-3xl text-primary">
            Ready to start the celebration?
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-soft">
            Create your first game to engage guests and capture hilarious
            memories before the big day.
          </p>
          <Link
            href="#create"
            className="label-caps mt-8 inline-block bg-primary px-8 py-3.5 text-[11px] text-on-primary transition hover:bg-primary-deep"
          >
            Begin your heirloom game
          </Link>
        </div>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => {
            const p = progress[event.id] ?? { questionIds: [], readyIds: [] };
            return (
              <li key={event.id} className="min-h-56">
                <EventCard
                  eventId={event.id}
                  title={event.title}
                  honoreeName={event.honoree_name}
                  partyDate={event.party_date}
                  status={event.status}
                  honoreeRole={event.honoree_role}
                  questionIds={p.questionIds}
                  readyIds={p.readyIds}
                />
              </li>
            );
          })}
          <li className="min-h-56">
            <Link
              href="#create"
              className="flex h-full flex-col items-center justify-center gap-4 border border-dashed border-line bg-surface/50 p-6 text-center transition hover:border-primary/50 hover:bg-surface"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-raised text-2xl text-primary">
                +
              </span>
              <span className="label-caps text-[11px] text-soft">
                Create new game
              </span>
            </Link>
          </li>
        </ul>
      )}

      <div className="engraved-divider" />

      <CreateEventForm />
    </div>
  );
}
