import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { verifyAdminPassword } from "../../../../lib/adminAuth";

// Admin: kısa video paylaşım takibi (Instagram / Shorts / LinkedIn).
// Paylaşım elle işaretlenir; burada otomatik gönderim yok.

const ALANLAR = ["baslik", "durum", "notlar", "efektler", "ham_link", "kurgu_link", "hedef_tarih", "platformlar"];

const temizle = (body: Record<string, unknown>) => {
  const kayit: Record<string, unknown> = {};
  for (const k of ALANLAR) if (k in body) kayit[k] = body[k] === "" ? null : body[k];
  return kayit;
};

export async function GET(req: NextRequest) {
  const auth = verifyAdminPassword(req.nextUrl.searchParams.get("password"));
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data, error } = await supabaseAdmin
    .from("ds_paylasim")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ videolar: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const auth = verifyAdminPassword(body.password);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (typeof body.baslik !== "string" || !body.baslik.trim()) {
    return NextResponse.json({ error: "Başlık gerekli." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.from("ds_paylasim").insert(temizle(body)).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ video: data });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const auth = verifyAdminPassword(body.password);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (typeof body.id !== "string") return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("ds_paylasim")
    .update({ ...temizle(body), updated_at: new Date().toISOString() })
    .eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const auth = verifyAdminPassword(body.password);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (typeof body.id !== "string") return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });

  const { error } = await supabaseAdmin.from("ds_paylasim").delete().eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
