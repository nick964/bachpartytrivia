import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { isAdmin } from "@/lib/api/admin";
import { supabaseAdmin } from "@/lib/db/server";
import type { PromoCodeRow } from "@/lib/db/types";
import { PromoCodeAdmin } from "@/components/admin/PromoCodeAdmin";

export const dynamic = "force-dynamic";

/** Admin-only: mint and track single-use premium codes. 404s for everyone else. */
export default async function PromoCodesPage() {
  const { userId } = await auth();
  if (!isAdmin(userId)) notFound();

  const { data, error } = await supabaseAdmin()
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/dashboard"
          className="label-caps text-[10px] text-soft transition hover:text-primary"
        >
          ← All games
        </Link>
        <h1 className="mt-3 font-display text-4xl text-primary">Promo codes</h1>
        <p className="mt-1.5 text-sm italic text-soft">
          Free premium for the people you&apos;re courting. Admin only.
        </p>
      </div>

      {error ? (
        <p className="border border-line bg-raised px-4 py-3 text-sm">
          Could not load codes ({error.message}). Apply the promo_codes
          migration in MIGRATIONS.md.
        </p>
      ) : (
        <PromoCodeAdmin codes={(data ?? []) as PromoCodeRow[]} />
      )}
    </div>
  );
}
