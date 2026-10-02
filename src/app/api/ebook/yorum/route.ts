import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { verifyMember } from "../../../../lib/memberAuth";
import { KITAP_URUNLERI } from "../../../../lib/trainings";

// Kitap yorumları.
//   GET  ?yayinda=1  → herkese açık: onaylı + yayın izinli yorumlar (satış sayfası)
//   GET              → üye: kendi yorumu var mı (okuyucu kartını bir daha gösterme)
//   POST             → üye: yorum bırak / güncelle. Kitaba erişimi olmalı.
// Kimlik oturumdan gelir; ad, kitap siparişindeki customer_name'den.

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("yayinda") === "1") {
    const { data, error } = await supabaseAdmin
      .from("ds_kitap_yorumlari")
      .select("ad, meslek, puan, yorum")
      .eq("durum", "onayli")
      .eq("yayin_izni", true)
      .order("updated_at", { ascending: false })
      .limit(30);
    if (error) return NextResponse.json({ yorumlar: [] });
    return NextResponse.json({ yorumlar: data });
  }

  const { user, error, status } = await verifyMember(req);
  if (!user) return NextResponse.json({ error }, { status });
  const { data } = await supabaseAdmin.from("ds_kitap_yorumlari").select("id").eq("email", user.email).maybeSingle();
  return NextResponse.json({ var: !!data });
}

export async function POST(req: NextRequest) {
  const { user, error, status } = await verifyMember(req);
  if (!user) return NextResponse.json({ error }, { status });

  const govde = await req.json().catch(() => ({}));
  const puan = Number(govde.puan);
  const yorum = typeof govde.yorum === "string" ? govde.yorum.trim().slice(0, 2000) : "";
  const meslek = typeof govde.meslek === "string" ? govde.meslek.trim().slice(0, 120) : "";
  if (!Number.isInteger(puan) || puan < 1 || puan > 5) {
    return NextResponse.json({ error: "Puan 1-5 arası olmalı." }, { status: 400 });
  }
  if (yorum.length < 10) {
    return NextResponse.json({ error: "Biraz daha yazar mısın?" }, { status: 400 });
  }

  const { data: siparisler } = await supabaseAdmin
    .from("ds_orders")
    .select("customer_name")
    .eq("payment_status", "paid")
    .in("product_id", KITAP_URUNLERI)
    .ilike("email", user.email)
    .order("created_at", { ascending: false });
  if (!siparisler || siparisler.length === 0) {
    return NextResponse.json({ error: "Bu hesap için kitap erişimi yok." }, { status: 403 });
  }
  const ad = siparisler.map((s) => (s.customer_name || "").trim()).find(Boolean) || null;

  // Güncellenen yorum yeniden onaya düşer: onaylanmış metin habersizce değişmesin.
  const { error: yErr } = await supabaseAdmin.from("ds_kitap_yorumlari").upsert(
    {
      email: user.email,
      ad,
      meslek: meslek || null,
      puan,
      yorum,
      yayin_izni: govde.yayinIzni === true,
      durum: "bekliyor",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "email" },
  );
  if (yErr) {
    console.error("Kitap yorumu kaydı:", yErr.message);
    return NextResponse.json({ error: "Kaydedilemedi, biraz sonra tekrar dene." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
