import { NextRequest, NextResponse } from "next/server";
import { enroll } from "../../../lib/campaigns";
import { supabaseAdmin } from "../../../lib/supabase";

// Yeni üye → lead'i garantile + 'lead' tetikli kampanyalara kaydet (Karşılama gecikme 0 anında gider).
// Idempotent: hem email+şifre hem Google akışından çağrılabilir; lead/enrollment çift oluşmaz.
export async function POST(req: NextRequest) {
  try {
    const { email, name, source } = await req.json();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const normEmail = email.trim().toLowerCase();

    // Lead yoksa oluştur (özellikle Google ile girenler CRM'e düşsün).
    const { data: existing } = await supabaseAdmin
      .from("ds_leads")
      .select("id")
      .ilike("email", normEmail)
      .limit(1);
    if (!existing || existing.length === 0) {
      await supabaseAdmin.from("ds_leads").insert([
        {
          name: typeof name === "string" && name ? name : normEmail,
          email: normEmail,
          source: typeof source === "string" && source ? source : "signup",
          status: "NEW",
          score: 15,
          stage: "NEW_LEAD",
        },
      ]);
    }

    await enroll("lead", null, { email: normEmail, name: typeof name === "string" ? name : undefined });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
