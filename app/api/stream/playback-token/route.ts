import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/db/server";
import { jsonError } from "@/lib/api/guards";
import { playbackUrls, signPlaybackToken } from "@/lib/stream";

const bodySchema = z.object({
  uid: z.string().min(1).max(64),
  playback_token: z.string().max(64).optional(),
  respond_token: z.string().max(64).optional(),
  downloadable: z.boolean().optional(),
});

interface EventAuthRow {
  owner_clerk_id: string;
  respond_token: string;
  playback_token: string;
  videos_deleted_at: string | null;
}

/** A UID is either a question response or an event's greeting video. */
async function findEventForUid(uid: string): Promise<EventAuthRow | null> {
  const db = supabaseAdmin();
  const { data } = await db
    .from("responses")
    .select(
      "stream_video_uid, questions!inner(event_id, events!inner(owner_clerk_id, respond_token, playback_token, videos_deleted_at))"
    )
    .eq("stream_video_uid", uid)
    .maybeSingle();
  if (data) {
    return (
      data as unknown as { questions: { events: EventAuthRow } }
    ).questions.events;
  }
  const { data: greetingEvent } = await db
    .from("events")
    .select("owner_clerk_id, respond_token, playback_token, videos_deleted_at")
    .eq("greeting_video_uid", uid)
    .maybeSingle();
  return (greetingEvent as EventAuthRow | null) ?? null;
}

/**
 * Mints a short-lived signed playback token for one video UID.
 * Allowed for: the event owner (Clerk), anyone holding the event's
 * playback token (party TV/remote), or the respond token (the groom
 * reviewing his own answers / watching the host's greeting).
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid request.", 400);
  const { uid, playback_token, respond_token, downloadable } = parsed.data;

  const event = await findEventForUid(uid);
  if (!event) return jsonError("Video not found.", 404);

  if (event.videos_deleted_at) {
    return jsonError("This event's videos have been deleted.", 410);
  }

  const { userId } = await auth().catch(() => ({ userId: null }));
  const isOwner = !!userId && userId === event.owner_clerk_id;
  const hasPlaybackToken =
    !!playback_token && playback_token === event.playback_token;
  const hasRespondToken =
    !!respond_token && respond_token === event.respond_token;
  if (!isOwner && !hasPlaybackToken && !hasRespondToken) {
    return jsonError("Not allowed.", 403);
  }

  try {
    // Downloads only for the owner (dashboard download-all fallback).
    const token = await signPlaybackToken(uid, {
      downloadable: downloadable && isOwner,
    });
    return NextResponse.json({ token, urls: playbackUrls(token) });
  } catch {
    return jsonError("Could not sign the playback URL.", 500);
  }
}
