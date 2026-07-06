import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/server";
import { updateQuestionSchema } from "@/lib/validation";
import { getOwnedEvent, jsonError, requireUser } from "@/lib/api/guards";
import {
  embeddedRows,
  type QuestionRow,
  type ResponseRow,
} from "@/lib/db/types";

async function getOwnedQuestion(questionId: string, userId: string) {
  const { data, error } = await supabaseAdmin()
    .from("questions")
    .select("*, responses(*)")
    .eq("id", questionId)
    .maybeSingle();
  if (error || !data) {
    return { error: jsonError("Question not found.", 404) };
  }
  const question = {
    ...(data as QuestionRow),
    responses: embeddedRows(
      (data as { responses: ResponseRow | ResponseRow[] | null }).responses
    ),
  };
  const owned = await getOwnedEvent(question.event_id, userId);
  if ("error" in owned) return { error: jsonError("Question not found.", 404) };
  return { question };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if ("error" in user) return user.error;
  const { id } = await params;
  const found = await getOwnedQuestion(id, user.userId);
  if ("error" in found) return found.error;

  const body = await request.json().catch(() => null);
  const parsed = updateQuestionSchema.safeParse(body);
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return jsonError("Nothing valid to update.", 400);
  }

  const { data, error } = await supabaseAdmin()
    .from("questions")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return jsonError("Could not save the question.", 500);
  return NextResponse.json({ question: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if ("error" in user) return user.error;
  const { id } = await params;
  const found = await getOwnedQuestion(id, user.userId);
  if ("error" in found) return found.error;

  // Clean up the recording on Stream before the row cascades.
  const uid = found.question.responses[0]?.stream_video_uid;
  if (uid) {
    const { deleteVideo } = await import("@/lib/stream");
    await deleteVideo(uid).catch(() => {});
  }

  const { error } = await supabaseAdmin()
    .from("questions")
    .delete()
    .eq("id", id);
  if (error) return jsonError("Could not delete the question.", 500);
  return NextResponse.json({ ok: true });
}
