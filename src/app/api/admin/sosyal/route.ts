import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { verifyAdminPassword } from "../../../../lib/adminAuth";
import { sosyalSenkron } from "../../../../lib/sosyal";

// Admin: platformdan okunan video istatistikleri (salt okuma).
// GET = kayıtlı metrikler; POST = şimdi senkronla (cron'u beklemeden).
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const auth = verifyAdminPassword(req.nextUrl.searchParams.get("password"));
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data, error } = await supabaseAdmin
    .from("ds_sosyal_video")
    .select("*")
    .order("yayin_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ videolar: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const auth = verifyAdminPassword(body.password);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const sonuc = await sosyalSenkron();
  const hata = [sonuc.youtube, sonuc.instagram]
    .map((r, i) => (r && typeof r === "object" && "hata" in r ? `${i ? "Instagram" : "YouTube"}: ${r.hata}` : null))
    .filter(Boolean)
    .join(" · ");
  return NextResponse.json(hata ? { ...sonuc, error: hata } : sonuc, { status: hata ? 500 : 200 });
}
