import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../../lib/supabase";
import { LINKEDIN_DONUS } from "../../../../../../lib/paylasim-platform";

// LinkedIn yetki dönüşü. Şifre taşımaz: kimlik, ../route'un yazdığı tek kullanımlık state ile doğrulanır.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const don = (sonuc: string) => NextResponse.redirect(new URL(`/admin/paylasim?linkedin=${sonuc}`, req.nextUrl.origin));
  const { code, state } = Object.fromEntries(req.nextUrl.searchParams);
  if (!code || !state) return don("hata");

  // State'i okuyup aynı anda siler: ikinci kez kullanılamaz.
  const { data: ayar } = await supabaseAdmin.from("ds_paylasim_ayar").update({ linkedin_state: null }).eq("linkedin_state", state).select("id");
  if (!ayar?.length) return don("hata");

  const t = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: LINKEDIN_DONUS,
      client_id: process.env.LINKEDIN_CLIENT_ID || "",
      client_secret: process.env.LINKEDIN_CLIENT_SECRET || "",
    }),
  });
  const anahtar = await t.json().catch(() => null);
  if (!t.ok || !anahtar?.access_token) return don("hata");

  const k = await fetch("https://api.linkedin.com/v2/userinfo", { headers: { Authorization: `Bearer ${anahtar.access_token}` } });
  const kisi = (await k.json().catch(() => null))?.sub;
  if (!k.ok || !kisi) return don("hata");

  const { error } = await supabaseAdmin
    .from("ds_paylasim_ayar")
    .update({
      linkedin_token: anahtar.access_token,
      linkedin_kisi: kisi,
      linkedin_bitis: new Date(Date.now() + anahtar.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);
  return don(error ? "hata" : "ok");
}
