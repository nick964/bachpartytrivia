import "server-only";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/server";
import type { EventRow } from "@/lib/db/types";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireUser(): Promise<
  { userId: string } | { error: NextResponse }
> {
  const { userId } = await auth();
  if (!userId) return { error: jsonError("Sign in to do that.", 401) };
  return { userId };
}

/** Loads an event and verifies the signed-in user owns it. */
export async function getOwnedEvent(
  eventId: string,
  userId: string
): Promise<{ event: EventRow } | { error: NextResponse }> {
  const { data, error } = await supabaseAdmin()
    .from("events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();
  if (error) return { error: jsonError("Could not load event.", 500) };
  if (!data || (data as EventRow).owner_clerk_id !== userId) {
    return { error: jsonError("Event not found.", 404) };
  }
  return { event: data as EventRow };
}
