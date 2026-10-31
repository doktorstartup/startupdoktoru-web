import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";
import { verifyMember } from "../../../lib/memberAuth";

// Üye profili: telefon var mı (yatırımcı-telefon kartını göstermek için) + telefon kaydet.
// Google ile girenlerden telefon olmaz → kart çıkar; email+şifre kayıtta zaten alınır.
// E-posta istekten değil, doğrulanmış oturumdan gelir (başkasının verisi okunamaz/yazılamaz).

export async function GET(req: NextRequest) {
  const { user, error, status } = await verifyMember(req);
  if (!user) return NextResponse.json({ error }, { status });
  const email = user.email;

  const { data } = await supabaseAdmin
    .from("ds_leads")
    .select("name, phone")
    .ilike("email", email)
    .limit(1);
  const row = data && data[0];
  return NextResponse.json({ hasPhone: !!row?.phone, name: row?.name || "", phone: row?.phone || "" });
}

// phone yoksa: kaydı garantile (Google ile gireni CRM'e al) + hasPhone döndür.
// phone varsa: telefonu kaydet + investor_interest etiketi.
export async function POST(req: NextRequest) {
  const { user, error, status } = await verifyMember(req);
  if (!user) return NextResponse.json({ error }, { status });
  const { name, phone } = await req.json().catch(() => ({}));
  const normEmail = user.email;

  const { data: existing } = await supabaseAdmin
    .from("ds_leads")
    .select("id, phone, tags")
    .ilike("email", normEmail)
    .limit(1);

  if (existing && existing.length > 0) {
    const row = existing[0];
    if (phone) {
      const tags: string[] = row.tags || [];
      if (!tags.includes("investor_interest")) tags.push("investor_interest");
      await supabaseAdmin.from("ds_leads").update({ phone, tags }).eq("id", row.id);
      return NextResponse.json({ ok: true, hasPhone: true });
    }
    return NextResponse.json({ ok: true, hasPhone: !!row.phone });
  }

  // Kayıt yok → oluştur (Google ile giriş = kaydını al)
  await supabaseAdmin.from("ds_leads").insert([
    {
      name: name || normEmail,
      email: normEmail,
      phone: phone || null,
      source: "google",
      status: "NEW",
      score: phone ? 25 : 15,
      stage: "NEW_LEAD",
      tags: phone ? ["investor_interest"] : [],
    },
  ]);
  return NextResponse.json({ ok: true, hasPhone: !!phone });
}
