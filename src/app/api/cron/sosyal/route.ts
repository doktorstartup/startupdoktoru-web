import { NextRequest, NextResponse } from "next/server";
import { sosyalSenkron } from "../../../../lib/sosyal";

// SOSYAL İSTATİSTİK cron — günde bir kez platform metriklerini SALT OKUR, ds_sosyal_video'ya yazar.
// YouTube + Instagram; biri hata verirse diğeri yine çalışır.
// CRON_SECRET tanımlıysa Authorization: Bearer <secret> şart.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const sonuc = await sosyalSenkron();
  return NextResponse.json(sonuc, { status: sonuc.ok ? 200 : 500 });
}
