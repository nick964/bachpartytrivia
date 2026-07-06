import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/db/server";
import { jsonError } from "@/lib/api/guards";
import { getEventByPlaybackToken } from "@/lib/respond";
import type { PlaybackStateRow } from "@/lib/db/types";

/**
 * Playback state for the party. Slide model:
 *   0 = title slide, 1..N = visible questions, N+1 = end slide.
 * The remote is the only writer; the TV renders via Realtime + this GET.
 */

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("playback_token") ?? "";
  const event = await getEventByPlaybackToken(token);
  if (!event) return jsonError("This link isn't valid.", 404);

  const { data } = await supabaseAdmin()
    .from("playback_state")
    .select("*")
    .eq("event_id", event.id)
    .maybeSingle();
  const state = data as PlaybackStateRow | null;
  return NextResponse.json({
    state: {
      event_id: event.id,
      current_question_index: state?.current_question_index ?? 0,
      phase: state?.phase ?? "question",
      tally: state?.tally ?? {},
      updated_at: state?.updated_at ?? null,
    },
  });
}

const postSchema = z.object({
  playback_token: z.string().min(1).max(64),
  op: z.enum(["goto", "tally"]),
  index: z.number().int().min(0).max(500).optional(),
  phase: z.enum(["question", "reveal"]).optional(),
  question_id: z.string().uuid().optional(),
  result: z.enum(["right", "wrong"]).nullable().optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid request.", 400);
  const { playback_token, op, index, phase, question_id, result } =
    parsed.data;

  const event = await getEventByPlaybackToken(playback_token);
  if (!event) return jsonError("This link isn't valid.", 404);
  if (event.videos_deleted_at) {
    return jsonError("This event's videos have been deleted.", 410);
  }

  const db = supabaseAdmin();

  if (op === "goto") {
    if (index === undefined) return jsonError("Missing slide index.", 400);
    const { error } = await db.from("playback_state").upsert(
      {
        event_id: event.id,
        current_question_index: index,
        phase: phase ?? "question",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "event_id" }
    );
    if (error) return jsonError("Could not update playback.", 500);

    // Count visible questions to detect the end slide → event "Played".
    if (event.status === "ready") {
      const { count } = await db
        .from("questions")
        .select("id", { count: "exact", head: true })
        .eq("event_id", event.id)
        .eq("is_hidden", false);
      if (count !== null && index >= count + 1) {
        await db
          .from("events")
          .update({ status: "completed" })
          .eq("id", event.id);
      }
    }
    return NextResponse.json({ ok: true });
  }

  // op === "tally" — requires the tally jsonb column (MIGRATIONS.md).
  if (!question_id) return jsonError("Missing question.", 400);
  const { data: current } = await db
    .from("playback_state")
    .select("tally")
    .eq("event_id", event.id)
    .maybeSingle();
  const tally: Record<string, string> =
    (current?.tally as Record<string, string>) ?? {};
  if (result === null || result === undefined) delete tally[question_id];
  else tally[question_id] = result;

  const { error } = await db
    .from("playback_state")
    .update({ tally, updated_at: new Date().toISOString() })
    .eq("event_id", event.id);
  if (error) {
    return jsonError(
      "Tally isn't available — apply MIGRATIONS.md to enable it.",
      501
    );
  }
  return NextResponse.json({ ok: true, tally });
}
