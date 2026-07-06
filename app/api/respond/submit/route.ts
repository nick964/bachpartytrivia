import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/db/server";
import { jsonError } from "@/lib/api/guards";
import { getEventByRespondToken, getQuestionsWithResponses } from "@/lib/respond";
import { sendCompletionEmail } from "@/lib/email";

const bodySchema = z.object({
  respond_token: z.string().min(1).max(64),
});

/**
 * "Submit & lock in" — requires every question to have a ready answer,
 * flips the event to ready, and emails the host.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid request.", 400);

  const event = await getEventByRespondToken(parsed.data.respond_token);
  if (!event) return jsonError("This link isn't valid.", 404);
  if (event.status === "expired" || event.videos_deleted_at) {
    return jsonError("This event has expired.", 410);
  }

  const questions = await getQuestionsWithResponses(event.id);
  const missing = questions.filter(
    (q) => !q.responses.some((r) => r.status === "ready")
  );
  if (missing.length > 0) {
    return jsonError(
      `Still ${missing.length} unanswered question${
        missing.length === 1 ? "" : "s"
      } — finish those first.`,
      400
    );
  }
  const redos = questions.filter((q) => q.needs_redo);
  if (redos.length > 0) {
    return jsonError("There's a redo request waiting — re-record it first.", 400);
  }

  const alreadyReady = event.status === "ready";
  const { error } = await supabaseAdmin()
    .from("events")
    .update({ status: "ready" })
    .eq("id", event.id);
  if (error) return jsonError("Could not submit — try again.", 500);

  if (!alreadyReady) {
    // Best effort; a mail hiccup shouldn't block his submission.
    await sendCompletionEmail(event).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
