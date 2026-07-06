import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/db/server";
import { jsonError } from "@/lib/api/guards";
import { getEventByRespondToken } from "@/lib/respond";

const bodySchema = z.object({
  respond_token: z.string().min(1).max(64),
  question_id: z.string().uuid(),
  uid: z.string().min(1).max(64),
  duration_seconds: z.number().int().min(0).max(65).nullable().optional(),
  failed: z.boolean().optional(),
});

/**
 * Marks an upload finished (status ready) or failed (status errored) for
 * one question. Also clears a pending redo flag on success.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid request.", 400);
  const { respond_token, question_id, uid, duration_seconds, failed } =
    parsed.data;

  const event = await getEventByRespondToken(respond_token);
  if (!event) return jsonError("This link isn't valid.", 404);

  const db = supabaseAdmin();
  const { data: response } = await db
    .from("responses")
    .select("id, stream_video_uid, questions!inner(event_id)")
    .eq("question_id", question_id)
    .maybeSingle();
  if (
    !response ||
    (response as unknown as { questions: { event_id: string } }).questions
      .event_id !== event.id ||
    response.stream_video_uid !== uid
  ) {
    return jsonError("That upload is no longer current.", 409);
  }

  if (failed) {
    await db
      .from("responses")
      .update({ status: "errored" })
      .eq("question_id", question_id);
    return NextResponse.json({ ok: true });
  }

  const { error } = await db
    .from("responses")
    .update({
      status: "ready",
      duration_seconds: duration_seconds ?? null,
      recorded_at: new Date().toISOString(),
    })
    .eq("question_id", question_id);
  if (error) return jsonError("Could not save your answer.", 500);

  // A fresh take satisfies a redo request.
  const redoClear = await db
    .from("questions")
    .update({ needs_redo: false, redo_note: null })
    .eq("id", question_id);
  if (redoClear.error) {
    // redo_note column may not exist yet (see MIGRATIONS.md) — clear the flag alone.
    await db
      .from("questions")
      .update({ needs_redo: false })
      .eq("id", question_id);
  }

  return NextResponse.json({ ok: true });
}
