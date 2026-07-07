import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/server";
import { getOwnedEvent, jsonError, requireUser } from "@/lib/api/guards";
import { createDirectUpload, deleteVideo } from "@/lib/stream";

/**
 * Mints a one-time Cloudflare Stream direct upload URL for the host's
 * greeting video and points the event at the new UID. Re-recording deletes
 * the previous greeting first.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if ("error" in user) return user.error;
  const { id } = await params;
  const owned = await getOwnedEvent(id, user.userId);
  if ("error" in owned) return owned.error;
  if (owned.event.videos_deleted_at) {
    return jsonError("This event has expired.", 410);
  }

  let upload: { uploadURL: string; uid: string };
  try {
    upload = await createDirectUpload({ eventId: id, label: "greeting" });
  } catch {
    return jsonError(
      "Couldn't get an upload spot — give it a second and try again.",
      502
    );
  }

  // Re-record: remove the old greeting before the event points at the new one.
  const oldUid = owned.event.greeting_video_uid;
  if (oldUid && oldUid !== upload.uid) {
    await deleteVideo(oldUid).catch(() => {});
  }

  const { error } = await supabaseAdmin()
    .from("events")
    .update({ greeting_video_uid: upload.uid })
    .eq("id", id);
  if (error) return jsonError("Could not save the greeting.", 500);

  return NextResponse.json({ uploadURL: upload.uploadURL, uid: upload.uid });
}

/** Removes the greeting video (Stream + event row). */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if ("error" in user) return user.error;
  const { id } = await params;
  const owned = await getOwnedEvent(id, user.userId);
  if ("error" in owned) return owned.error;

  const uid = owned.event.greeting_video_uid;
  if (uid) await deleteVideo(uid).catch(() => {});

  const { error } = await supabaseAdmin()
    .from("events")
    .update({ greeting_video_uid: null })
    .eq("id", id);
  if (error) return jsonError("Could not remove the greeting.", 500);
  return NextResponse.json({ ok: true });
}
