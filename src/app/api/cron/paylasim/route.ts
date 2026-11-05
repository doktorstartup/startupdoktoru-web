import { NextRequest, NextResponse } from "next/server";
import { kuyrukCalistir } from "../../../../lib/paylasim-yayin";

// OTOMATİK PAYLAŞIM tiki — pg_cron 5 dakikada bir, yalnız vadesi gelen video varken çağırır.
// Her tik platform başına tek aşama ilerletir; tekrar çalışması güvenlidir.
// Yayın yapan uç: CRON_SECRET tanımsızsa da reddeder. PAYLASIM_AKTIF=1 değilse hiçbir şey yapmaz.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }
  if (process.env.PAYLASIM_AKTIF !== "1") return NextResponse.json({ ok: true, pasif: true });

  return NextResponse.json({ ok: true, ...(await kuyrukCalistir()) });
}
