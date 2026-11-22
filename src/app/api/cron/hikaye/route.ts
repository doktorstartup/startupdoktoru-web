import { NextRequest, NextResponse } from "next/server";
import { hikayeIstatistikleri, reelsHikayeleri, sozHikayesi, sozLinkedin } from "../../../../lib/instagram-hikaye";
import { carouselLinkedin, carouselPaylas } from "../../../../lib/instagram-carousel";

// INSTAGRAM HİKÂYE tiki — pg_cron 15 dakikada bir (migration 0048). Paylaşım ucuyla aynı anahtar.
// Adımlar bağımsız (Instagram söz hikâyesi, LinkedIn söz gönderisi, Reels hikâyesi, kaydırmalı post): biri düşerse diğerleri yine çalışır. İstatistik yayından sonra okunur ki yeni hikâye de kaydedilsin.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.PAYLASIM_CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }
  const [soz, reels, linkedin, carousel, carouselLi] = await Promise.allSettled([sozHikayesi(), reelsHikayeleri(), sozLinkedin(), carouselPaylas(), carouselLinkedin()]);
  const [istatistik] = await Promise.allSettled([hikayeIstatistikleri()]);
  const yaz = (r: PromiseSettledResult<unknown>) => (r.status === "fulfilled" ? r.value : `hata: ${r.reason}`);
  return NextResponse.json({ ok: true, soz: yaz(soz), linkedin: yaz(linkedin), reels: yaz(reels), carousel: yaz(carousel), carouselLinkedin: yaz(carouselLi), istatistik: yaz(istatistik) });
}
