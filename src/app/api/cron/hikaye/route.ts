import { NextRequest, NextResponse } from "next/server";
import { hikayeIstatistikleri, reelsHikayeleri, sozHikayesi } from "../../../../lib/instagram-hikaye";

// INSTAGRAM HİKÂYE tiki — pg_cron 15 dakikada bir (migration 0048). Paylaşım ucuyla aynı anahtar.
// Üçü bağımsız: biri düşerse diğerleri yine çalışır. İstatistik yayından sonra okunur ki yeni hikâye de kaydedilsin.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.PAYLASIM_CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }
  const [soz, reels] = await Promise.allSettled([sozHikayesi(), reelsHikayeleri()]);
  const [istatistik] = await Promise.allSettled([hikayeIstatistikleri()]);
  const yaz = (r: PromiseSettledResult<unknown>) => (r.status === "fulfilled" ? r.value : `hata: ${r.reason}`);
  return NextResponse.json({ ok: true, soz: yaz(soz), reels: yaz(reels), istatistik: yaz(istatistik) });
}
