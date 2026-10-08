import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/server";
import { jsonError } from "@/lib/api/guards";
import { requireAdmin } from "@/lib/api/admin";

/**
 * Admin only: delete an unredeemed code. Redeemed codes are the audit trail
 * for who got free premium, so they stay.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if ("error" in admin) return admin.error;
  const { id } = await params;

  const { data, error } = await supabaseAdmin()
    .from("promo_codes")
    .delete()
    .eq("id", id)
    .is("redeemed_at", null)
    .select("id")
    .maybeSingle();
  if (error) return jsonError("Could not delete the code.", 500);
  if (!data) {
    return jsonError("Code not found, or it's already been redeemed.", 404);
  }
  return NextResponse.json({ ok: true });
}
