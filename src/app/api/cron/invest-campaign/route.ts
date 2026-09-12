import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { shell } from "../../../../lib/email";
import { sendLogged } from "../../../../lib/mailer";
import { campaignEmail, type Startup } from "../../../../lib/invest-campaign";

// Tier-1 yatırımcı davet kampanyası — her iş günü sıradaki 50 (temaslanmamış) kişiye gider.
// Seçim: tags⊇['tier1'] + address_purpose='outreach_published' + e-posta dolu, inv_outreach'te
// segment='tier1-invite' satırı OLMAYANLAR. Gönderim ds_email_messages'e (context='invest') loglanır;
// inv_outreach'e 'sent' satırı yazılır (dedup). CRON_SECRET ile korunur.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Günlük gönderim tavanı — INVEST_DAILY_CAP env ile ayarlanır (ısıtma için ilk hafta düşük tut).
const DAILY_CAP = Math.max(1, Math.min(Number(process.env.INVEST_DAILY_CAP) || 25, 200));
const SEGMENT = "tier1-invite";

type Inv = { id: string; firm_name: string; partner_name: string | null; email: string | null; country: string | null; sectors: string[] | null; stages: string[] | null; role: string | null };

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const replyTo = process.env.RESEND_INBOUND_ADDRESS || undefined;

  // Portföy girişimleri — sektöre göre eşleştirme için (Creato, GRİSTEK…).
  const { data: startupsData } = await supabaseAdmin
    .from("inv_startups")
    .select("name, disclose_name, descriptor, sectors, stages, one_liner, ask, hero")
    .eq("active", true);
  const startups = (startupsData || []) as Startup[];

  // Uygun tier-1 havuzu (≤2000 — 800'ü rahat kapsar).
  const { data: pool } = await supabaseAdmin
    .from("inv_investors")
    .select("id, firm_name, partner_name, email, country, sectors, stages, role")
    .contains("tags", ["tier1"])
    .eq("address_purpose", "outreach_published")
    .not("email", "is", null)
    .neq("email", "")
    .limit(2000);
  const investors = (pool || []) as Inv[];
  if (!investors.length) return NextResponse.json({ ok: true, sent: 0, note: "tier1 havuzu boş" });

  // Bu kampanyada zaten gönderilenler (dedup).
  const { data: done } = await supabaseAdmin
    .from("inv_outreach")
    .select("investor_id")
    .eq("segment", SEGMENT)
    .limit(50000);
  const sentSet = new Set(((done || []) as { investor_id: string }[]).map((r) => r.investor_id));

  const queue = investors.filter((i) => !sentSet.has(i.id));
  const batch = queue.slice(0, DAILY_CAP);
  if (!batch.length) return NextResponse.json({ ok: true, sent: 0, note: "hepsi gönderildi" });

  let sent = 0;
  let failed = 0;
  let skipped = false;
  for (const inv of batch) {
    const to = (inv.email || "").trim().toLowerCase();
    if (!to.includes("@")) continue;
    const { subject, html } = campaignEmail(inv, startups);
    const r = await sendLogged({ to, subject, html: shell(html), replyTo }, { context: "invest", contextRef: inv.id });

    if (r.skipped) { skipped = true; break; } // Resend kapalı → hiçbir şey gitmedi, ledger'a yazma
    // Gönderildi VEYA engellendi → dedup satırı yaz (tekrar denenmesin). Geçici hata → yazma, yarın tekrar.
    if (r.sent || r.suppressed) {
      await supabaseAdmin.from("inv_outreach").insert([{
        investor_id: inv.id,
        segment: SEGMENT,
        subject,
        status: r.suppressed ? "opted_out" : "sent",
        sent_at: r.sent ? new Date().toISOString() : null,
      }]);
    }
    if (r.sent) sent += 1;
    else if (!r.suppressed) failed += 1;
  }

  return NextResponse.json({ ok: true, sent, failed, skipped, cap: DAILY_CAP, remaining: Math.max(0, queue.length - sent) });
}
