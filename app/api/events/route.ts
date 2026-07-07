import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/server";
import { createEventSchema } from "@/lib/validation";
import { jsonError, requireUser } from "@/lib/api/guards";

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if ("error" in user) return user.error;

  const body = await request.json().catch(() => null);
  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? "Invalid input.",
      400
    );
  }

  const db = supabaseAdmin();
  const { data: event, error } = await db
    .from("events")
    .insert({
      ...parsed.data,
      // Recorder defaults to the honoree's opposite unless the host says so.
      responder_role:
        parsed.data.responder_role ??
        (parsed.data.honoree_role === "bride" ? "groom" : "bride"),
      owner_clerk_id: user.userId,
    })
    .select("*")
    .single();
  if (error) return jsonError("Could not create the event.", 500);

  // One playback_state row per event drives TV mode later.
  await db.from("playback_state").insert({ event_id: event.id });

  return NextResponse.json({ event }, { status: 201 });
}
