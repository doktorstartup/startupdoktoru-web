import { NextRequest, NextResponse } from "next/server";
import { blogPaylas } from "../../../../lib/linkedin-blog";

// LINKEDIN BLOG PAYLAŞIMI — pg_cron her gün 12:00 TR'de çağırır (migration 0044, 0050; linkedin_blog_tetikle).
// Anahtar: paylaşım ucuyla aynı Vault sırrı (PAYLASIM_CRON_SECRET) — tanımsızsa reddeder.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.PAYLASIM_CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }
  try {
    return NextResponse.json({ ok: true, ...(await blogPaylas()) });
  } catch (e) {
    console.error("linkedin-blog", e);
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
