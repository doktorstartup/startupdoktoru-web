import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabase";
import { verifyAdminPassword } from "../../../../../lib/adminAuth";

// Admin: otomatik paylaşımı aç/kapa (ds_paylasim_ayar). Mevcut durum GET /api/admin/paylasim ile gelir.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const auth = verifyAdminPassword(body.password);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (typeof body.aktif !== "boolean") return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("ds_paylasim_ayar")
    .upsert({ id: true, aktif: body.aktif, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, aktif: body.aktif });
}
