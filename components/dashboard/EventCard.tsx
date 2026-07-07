"use client";

import Link from "next/link";
import type { EventStatus, HonoreeRole } from "@/lib/db/types";
import { useReadyCount } from "@/lib/realtime/useReadyCount";
import { StatusChip } from "@/components/dashboard/EventStatusBadge";

export function EventCard({
  eventId,
  title,
  honoreeName,
  partyDate,
  status,
  responderRole,
  questionIds,
  readyIds,
}: {
  eventId: string;
  title: string;
  honoreeName: string;
  partyDate: string;
  status: EventStatus;
  responderRole: HonoreeRole;
  questionIds: string[];
  readyIds: string[];
}) {
  // Live "X of N" while we're waiting on recordings.
  const done = useReadyCount(
    eventId,
    questionIds,
    readyIds,
    status === "awaiting_responses"
  );
  const total = questionIds.length;
  const recorded = Math.min(done, total);

  return (
    <Link
      href={`/dashboard/events/${eventId}`}
      className="keyline flex h-full flex-col p-6 transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div>
        <StatusChip
          status={status}
          done={recorded}
          total={total}
          responderRole={responderRole}
        />
      </div>
      <h2 className="mt-4 font-display text-2xl leading-snug text-primary">
        {title}
      </h2>
      <p className="mt-1 text-sm italic text-soft">
        {honoreeName} ·{" "}
        {new Date(partyDate + "T00:00:00").toLocaleDateString(undefined, {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      </p>

      <div className="mt-auto pt-8">
        {status === "awaiting_responses" ? (
          <div>
            <div className="flex items-baseline justify-between text-xs text-soft">
              <span>
                {recorded} of {total} recorded
              </span>
              <span className="font-sans font-semibold">
                {total === 0 ? 0 : Math.round((recorded / total) * 100)}%
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-raised">
              <div
                className="h-full rounded-full bg-primary/60 transition-all"
                style={{
                  width: `${total === 0 ? 0 : (recorded / total) * 100}%`,
                }}
              />
            </div>
          </div>
        ) : status === "ready" ? (
          <span className="label-caps block bg-primary px-4 py-3 text-center text-[11px] text-on-primary">
            Launch game
          </span>
        ) : status === "draft" ? (
          <span className="label-caps block border border-primary px-4 py-3 text-center text-[11px] text-primary">
            Continue editing
          </span>
        ) : (
          <span className="label-caps block text-center text-[11px] text-soft underline underline-offset-4">
            View results
          </span>
        )}
      </div>
    </Link>
  );
}
