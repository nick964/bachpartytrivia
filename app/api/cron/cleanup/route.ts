import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/server";
import { checkCronAuth } from "@/lib/api/cron";
import { sendDeletionWarningEmail } from "@/lib/email";
import { deleteEventVideos } from "@/lib/stream";
import type { EventRow } from "@/lib/db/types";

const RETENTION_DAYS = 30;
const WARNING_DAYS_BEFORE = 7;

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400_000).toISOString().slice(0, 10);
}

/**
 * Daily video lifecycle:
 * 1. party_date + 23 days passed → "download before they're gone" email (once)
 * 2. party_date + 30 days passed → delete Stream videos, mark event expired
 */
export async function GET(request: NextRequest) {
  const denied = checkCronAuth(request);
  if (denied) return denied;

  const db = supabaseAdmin();
  const out: {
    warned: string[];
    deleted: Array<{ event: string; videos: number }>;
    errors: Array<{ event: string; error: string }>;
  } = { warned: [], deleted: [], errors: [] };

  // 1) deletion warnings
  const { data: warnRows, error: warnError } = await db
    .from("events")
    .select("*")
    .lte("party_date", daysAgo(RETENTION_DAYS - WARNING_DAYS_BEFORE))
    .is("videos_deleted_at", null)
    .is("deletion_warning_sent_at", null)
    .neq("status", "expired");
  if (warnError) {
    return NextResponse.json(
      { error: `Query failed (${warnError.message}) — apply MIGRATIONS.md.` },
      { status: 500 }
    );
  }
  for (const event of (warnRows ?? []) as EventRow[]) {
    try {
      await sendDeletionWarningEmail(event);
      await db
        .from("events")
        .update({ deletion_warning_sent_at: new Date().toISOString() })
        .eq("id", event.id);
      out.warned.push(event.id);
    } catch (e) {
      out.errors.push({ event: event.id, error: (e as Error).message });
    }
  }

  // 2) deletions
  const { data: expireRows } = await db
    .from("events")
    .select("*")
    .lte("party_date", daysAgo(RETENTION_DAYS))
    .is("videos_deleted_at", null);
  for (const event of (expireRows ?? []) as EventRow[]) {
    try {
      const count = await deleteEventVideos(event.id);
      await db
        .from("events")
        .update({
          videos_deleted_at: new Date().toISOString(),
          status: "expired",
        })
        .eq("id", event.id);
      out.deleted.push({ event: event.id, videos: count });
    } catch (e) {
      out.errors.push({ event: event.id, error: (e as Error).message });
    }
  }

  return NextResponse.json(out);
}
