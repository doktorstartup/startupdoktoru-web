import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { verifyAdminPassword } from "../../../../lib/adminAuth";

// INVEST huni paneli verisi — şifre korumalı.
// E-posta açılma/tıklama oranları + "haftanın girişimi" hunisi (eşleşme→ziyaret→deck→görüşme) + puan + bekleyenler.
export async function GET(req: NextRequest) {
  const auth = verifyAdminPassword(req.nextUrl.searchParams.get("password"));
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  // ── E-posta hunisi (yatırımcı maili) ──
  const { data: emails } = await supabaseAdmin
    .from("ds_email_messages")
    .select("opened_at, clicked_at, created_at")
    .eq("context", "invest")
    .limit(5000);
  const em = emails || [];
  const weekAgo = Date.now() - 7 * 864e5;
  const recent = em.filter((e) => e.created_at && new Date(e.created_at).getTime() >= weekAgo);
  const emailStats = {
    sent: em.length,
    opened: em.filter((e) => e.opened_at).length,
    clicked: em.filter((e) => e.clicked_at).length,
    sent7: recent.length,
    opened7: recent.filter((e) => e.opened_at).length,
    clicked7: recent.filter((e) => e.clicked_at).length,
  };

  // ── Haftanın girişimi hunisi ──
  const { data: pick } = await supabaseAdmin
    .from("inv_startup_profiles")
    .select("id, startup_name")
    .eq("featured", true).eq("status", "approved")
    .order("updated_at", { ascending: false }).limit(1).maybeSingle();

  let funnel = { pick: null as string | null, matched: 0, viewed: 0, deckReaders: 0, requested: 0, skipped: 0, score: 0 };
  if (pick) {
    const { data: ms } = await supabaseAdmin
      .from("inv_matches")
      .select("viewed_at, deck_clicks, investor_action")
      .eq("startup_id", pick.id);
    const m = ms || [];
    const deckReaders = m.filter((x) => (x.deck_clicks || 0) > 0).length;
    const requested = m.filter((x) => x.investor_action === "requested").length;
    funnel = {
      pick: pick.startup_name,
      matched: m.length,
      viewed: m.filter((x) => x.viewed_at).length,
      deckReaders,
      requested,
      skipped: m.filter((x) => x.investor_action === "skipped").length,
      score: deckReaders * 1 + requested * 3,
    };
  }

  // ── Bekleyen görüşme talepleri (tüm girişimler) ──
  const { data: pend } = await supabaseAdmin
    .from("inv_matches")
    .select("id, investor_id, startup_id, action_at")
    .eq("investor_action", "requested")
    .or("meeting_status.is.null,meeting_status.eq.open")
    .order("action_at", { ascending: true }).limit(100);
  const prows = pend || [];
  const invIds = [...new Set(prows.map((r) => r.investor_id))];
  const stIds = [...new Set(prows.map((r) => r.startup_id))];
  const [invRes, stRes] = await Promise.all([
    invIds.length ? supabaseAdmin.from("inv_investors").select("id, firm_name, partner_name, country").in("id", invIds) : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    stIds.length ? supabaseAdmin.from("inv_startup_profiles").select("id, startup_name").in("id", stIds) : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ]);
  const invMap = Object.fromEntries((invRes.data || []).map((i) => [i.id as string, i]));
  const stMap = Object.fromEntries((stRes.data || []).map((s) => [s.id as string, s]));
  const pending = prows.map((r) => ({
    investor: invMap[r.investor_id] || null, startup: stMap[r.startup_id] || null, action_at: r.action_at,
  }));

  // ── Toplamlar ──
  const [intRes, folRes] = await Promise.all([
    supabaseAdmin.from("inv_investors").select("*", { count: "exact", head: true }).not("interest_at", "is", null),
    supabaseAdmin.from("inv_investors").select("*", { count: "exact", head: true }).not("followup_sent_at", "is", null),
  ]);
  const interested = intRes.count || 0;
  const followed = folRes.count || 0;

  return NextResponse.json({ email: emailStats, funnel, pending, totals: { interested, followed } });
}
