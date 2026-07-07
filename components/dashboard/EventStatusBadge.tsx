"use client";

import type { EventStatus, HonoreeRole } from "@/lib/db/types";
import { useReadyCount } from "@/lib/realtime/useReadyCount";

/** Presentational status chip — heirloom pill with a hairline border. */
export function StatusChip({
  status,
  done,
  total,
  responderRole,
}: {
  status: EventStatus;
  done: number;
  total: number;
  /** Role of the person recording — drives the "waiting on him/her" copy. */
  responderRole: HonoreeRole;
}) {
  const base =
    "label-caps inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px]";
  switch (status) {
    case "draft":
      return (
        <span className={`${base} border-line bg-surface text-soft`}>
          Draft
        </span>
      );
    case "awaiting_responses":
      return (
        <span className={`${base} border-accent bg-raised text-primary`}>
          🕐 Waiting on {responderRole === "groom" ? "him" : "her"} · {done}/
          {total}
        </span>
      );
    case "ready":
      return (
        <span className={`${base} border-primary bg-accent text-primary`}>
          🎉 Ready to play
        </span>
      );
    case "completed":
      return (
        <span className={`${base} border-line bg-surface text-soft`}>
          ✓ Played
        </span>
      );
    case "expired":
      return (
        <span className={`${base} border-line bg-surface text-soft`}>
          Expired
        </span>
      );
  }
}

export function EventStatusBadge({
  status,
  questionIds,
  readyIds,
  eventId,
  responderRole,
}: {
  status: EventStatus;
  questionIds: string[];
  readyIds: string[];
  eventId: string;
  responderRole: HonoreeRole;
}) {
  // Live "X of N" while we're waiting on recordings.
  const done = useReadyCount(
    eventId,
    questionIds,
    readyIds,
    status === "awaiting_responses"
  );
  const total = questionIds.length;

  return (
    <StatusChip
      status={status}
      done={Math.min(done, total)}
      total={total}
      responderRole={responderRole}
    />
  );
}
