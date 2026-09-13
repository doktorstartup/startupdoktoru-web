import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";

// Üyeye ait dijital dosyalar: kısa ömürlü imzalı URL verir. Dosyalar public/'te
// değil, özel Supabase Storage bucket'ında.
//
// İki belge var, erişim kuralları ayrı:
//
//   kitap  → basılı kitabın dijital sürümü. E-kitabı satın alanlara açık.
//   sunum  → eğitimlerde ders olarak anlatılan sunum/slayt dosyası. Hem e-kitabı
//            alanlara (geçmişte satın aldıkları içerik buydu) hem de herhangi bir
//            video eğitimi alanlara açık — eğitimin kendi materyali.
const BUCKET = "ebooks";

const BELGELER = {
  // ebook.pdf tarihsel isim: bu dosya en baştan beri sunum/slayt içeriğiydi.
  // Yerinde bırakıldı ki geçmiş alıcıların erişimi hiç kesilmesin.
  sunum: {
    path: "ebook.pdf",
    urunler: ["ebook_13_steps", "investor_training", "startup_giris", "degerleme", "all_access_bundle"],
  },
  kitap: {
    path: "kitap.pdf",
    urunler: ["ebook_13_steps"],
  },
} as const;

type BelgeAdi = keyof typeof BELGELER;

export async function GET(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get("email") || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "E-posta gerekli." }, { status: 400 });
  }

  // Varsayılan 'sunum': parametresiz gelen eski istemci, bugüne kadar eriştiği
  // dosyayı almaya devam etsin.
  const istenen = (req.nextUrl.searchParams.get("dosya") || "sunum") as BelgeAdi;
  const belge = BELGELER[istenen];
  if (!belge) return NextResponse.json({ error: "Geçersiz dosya." }, { status: 400 });

  // Erişim doğrulaması: bu e-postaya ait, belgeyi açan ödenmiş sipariş var mı?
  const { data, error } = await supabaseAdmin
    .from("ds_orders")
    .select("id")
    .eq("payment_status", "paid")
    .in("product_id", belge.urunler as unknown as string[])
    .ilike("email", email)
    .limit(1);

  if (error) {
    console.error("Ebook access query error:", error.message);
    return NextResponse.json({ error: "Erişim doğrulanamadı." }, { status: 500 });
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Bu e-posta için erişim yok." }, { status: 403 });
  }

  // Kısa ömürlü imzalı URL (1 saat). Doğrudan Supabase'den sunulur (Vercel boyut limiti yok).
  const { data: signed, error: sErr } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(belge.path, 3600);

  if (sErr || !signed?.signedUrl) {
    // Dosya henüz yüklenmediyse bunu ayrı bir kodla bildir: portal o belgeyi
    // hiç göstermesin, "açılamıyor" hatası vermesin.
    console.error("Ebook signed URL error:", sErr?.message);
    return NextResponse.json({ error: "Dosya henüz yüklenmedi.", kod: "yok" }, { status: 404 });
  }

  return NextResponse.json({ url: signed.signedUrl });
}
