import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/db/server";
import { jsonError } from "@/lib/api/guards";
import { getEventByRespondToken } from "@/lib/respond";
import { createDirectUpload, deleteVideo } from "@/lib/stream";
import { embeddedRows, type ResponseRow } from "@/lib/db/types";

const bodySchema = z.object({
  respond_token: z.string().min(1).max(64),
  question_id: z.string().uuid(),
});

/**
 * Mints a one-time Cloudflare Stream direct creator upload URL for one
 * question and marks the response row "uploading". Re-recording deletes
 * the previous Stream video first.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid request.", 400);
  const { respond_token, question_id } = parsed.data;

  const event = await getEventByRespondToken(respond_token);
  if (!event) return jsonError("This link isn't valid.", 404);
  if (event.status === "expired" || event.videos_deleted_at) {
    return jsonError("This event has expired.", 410);
  }

  const db = supabaseAdmin();
  const { data: question } = await db
    .from("questions")
    .select("id, event_id, responses(*)")
    .eq("id", question_id)
    .eq("event_id", event.id)
    .maybeSingle();
  if (!question) return jsonError("Question not found.", 404);

  let upload: { uploadURL: string; uid: string };
  try {
    upload = await createDirectUpload({
      eventId: event.id,
      questionId: question_id,
    });
  } catch {
    return jsonError(
      "Couldn't get an upload spot — give it a second and try again.",
      502
    );
  }

  // Re-record: remove the old video before the row points at the new one.
  const oldUid = embeddedRows(
    question.responses as ResponseRow | ResponseRow[] | null
  )[0]?.stream_video_uid;
  if (oldUid && oldUid !== upload.uid) {
    await deleteVideo(oldUid).catch(() => {});
  }

  const { error } = await db.from("responses").upsert(
    {
      question_id,
      stream_video_uid: upload.uid,
      status: "uploading",
      duration_seconds: null,
      recorded_at: null,
    },
    { onConflict: "question_id" }
  );
  if (error) return jsonError("Could not save your progress.", 500);

  return NextResponse.json({ uploadURL: upload.uploadURL, uid: upload.uid });
}
