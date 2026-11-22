import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabase";
import { verifyAdminPassword } from "../../../../../lib/adminAuth";
import { BUCKET } from "../../../../../lib/paylasim-yayin";

// Admin: kaydırmalı post kuyruğu (ds_carousel_kuyruk) — salt okunur. Gönderim: lib/instagram-carousel.ts.
// Sıradakiler + son 7 günde çıkanlar.
export async function GET(req: NextRequest) {
  const auth = verifyAdminPassword(req.nextUrl.searchParams.get("password"));
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data, error } = await supabaseAdmin
    .from("ds_carousel_kuyruk")
    .select("id, baslik, yayin_at, durum, link, hata, gorsel_yollar, linkedin_metin, linkedin_durum, linkedin_link, linkedin_hata")
    .gte("yayin_at", new Date(Date.now() - 7 * 86400000).toISOString())
    .order("yayin_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const url = (yol: string) => supabaseAdmin.storage.from(BUCKET).getPublicUrl(yol).data.publicUrl;
  const postlar = (data || []).map(({ gorsel_yollar, linkedin_metin, ...s }) => ({
    ...s,
    gorsel: (gorsel_yollar as string[] | null)?.length || 0,
    kapak: (gorsel_yollar as string[] | null)?.[0] ? url((gorsel_yollar as string[])[0]) : null,
    linkedin: !!linkedin_metin,
  }));
  return NextResponse.json({ postlar });
}
