import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabase";
import { verifyAdminPassword } from "../../../../../lib/adminAuth";
import { TIKTOK_DONUS } from "../../../../../lib/paylasim-platform";

// Admin: TikTok hesap yetkisini başlatır. Dönüş: ./geri (anahtarları ds_paylasim_ayar'a yazar).
// TikTok uygulamasında Login Kit + Content Posting API ürünleri ve bu dönüş adresi kayıtlı olmalı.
// Şimdilik yalnız taslak yükleme izni (video.upload) istenir.

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const auth = verifyAdminPassword(body.password);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const istemci = process.env.TIKTOK_CLIENT_KEY;
  if (!istemci || !process.env.TIKTOK_CLIENT_SECRET) {
    return NextResponse.json({ error: "TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET tanımlı değil." }, { status: 503 });
  }

  // Tek kullanımlık: dönüş ucu yalnız bu değerle gelen isteği kabul eder.
  const state = randomUUID();
  const { error } = await supabaseAdmin.from("ds_paylasim_ayar").update({ tiktok_state: state }).eq("id", true);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const url = new URL("https://www.tiktok.com/v2/auth/authorize/");
  url.search = new URLSearchParams({
    client_key: istemci,
    response_type: "code",
    scope: "user.info.basic,video.upload",
    redirect_uri: TIKTOK_DONUS,
    state,
  }).toString();
  return NextResponse.json({ url: url.toString() });
}
