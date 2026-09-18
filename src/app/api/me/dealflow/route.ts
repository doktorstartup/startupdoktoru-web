import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { verifyMember } from "../../../../lib/memberAuth";

// Yatırımcı deal-flow'u — giriş yapmış ve portala davet edilmiş yatırımcıya özel.
// Kimlik: oturumdaki e-posta = inv_investors.email/email_secondary + portal_enabled.
// GET: yatırımcının profili + eşleştirilen ONAYLI girişimler (geçilenler hariç), her birinde aksiyon.
// POST: bir girişim için "requested" (görüşme talebi) / "skipped" (geç) kaydı.

async function findInvestor(email: string) {
  const { data } = await supabaseAdmin
    .from("inv_investors")
    .select("id, firm_name, partner_name, role, thesis, sectors, stages, ticket, portal_enabled")
    .or(`email.eq.${email},email_secondary.eq.${email}`)
    .eq("portal_enabled", true)
    .maybeSingle();
  return data;
}

export async function GET(req: NextRequest) {
  const { user, error, status } = await verifyMember(req);
  if (!user) return NextResponse.json({ error }, { status });

  const inv = await findInvestor(user.email);
  if (!inv) return NextResponse.json({ investor: null, startups: [] });

  const { data: matches } = await supabaseAdmin
    .from("inv_matches")
    .select("id, startup_id, investor_action, viewed_at")
    .eq("investor_id", inv.id);

  const rows = matches || [];
  // İzlenme analizi: ilk görüntülemede viewed_at damgala (fire-and-forget).
  const unseen = rows.filter((m) => !m.viewed_at).map((m) => m.id);
  if (unseen.length) supabaseAdmin.from("inv_matches").update({ viewed_at: new Date().toISOString() }).in("id", unseen).then(() => {});

  // Geçilenler (skipped) listede gösterilmez.
  const actionByStartup = new Map(rows.map((m) => [m.startup_id, m.investor_action]));
  const ids = rows.filter((m) => m.investor_action !== "skipped").map((m) => m.startup_id);

  let startups: Record<string, unknown>[] = [];
  if (ids.length) {
    const { data } = await supabaseAdmin
      .from("inv_startup_profiles")
      .select("id, startup_name, one_liner, value_prop, deck_url, website, sectors, stage, team_size, city, product_stage, valuation")
      .in("id", ids)
      .eq("status", "approved")
      .order("updated_at", { ascending: false });
    startups = (data || []).map((s) => ({ ...s, action: actionByStartup.get(s.id) || null }));
  }

  return NextResponse.json({ investor: inv, startups });
}

export async function POST(req: NextRequest) {
  const { user, error, status } = await verifyMember(req);
  if (!user) return NextResponse.json({ error }, { status });

  const body = await req.json().catch(() => ({}));
  if (!body.startup_id || !["requested", "skipped"].includes(body.action)) {
    return NextResponse.json({ error: "startup_id + geçerli action gerekli." }, { status: 400 });
  }

  const inv = await findInvestor(user.email);
  if (!inv) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const patch: Record<string, unknown> = { investor_action: body.action, action_at: new Date().toISOString() };
  if (body.action === "skipped") {
    patch.skip_reason = typeof body.reason === "string" && body.reason.trim() ? body.reason.trim().slice(0, 300) : null;
  }
  const { error: dbErr } = await supabaseAdmin
    .from("inv_matches")
    .update(patch)
    .eq("investor_id", inv.id)
    .eq("startup_id", body.startup_id);
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
