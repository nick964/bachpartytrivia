import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/server";
import { createQuestionSchema } from "@/lib/validation";
import { getOwnedEvent, jsonError, requireUser } from "@/lib/api/guards";

export const FREE_QUESTION_LIMIT = 3;

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if ("error" in user) return user.error;

  const body = await request.json().catch(() => null);
  const parsed = createQuestionSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid input.", 400);
  }
  const { event_id, text, source } = parsed.data;

  const owned = await getOwnedEvent(event_id, user.userId);
  if ("error" in owned) return owned.error;
  const event = owned.event;

  const db = supabaseAdmin();
  const { count, error: countError } = await db
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("event_id", event_id);
  if (countError) return jsonError("Could not check the question count.", 500);

  // Hard server-side free-tier wall — the UI turns this into an upgrade card.
  if (!event.is_premium && (count ?? 0) >= FREE_QUESTION_LIMIT) {
    return NextResponse.json(
      {
        error: `Free events top out at ${FREE_QUESTION_LIMIT} questions. Upgrade to add unlimited.`,
        code: "upgrade_required",
      },
      { status: 402 }
    );
  }

  const { data: maxRow } = await db
    .from("questions")
    .select("sort_order")
    .eq("event_id", event_id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (maxRow?.sort_order ?? 0) + 1;

  const { data: question, error } = await db
    .from("questions")
    .insert({ event_id, text, source, sort_order: nextOrder })
    .select("*")
    .single();
  if (error) return jsonError("Could not add the question.", 500);

  return NextResponse.json({ question }, { status: 201 });
}
