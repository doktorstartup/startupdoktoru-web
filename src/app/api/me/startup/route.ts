import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { verifyMember } from "../../../../lib/memberAuth";

// Girişimcinin kendi girişim profili — giriş yapmış üyeye özel (Bearer token).
// Bir üye = bir profil (user_id unique). GET: kendi profilini getir. POST: oluştur/güncelle.
const FIELDS = ["startup_name", "one_liner", "value_prop", "deck_url", "website", "sectors", "stage", "team_size", "city", "product_stage", "valuation"];

export async function GET(req: NextRequest) {
  const { user, error, status } = await verifyMember(req);
  if (!user) return NextResponse.json({ error }, { status });

  const { data, error: dbErr } = await supabaseAdmin
    .from("inv_startup_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  if (data) return NextResponse.json({ profile: data });

  // Profil yoksa: kayıt/lead bilgilerinden ön-doldurma (kullanıcı aynı şeyi tekrar yazmasın).
  const { data: lead } = await supabaseAdmin
    .from("ds_leads")
    .select("name, company, phone")
    .ilike("email", user.email)
    .order("created_at", { ascending: false })
    .limit(1);
  const l = lead?.[0];
  return NextResponse.json({ profile: null, prefill: l ? { name: l.name || "", company: l.company || "", phone: l.phone || "" } : null });
}

export async function POST(req: NextRequest) {
  const { user, error, status } = await verifyMember(req);
  if (!user) return NextResponse.json({ error }, { status });

  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const f of FIELDS) {
    if (body[f] === undefined) continue;
    if (f === "sectors") patch[f] = Array.isArray(body[f]) ? body[f] : [];
    else if (f === "team_size") patch[f] = body[f] === "" || body[f] == null ? null : Number(body[f]) || null;
    else patch[f] = body[f] === "" ? null : body[f];
  }

  try {
    const { data: existing } = await supabaseAdmin
      .from("inv_startup_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      // Statüyü koru: admin onayı burada değişmez (yeniden içerik girişi onaylı satırı düşürmesin).
      const { error: e } = await supabaseAdmin.from("inv_startup_profiles").update(patch).eq("user_id", user.id);
      if (e) throw e;
    } else {
      const { error: e } = await supabaseAdmin
        .from("inv_startup_profiles")
        .insert([{ user_id: user.id, email: user.email, status: "submitted", ...patch }]);
      if (e) throw e;
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Hata" }, { status: 500 });
  }
}
