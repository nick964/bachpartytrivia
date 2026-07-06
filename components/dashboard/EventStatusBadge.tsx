"use client";

import type { EventStatus } from "@/lib/db/types";
import { useReadyCount } from "@/lib/realtime/useReadyCount";

export function EventStatusBadge({
  status,
  questionIds,
  readyIds,
  eventId,
}: {
  status: EventStatus;
  questionIds: string[];
  readyIds: string[];
  eventId: string;
}) {
  // Live "X of N" while we're waiting on recordings.
  const done = useReadyCount(
    eventId,
    questionIds,
    readyIds,
    status === "awaiting_responses"
  );
  const total = questionIds.length;

  const base =
    "inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold";
  switch (status) {
    case "draft":
      return <span className={`${base} bg-raised text-soft`}>Draft</span>;
    case "awaiting_responses":
      return (
        <span className={`${base} bg-accent text-ink`}>
          Waiting 🕐 {Math.min(done, total)}/{total}
        </span>
      );
    case "ready":
      return (
        <span className={`${base} bg-primary text-on-primary`}>
          Ready to play 🎉
        </span>
      );
    case "completed":
      return <span className={`${base} bg-raised text-soft`}>Played</span>;
    case "expired":
      return <span className={`${base} bg-raised text-soft`}>Expired</span>;
  }
}
