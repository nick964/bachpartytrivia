import { randomInt } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/db/server";
import { jsonError } from "@/lib/api/guards";
import { requireAdmin } from "@/lib/api/admin";
import { PROMO_CODE_LENGTH } from "@/lib/promo";

// No 0/O/1/I — codes get read aloud and typed from texts.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(): string {
  let out = "";
  for (let i = 0; i < PROMO_CODE_LENGTH; i++) {
    out += ALPHABET[randomInt(ALPHABET.length)];
  }
  return out;
}

const bodySchema = z.object({
  count: z.number().int().min(1).max(50).default(1),
  note: z.string().trim().max(120).optional(),
});

/** Admin only: list every code, newest first. */
export async function GET() {
  const admin = await requireAdmin();
  if ("error" in admin) return admin.error;

  const { data, error } = await supabaseAdmin()
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    return jsonError(
      `Could not load codes (${error.message}) — apply MIGRATIONS.md.`,
      500
    );
  }
  return NextResponse.json({ codes: data ?? [] });
}

/** Admin only: mint `count` fresh single-use codes with an optional note. */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if ("error" in admin) return admin.error;

  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid request.", 400);
  const { count, note } = parsed.data;

  const rows = Array.from({ length: count }, () => ({
    code: randomCode(),
    note: note || null,
    created_by_clerk_id: admin.userId,
  }));

  const { data, error } = await supabaseAdmin()
    .from("promo_codes")
    .insert(rows)
    .select("*");
  if (error) {
    // 32^8 codes — a unique collision is astronomically unlikely, but
    // surface it rather than silently minting fewer.
    return jsonError(`Could not create codes (${error.message}).`, 500);
  }
  return NextResponse.json({ codes: data }, { status: 201 });
}
