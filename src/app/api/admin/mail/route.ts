import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { verifyAdminPassword } from "../../../../lib/adminAuth";

// Mail izleme paneli verisi — şifre korumalı.
// GET: istatistik kartları + giden mail defteri (filtreli) + gelen cevaplar.
// POST: gelen cevabı "işlendi" işaretle (takibi kaçırmamak için).

const M = () => supabaseAdmin.from("ds_email_messages").select("id", { count: "exact", head: true });
const I = () => supabaseAdmin.from("ds_inbound_emails").select("id", { count: "exact", head: true });

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const auth = verifyAdminPassword(sp.get("password"));
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  // İstatistikler (küçük head-count sorguları)
  const [total, delivered, opened, clicked, bounced, complained, failed, inboundTotal, inboundNew] = await Promise.all([
    M().neq("status", "failed"),
    M().not("delivered_at", "is", null),
    M().not("opened_at", "is", null),
    M().not("clicked_at", "is", null),
    M().eq("status", "bounced"),
    M().eq("status", "complained"),
    M().eq("status", "failed"),
    I(),
    I().eq("handled", false),
  ]).then((rows) => rows.map((r) => r.count || 0));

  // Giden defter (filtreli)
  let q = supabaseAdmin.from("ds_email_messages").select("*").order("created_at", { ascending: false }).limit(300);
  const context = sp.get("context");
  if (context && context !== "all") q = q.eq("context", context);
  const status = sp.get("status");
  if (status && status !== "all") q = q.eq("status", status);
  const search = (sp.get("q") || "").trim();
  if (search) {
    const like = `%${search}%`;
    q = q.or(`to_email.ilike.${like},subject.ilike.${like}`);
  }
  const { data: messages } = await q;

  // Gelen cevaplar (işlenmemiş önce)
  const { data: inbound } = await supabaseAdmin
    .from("ds_inbound_emails")
    .select("*, matched_investor:matched_investor_id (firm_name)")
    .order("handled", { ascending: true })
    .order("received_at", { ascending: false })
    .limit(100);

  return NextResponse.json({
    stats: { total, delivered, opened, clicked, bounced, complained, failed, inboundTotal, inboundNew },
    messages: messages || [],
    inbound: inbound || [],
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const auth = verifyAdminPassword(body.password);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  if (body.action === "mark_handled") {
    if (!body.id) return NextResponse.json({ error: "id gerekli." }, { status: 400 });
    const { error } = await supabaseAdmin
      .from("ds_inbound_emails")
      .update({ handled: body.handled !== false })
      .eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Bilinmeyen işlem." }, { status: 400 });
}
