import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../../lib/supabase";
import { TIKTOK_DONUS } from "../../../../../../lib/paylasim-platform";
import { tiktokAnahtarAl } from "../../../../../../lib/paylasim-yayin";

// TikTok yetki dönüşü. Şifre taşımaz: kimlik, ../route'un yazdığı tek kullanımlık state ile doğrulanır.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const don = (sonuc: string) => NextResponse.redirect(new URL(`/admin/paylasim?tiktok=${sonuc}`, req.nextUrl.origin));
  const { code, state } = Object.fromEntries(req.nextUrl.searchParams);
  if (!code || !state) return don("hata");

  // State'i okuyup aynı anda siler: ikinci kez kullanılamaz.
  const { data: ayar } = await supabaseAdmin.from("ds_paylasim_ayar").update({ tiktok_state: null }).eq("tiktok_state", state).select("id");
  if (!ayar?.length) return don("hata");

  try {
    await tiktokAnahtarAl({ grant_type: "authorization_code", code, redirect_uri: TIKTOK_DONUS });
    return don("ok");
  } catch (e) {
    console.error("tiktok-geri", e);
    return don("hata");
  }
}
