import "server-only";
import { supabaseAdmin } from "@/lib/db/server";
import {
  embeddedRows,
  type EventRow,
  type QuestionWithResponse,
  type ResponseRow,
} from "@/lib/db/types";

const TOKEN_RE = /^[a-f0-9]{32}$/i;

/** Look up an event by its respond token. Returns null for anything invalid. */
export async function getEventByRespondToken(
  token: string
): Promise<EventRow | null> {
  if (!TOKEN_RE.test(token)) return null;
  const { data } = await supabaseAdmin()
    .from("events")
    .select("*")
    .eq("respond_token", token)
    .maybeSingle();
  return (data as EventRow) ?? null;
}

/** Look up an event by its playback token. Returns null for anything invalid. */
export async function getEventByPlaybackToken(
  token: string
): Promise<EventRow | null> {
  if (!TOKEN_RE.test(token)) return null;
  const { data } = await supabaseAdmin()
    .from("events")
    .select("*")
    .eq("playback_token", token)
    .maybeSingle();
  return (data as EventRow) ?? null;
}

export async function getQuestionsWithResponses(
  eventId: string
): Promise<QuestionWithResponse[]> {
  const { data } = await supabaseAdmin()
    .from("questions")
    .select("*, responses(*)")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });
  return (data ?? []).map((row) => ({
    ...(row as QuestionWithResponse),
    responses: embeddedRows(row.responses as ResponseRow | ResponseRow[] | null),
  }));
}
