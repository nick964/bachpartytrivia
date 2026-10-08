import "server-only";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/guards";

function adminIds(): Set<string> {
  return new Set(
    (process.env.ADMIN_CLERK_USER_IDS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

/** True when this Clerk user id is listed in ADMIN_CLERK_USER_IDS. */
export function isAdmin(userId: string | null | undefined): boolean {
  return !!userId && adminIds().has(userId);
}

/** Signed-in AND listed as an admin; otherwise a 404 so the route stays invisible. */
export async function requireAdmin(): Promise<
  { userId: string } | { error: NextResponse }
> {
  const { userId } = await auth();
  if (!isAdmin(userId)) return { error: jsonError("Not found.", 404) };
  return { userId: userId! };
}
