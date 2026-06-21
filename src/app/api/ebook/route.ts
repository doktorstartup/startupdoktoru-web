import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";

// E-kitap erişimi: yalnızca e-kitabı (paid) olan e-postaya kısa ömürlü imzalı URL verir.
// PDF artık public/'te değil; özel Supabase Storage bucket'ında (ebooks/ebook.pdf).
const BUCKET = "ebooks";
const PATH = "ebook.pdf";
const EBOOK_PRODUCT = "ebook_13_steps";

export async function GET(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get("email") || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "E-posta gerekli." }, { status: 400 });
  }

  // Erişim doğrulaması: bu e-postaya ait ödenmiş e-kitap siparişi var mı?
  const { data, error } = await supabaseAdmin
    .from("ds_orders")
    .select("id")
    .eq("payment_status", "paid")
    .eq("product_id", EBOOK_PRODUCT)
    .ilike("email", email)
    .limit(1);

  if (error) {
    console.error("Ebook access query error:", error.message);
    return NextResponse.json({ error: "Erişim doğrulanamadı." }, { status: 500 });
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Bu e-posta için e-kitap erişimi yok." }, { status: 403 });
  }

  // Kısa ömürlü imzalı URL (1 saat). Doğrudan Supabase'den sunulur (Vercel boyut limiti yok).
  const { data: signed, error: sErr } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(PATH, 3600);

  if (sErr || !signed?.signedUrl) {
    console.error("Ebook signed URL error:", sErr?.message);
    return NextResponse.json({ error: "E-kitap şu an açılamıyor." }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl });
}
