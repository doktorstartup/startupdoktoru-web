import { NextRequest, NextResponse } from "next/server";
import { youtubeSenkron } from "../../../../lib/youtube";

// SOSYAL İSTATİSTİK cron — günde bir kez platform metriklerini SALT OKUR, ds_sosyal_video'ya yazar.
// Şimdilik yalnız YouTube; Instagram sonra eklenecek.
// CRON_SECRET tanımlıysa Authorization: Bearer <secret> şart.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  try {
    const youtube = await youtubeSenkron();
    return NextResponse.json({ ok: true, youtube });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
