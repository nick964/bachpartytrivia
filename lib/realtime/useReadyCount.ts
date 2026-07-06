"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/db/browser";
import type { ResponseRow } from "@/lib/db/types";

/**
 * Live count of questions with a ready response, seeded from the server
 * and kept fresh via a read-only Realtime subscription on `responses`.
 */
export function useReadyCount(
  channelKey: string,
  questionIds: string[],
  initialReadyIds: string[],
  enabled: boolean
): number {
  const [readyIds, setReadyIds] = useState<Set<string>>(
    () => new Set(initialReadyIds)
  );

  useEffect(() => {
    if (!enabled || questionIds.length === 0) return;
    const idSet = new Set(questionIds);
    const channel = supabaseBrowser()
      .channel(`ready-count:${channelKey}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "responses" },
        (payload) => {
          const row = (payload.new ?? payload.old) as Partial<ResponseRow>;
          if (!row.question_id || !idSet.has(row.question_id)) return;
          setReadyIds((prev) => {
            const next = new Set(prev);
            if (payload.eventType !== "DELETE" && row.status === "ready") {
              next.add(row.question_id!);
            } else {
              next.delete(row.question_id!);
            }
            return next;
          });
        }
      )
      .subscribe();
    return () => {
      void supabaseBrowser().removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelKey, enabled, questionIds.join(",")]);

  return readyIds.size;
}
