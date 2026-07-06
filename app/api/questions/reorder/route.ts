import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/server";
import { reorderQuestionsSchema } from "@/lib/validation";
import { getOwnedEvent, jsonError, requireUser } from "@/lib/api/guards";

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if ("error" in user) return user.error;

  const body = await request.json().catch(() => null);
  const parsed = reorderQuestionsSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid reorder payload.", 400);
  const { event_id, ordered_ids } = parsed.data;

  const owned = await getOwnedEvent(event_id, user.userId);
  if ("error" in owned) return owned.error;

  const db = supabaseAdmin();
  const { data: existing, error } = await db
    .from("questions")
    .select("id")
    .eq("event_id", event_id);
  if (error) return jsonError("Could not load questions.", 500);

  const existingIds = new Set((existing ?? []).map((q) => q.id));
  if (
    ordered_ids.length !== existingIds.size ||
    !ordered_ids.every((id) => existingIds.has(id))
  ) {
    return jsonError("Question list is out of date — refresh and retry.", 409);
  }

  // sort_order is unique per event, so move everything out of the way
  // first (negative temps), then write the final order.
  for (const [i, id] of ordered_ids.entries()) {
    const { error: e } = await db
      .from("questions")
      .update({ sort_order: -(i + 1) })
      .eq("id", id);
    if (e) return jsonError("Could not reorder questions.", 500);
  }
  for (const [i, id] of ordered_ids.entries()) {
    const { error: e } = await db
      .from("questions")
      .update({ sort_order: i + 1 })
      .eq("id", id);
    if (e) return jsonError("Could not reorder questions.", 500);
  }

  return NextResponse.json({ ok: true });
}
