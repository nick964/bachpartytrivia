import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/server";
import { checkCronAuth } from "@/lib/api/cron";
import { sendReminderEmail } from "@/lib/email";
import {
  embeddedRows,
  type EventRow,
  type ResponseRow,
} from "@/lib/db/types";

/**
 * Daily: events still waiting on recordings with the party ≤5 days out get
 * one (and only one) nudge email to the host.
 */
export async function GET(request: NextRequest) {
  const denied = checkCronAuth(request);
  if (denied) return denied;

  const db = supabaseAdmin();
  const inFiveDays = new Date(Date.now() + 5 * 86400_000)
    .toISOString()
    .slice(0, 10);

  const { data: events, error } = await db
    .from("events")
    .select("*")
    .eq("status", "awaiting_responses")
    .lte("party_date", inFiveDays)
    .is("reminder_sent_at", null)
    .is("videos_deleted_at", null);
  if (error) {
    // Most likely the reminder_sent_at column is missing.
    return NextResponse.json(
      { error: `Query failed (${error.message}) — apply MIGRATIONS.md.` },
      { status: 500 }
    );
  }

  const results: Array<{ event: string; sent: boolean; reason?: string }> = [];
  for (const event of (events ?? []) as EventRow[]) {
    const { data: questions } = await db
      .from("questions")
      .select("id, responses(status)")
      .eq("event_id", event.id);
    const total = questions?.length ?? 0;
    const done = (questions ?? []).filter((q) =>
      embeddedRows(q.responses as ResponseRow | ResponseRow[] | null).some(
        (r) => r.status === "ready"
      )
    ).length;

    if (total === 0 || done >= total) {
      results.push({ event: event.id, sent: false, reason: "complete" });
      continue;
    }
    try {
      await sendReminderEmail(event, done, total);
      await db
        .from("events")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", event.id);
      results.push({ event: event.id, sent: true });
    } catch (e) {
      results.push({
        event: event.id,
        sent: false,
        reason: (e as Error).message,
      });
    }
  }

  return NextResponse.json({ checked: events?.length ?? 0, results });
}
