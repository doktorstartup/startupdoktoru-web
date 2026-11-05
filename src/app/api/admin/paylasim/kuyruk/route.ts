import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabase";
import { verifyAdminPassword } from "../../../../../lib/adminAuth";

// Admin: paylaşım kuyruğu işlemleri. 24 saat kuralı veritabanında (paylasim_iptal).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const auth = verifyAdminPassword(body.password);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id, islem, platform } = body;
  if (typeof id !== "string") return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });

  if (islem === "iptal") {
    const { data, error } = await supabaseAdmin.rpc("paylasim_iptal", { p_id: id });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Yayına 24 saatten az kaldı, iptal edilemez." }, { status: 409 });
    return NextResponse.json({ ok: true });
  }

  if (islem === "kuyruga_al") {
    const { data, error } = await supabaseAdmin.rpc("paylasim_kuyruga_al", { p_id: id });
    if (error) return NextResponse.json({ error: error.message }, { status: 409 });
    return NextResponse.json({ ok: true, yayin_at: data });
  }

  if (islem === "yeniden_dene" && (platform === "shorts" || platform === "instagram")) {
    const { data: v, error } = await supabaseAdmin.from("ds_paylasim").select("yayin").eq("id", id).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const s = v.yayin?.[platform];
    if (s?.durum !== "hata") return NextResponse.json({ error: "Bu platform hata durumunda değil." }, { status: 409 });
    // Kayıtlı oturum/container/id korunur: yeniden deneme önce onların durumunu sorar.
    const yama = { durum: s.oturum || s.container || s.id ? "isleniyor" : "bekliyor", deneme: 0, hata: null, kilit: null };
    const r = await supabaseAdmin.rpc("paylasim_yama", { p_id: id, p_platform: platform, p_yama: yama, p_link: null });
    if (r.error) return NextResponse.json({ error: r.error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
}
