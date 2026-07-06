import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/db/server";
import { getOwnedEvent, jsonError, requireUser } from "@/lib/api/guards";
import {
  enableDownload,
  playbackUrls,
  signPlaybackToken,
} from "@/lib/stream";
import { embeddedRows, type ResponseRow } from "@/lib/db/types";

const bodySchema = z.object({ event_id: z.string().uuid() });

/**
 * Download-all fallback for bad party wifi: kicks off MP4 renditions on
 * Stream for every answered question and returns signed download links.
 * Owner only.
 */
export async function POST(request: NextRequest) {
  const user = await requireUser();
  if ("error" in user) return user.error;

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid request.", 400);

  const owned = await getOwnedEvent(parsed.data.event_id, user.userId);
  if ("error" in owned) return owned.error;
  if (owned.event.videos_deleted_at) {
    return jsonError("This event's videos have been deleted.", 410);
  }

  const { data: questions } = await supabaseAdmin()
    .from("questions")
    .select("id, text, sort_order, responses(*)")
    .eq("event_id", parsed.data.event_id)
    .order("sort_order", { ascending: true });

  const items: Array<{
    question: string;
    status: "ready" | "preparing" | "missing" | "error";
    url?: string;
    percent?: number;
  }> = [];

  for (const q of questions ?? []) {
    const response = embeddedRows(
      q.responses as ResponseRow | ResponseRow[] | null
    )[0];
    const uid = response?.stream_video_uid;
    if (!uid || response.status !== "ready") {
      items.push({ question: q.text, status: "missing" });
      continue;
    }
    try {
      const dl = await enableDownload(uid);
      const token = await signPlaybackToken(uid, {
        downloadable: true,
        ttlSeconds: 60 * 60 * 24,
      });
      items.push({
        question: q.text,
        status: dl.default.status === "ready" ? "ready" : "preparing",
        percent: dl.default.percentComplete,
        url: playbackUrls(token).mp4Download,
      });
    } catch {
      items.push({ question: q.text, status: "error" });
    }
  }

  return NextResponse.json({ items });
}
