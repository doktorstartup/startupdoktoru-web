import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { verifyAdminPassword } from "../../../../lib/adminAuth";

// Admin: kitap yorumlarını listele ve onayla/reddet.
// Sitede yalnız durum='onayli' VE yayin_izni=true olanlar görünür.

export async function GET(req: NextRequest) {
  const auth = verifyAdminPassword(req.nextUrl.searchParams.get("password"));
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data, error } = await supabaseAdmin
    .from("ds_kitap_yorumlari")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ yorumlar: data });
}

export async function PATCH(req: NextRequest) {
  const { password, id, durum } = await req.json().catch(() => ({}));
  const auth = verifyAdminPassword(password);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!["onayli", "reddedildi", "bekliyor"].includes(durum) || typeof id !== "string") {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("ds_kitap_yorumlari").update({ durum }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
