import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { verifyMember } from "../../../../lib/memberAuth";

// Yatırımcı deal-flow'u — giriş yapmış ve portala davet edilmiş yatırımcıya özel.
// Kimlik: oturumdaki e-posta = inv_investors.email/email_secondary + portal_enabled.
// Döner: yatırımcının kendi profil özeti + admin'in ona eşleştirdiği ONAYLI girişimler.

export async function GET(req: NextRequest) {
  const { user, error, status } = await verifyMember(req);
  if (!user) return NextResponse.json({ error }, { status });

  const { data: inv } = await supabaseAdmin
    .from("inv_investors")
    .select("id, firm_name, partner_name, role, thesis, sectors, stages, ticket, portal_enabled")
    .or(`email.eq.${user.email},email_secondary.eq.${user.email}`)
    .eq("portal_enabled", true)
    .maybeSingle();

  if (!inv) return NextResponse.json({ investor: null, startups: [] });

  const { data: matches } = await supabaseAdmin
    .from("inv_matches")
    .select("startup_id")
    .eq("investor_id", inv.id);

  const ids = (matches || []).map((m) => m.startup_id);
  let startups: unknown[] = [];
  if (ids.length) {
    const { data } = await supabaseAdmin
      .from("inv_startup_profiles")
      .select("id, startup_name, one_liner, value_prop, deck_url, website, sectors, stage, team_size, city")
      .in("id", ids)
      .eq("status", "approved")
      .order("updated_at", { ascending: false });
    startups = data || [];
  }

  return NextResponse.json({ investor: inv, startups });
}
