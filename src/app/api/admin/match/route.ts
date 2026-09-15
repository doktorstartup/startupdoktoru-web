import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { verifyAdminPassword } from "../../../../lib/adminAuth";

// Girişim ↔ yatırımcı manuel eşleştirmesi — şifre korumalı.
// GET: (investorId varsa) o yatırımcının eşleşmeleri, yoksa tüm eşleşmeler.
// POST action add/remove.

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const auth = verifyAdminPassword(sp.get("password"));
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let query = supabaseAdmin.from("inv_matches").select("*").order("created_at", { ascending: false }).limit(2000);
  const investorId = sp.get("investorId");
  if (investorId) query = query.eq("investor_id", investorId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message, matches: [] }, { status: 500 });
  return NextResponse.json({ matches: data || [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const auth = verifyAdminPassword(body.password);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const T = supabaseAdmin.from("inv_matches");
  try {
    if (body.action === "add") {
      if (!body.investor_id || !body.startup_id) {
        return NextResponse.json({ error: "investor_id + startup_id gerekli." }, { status: 400 });
      }
      // Aynı çift tekrar eklenmesin (unique constraint zaten var; upsert ile sessiz geç).
      const { error } = await T.upsert(
        [{ investor_id: body.investor_id, startup_id: body.startup_id, created_by: body.created_by || "eser" }],
        { onConflict: "investor_id,startup_id", ignoreDuplicates: true },
      );
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (body.action === "remove") {
      if (!body.investor_id || !body.startup_id) {
        return NextResponse.json({ error: "investor_id + startup_id gerekli." }, { status: 400 });
      }
      const { error } = await T.delete().eq("investor_id", body.investor_id).eq("startup_id", body.startup_id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Bilinmeyen işlem." }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Hata" }, { status: 500 });
  }
}
