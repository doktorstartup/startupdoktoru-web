import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";

// İngilizce baskı ilgi kaydı. Kitap Türkçe olduğu için /en tarafında satış yok;
// önce talep ölçülüyor. Aynı e-posta iki kez gelirse sessizce yok sayılır —
// kullanıcıya yine başarı döner, iki kez yazmasının bir anlamı yok.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();

  if (!email || !email.includes("@") || email.length > 320) {
    return NextResponse.json({ error: "Geçerli bir e-posta gerekli." }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("ds_ebook_en_interest")
    .upsert([{ email }], { onConflict: "email", ignoreDuplicates: true });

  if (error) {
    console.error("Ebook EN interest error:", error.message);
    return NextResponse.json({ error: "Kayıt alınamadı." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
