import "server-only";
import { supabaseAdmin } from "@/lib/db/server";
import {
  embeddedRows,
  type EventRow,
  type PlaybackStateRow,
  type ResponseRow,
} from "@/lib/db/types";
import { getEventByPlaybackToken } from "@/lib/respond";
import type { WatchQuestion } from "@/components/watch/useLivePlayback";

export interface WatchData {
  event: EventRow;
  questions: WatchQuestion[]; // visible only, in play order
  initial: { index: number; phase: "question" | "reveal"; tally: Record<string, "right" | "wrong"> };
}

/** Everything the TV/remote surfaces need, or null for a bad token. */
export async function getWatchData(token: string): Promise<WatchData | null> {
  const event = await getEventByPlaybackToken(token);
  if (!event) return null;

  const db = supabaseAdmin();
  const [{ data: questionRows }, { data: stateRow }] = await Promise.all([
    db
      .from("questions")
      .select("id, text, is_hidden, sort_order, responses(*)")
      .eq("event_id", event.id)
      .eq("is_hidden", false)
      .order("sort_order", { ascending: true }),
    db
      .from("playback_state")
      .select("*")
      .eq("event_id", event.id)
      .maybeSingle(),
  ]);

  const questions: WatchQuestion[] = (questionRows ?? []).map((q) => {
    const response = embeddedRows(
      q.responses as ResponseRow | ResponseRow[] | null
    )[0];
    return {
      id: q.id as string,
      text: q.text as string,
      uid:
        response?.status === "ready"
          ? (response.stream_video_uid ?? null)
          : null,
    };
  });

  const state = stateRow as PlaybackStateRow | null;
  return {
    event,
    questions,
    initial: {
      index: state?.current_question_index ?? 0,
      phase: state?.phase ?? "question",
      tally: state?.tally ?? {},
    },
  };
}
