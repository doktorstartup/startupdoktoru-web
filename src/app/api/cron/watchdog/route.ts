import { NextRequest, NextResponse } from "next/server";
import { buildDigest } from "../../../../lib/watchdog";
import { notifyAdmin } from "../../../../lib/email";

// BEKÇİ cron — her gün bir kez çalışır, günlük özeti + uyarıları Eser'e mailler.
// Sinyaller (satış, lead, yatırımcı davet/ilgi, gelen yanıt, mail sağlığı) watchdog.ts'te toplanır.
// CRON_SECRET tanımlıysa Authorization: Bearer <secret> şart.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const { subject, html, alertCount } = await buildDigest();
  const res = await notifyAdmin(subject, html);

  return NextResponse.json({ ok: true, alertCount, sent: res.sent, skipped: res.skipped });
}
