import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { verifyAdminPassword } from "../../../../lib/adminAuth";
import { youtubeSenkron } from "../../../../lib/youtube";

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

  try {
    return NextResponse.json({ youtube: await youtubeSenkron() });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
