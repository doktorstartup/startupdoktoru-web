import { NextRequest, NextResponse } from "next/server";
import { processDue, processWeekly } from "../../../../lib/campaigns";

// Kampanya işleyici (cron). Günlük çalışır:
//  - Her gün: gecikmeli kampanyalar (sepet, takip, ilgi...) → processDue.
//  - Türkiye'de PAZAR ise: haftalık seri (13 hafta) → processWeekly (kişi başı 1 adım).
// Türkiye UTC+3 (sabit). Vercel cron UTC; 07:00 UTC = 10:00 TR. Dakika hassasiyeti gerekmez.
// CRON_SECRET tanımlıysa Authorization: Bearer <secret> şart.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
    }
  }

  const processed = await processDue();

  // Türkiye saatiyle Pazar mı? (UTC+3) → getUTCDay()===0 Pazar
  const trDay = new Date(Date.now() + 3 * 3600000).getUTCDay();
  let weeklySent = 0;
  if (trDay === 0) {
    weeklySent = await processWeekly();
  }

  return NextResponse.json({ ok: true, processed, weeklySent, isSundayTR: trDay === 0 });
}
