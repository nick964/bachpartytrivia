import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/server";
import { getOwnedEvent, jsonError, requireUser } from "@/lib/api/guards";

/**
 * "Send to [honoree]" — flips the event into awaiting_responses and
 * returns the respond link. Idempotent for re-sends.
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
  const event = owned.event;

  if (event.status === "expired") {
    return jsonError("This event has expired.", 400);
  }

  const db = supabaseAdmin();
  const { count } = await db
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("event_id", id);
  if (!count) {
    return jsonError("Add at least one question before sending.", 400);
  }

  if (event.status === "draft") {
    const { error } = await db
      .from("events")
      .update({ status: "awaiting_responses" })
      .eq("id", id);
    if (error) return jsonError("Could not update the event.", 500);
  }

  return NextResponse.json({
    respond_url: `${process.env.NEXT_PUBLIC_APP_URL}/respond/${event.respond_token}`,
  });
}
