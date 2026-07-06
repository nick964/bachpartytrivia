import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/server";
import { updateEventSchema } from "@/lib/validation";
import { getOwnedEvent, jsonError, requireUser } from "@/lib/api/guards";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if ("error" in user) return user.error;
  const { id } = await params;
  const owned = await getOwnedEvent(id, user.userId);
  if ("error" in owned) return owned.error;
  return NextResponse.json({ event: owned.event });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if ("error" in user) return user.error;
  const { id } = await params;
  const owned = await getOwnedEvent(id, user.userId);
  if ("error" in owned) return owned.error;

  const body = await request.json().catch(() => null);
  const parsed = updateEventSchema.safeParse(body);
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return jsonError("Nothing valid to update.", 400);
  }

  const { data, error } = await supabaseAdmin()
    .from("events")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return jsonError("Could not save changes.", 500);
  return NextResponse.json({ event: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser();
  if ("error" in user) return user.error;
  const { id } = await params;
  const owned = await getOwnedEvent(id, user.userId);
  if ("error" in owned) return owned.error;

  // Best-effort Stream cleanup before the rows cascade away.
  const { deleteEventVideos } = await import("@/lib/stream");
  await deleteEventVideos(id).catch(() => {});

  const { error } = await supabaseAdmin().from("events").delete().eq("id", id);
  if (error) return jsonError("Could not delete the event.", 500);
  return NextResponse.json({ ok: true });
}
