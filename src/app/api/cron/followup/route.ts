import { NextRequest, NextResponse } from "next/server";
import { processDue } from "../../../../lib/campaigns";

// Kampanya işleyici (cron). Bekleyen tüm kayıtlarda zamanı gelen adımları gönderir.
// Çalışma sıklığı = zamanlama hassasiyeti. Vercel günlük cron → gün hassasiyeti.
// Dakika/saat için bu endpoint'i daha sık tetikle (ücretsiz harici cron, ör. cron-job.org).
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
  return NextResponse.json({ ok: true, processed });
}
