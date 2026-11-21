import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { aksamYayini } from "../../../../../scripts/haber/aksam.mjs";

// AKŞAM HABER YAYINI — pg_cron her gün 18:30 TR'de çağırır (migration 0040, haber_aksam_tetikle).
// O günün haberlerini toplar, en iyi 3'ünü Gemini ile yazar, 19:00 TR'ye taslak olarak kuyruğa koyar.
// Anahtar: paylaşım ucuyla aynı Vault sırrı (PAYLASIM_CRON_SECRET) — tanımsızsa reddeder.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.PAYLASIM_CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }
  // Kalıcı kayıt (migration 0051): satır başta açılır; ok null kalırsa çalışma yarıda kesilmiştir. Bekçi okur.
  const { data: kayit } = await supabaseAdmin.from("ds_haber_aksam_log").insert({}).select("id").single();
  const bitir = async (alan: { ok: boolean; yazilan?: number; sonuc: unknown }) => {
    if (kayit) await supabaseAdmin.from("ds_haber_aksam_log").update({ ...alan, bitti_at: new Date().toISOString() }).eq("id", kayit.id);
  };
  try {
    const sonuc = await aksamYayini({ db: supabaseAdmin, log: console.log });
    console.log("haber-aksam", JSON.stringify(sonuc));
    await bitir({ ok: true, yazilan: sonuc.yazilan.length, sonuc });
    return NextResponse.json({ ok: true, ...sonuc });
  } catch (e) {
    console.error("haber-aksam", e);
    await bitir({ ok: false, sonuc: { error: (e as Error).message } });
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
