import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabase";
import { verifyAdminPassword } from "../../../../../lib/adminAuth";
import { shell } from "../../../../../lib/email";
import { sendLogged } from "../../../../../lib/mailer";

// Yatırımcı segmentine outreach maili — şifre korumalı.
// KVKK: yalnız address_purpose='outreach_published' + e-postası olan yatırımcılara gider.
// reply-to = RESEND_INBOUND_ADDRESS → cevaplar Resend Inbound ile /api/webhooks/resend-inbound'a düşer.
// Gönderim ds_email_messages'e context='invest', context_ref=investor.id ile loglanır.

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://startupdoktoru.com";
const CAP = 200; // tek seferde üst sınır (deliverability + free-tier koruması)

type Inv = { id: string; firm_name: string; partner_name: string | null; email: string | null };
type Seg = { status?: string; country?: string; sector?: string; stage?: string };

// Resend hata gövdesi JSON döner; okunur mesajı çıkar (teşhis panelde görünsün).
function readable(err?: string): string | undefined {
  if (!err) return undefined;
  try {
    const j = JSON.parse(err) as { message?: string };
    return (j.message || err).slice(0, 300);
  } catch {
    return err.slice(0, 300);
  }
}

function fill(s: string, inv: Inv) {
  const partner = inv.partner_name || "";
  return s
    .replaceAll("{{firm}}", inv.firm_name || "")
    .replaceAll("{{partner}}", partner)
    .replaceAll("{{name}}", partner || inv.firm_name || "")
    .replaceAll("{{site}}", SITE)
    .replace(/ +([,!.])/g, "$1");
}

// Segment için uygun alıcı sayısı (UI önizleme)
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const auth = verifyAdminPassword(sp.get("password"));
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  // Eligibility hard-gate: outreach_published + email dolu
  let q = supabaseAdmin
    .from("inv_investors")
    .select("id", { count: "exact", head: true })
    .eq("address_purpose", "outreach_published")
    .not("email", "is", null)
    .neq("email", "");
  const status = sp.get("status");
  if (status && status !== "all") q = q.eq("status", status);
  const country = sp.get("country");
  if (country) q = q.eq("country", country);
  const sector = sp.get("sector");
  if (sector) q = q.contains("sectors", [sector]);
  const stage = sp.get("stage");
  if (stage) q = q.contains("stages", [stage]);

  const { count } = await q;
  return NextResponse.json({ eligible: count || 0, cap: CAP });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const auth = verifyAdminPassword(body.password);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const html = typeof body.body_html === "string" ? body.body_html : "";
  if (!subject || !html) return NextResponse.json({ error: "Konu ve içerik gerekli." }, { status: 400 });

  const replyTo = process.env.RESEND_INBOUND_ADDRESS || undefined;

  // Test: tek adrese (kayıt context='test')
  if (body.testEmail) {
    const testInv: Inv = { id: "test", firm_name: "Test Firma", partner_name: "Test", email: body.testEmail };
    const r = await sendLogged(
      { to: body.testEmail, subject: fill(subject, testInv), html: shell(fill(html, testInv)), replyTo },
      { context: "test" },
    );
    return NextResponse.json({ ok: true, test: true, sent: r.sent, skipped: r.skipped });
  }

  // 1:1 gönderim: kart üstündeki "Mail at". Admin bilinçli tekil seçim → toplu KVKK kapısını (outreach_published)
  // bypass eder; yalnız geçerli e-posta şart. Loglanır: context='invest'.
  if (body.investorId) {
    const { data } = await supabaseAdmin
      .from("inv_investors")
      .select("id, firm_name, partner_name, email")
      .eq("id", body.investorId)
      .single();
    const inv = data as Inv | null;
    if (!inv) return NextResponse.json({ error: "Yatırımcı bulunamadı." }, { status: 404 });
    const to = (inv.email || "").trim().toLowerCase();
    if (!to.includes("@")) return NextResponse.json({ error: "Bu yatırımcının e-postası yok." }, { status: 400 });
    const r = await sendLogged(
      { to, subject: fill(subject, inv), html: shell(fill(html, inv)), replyTo },
      { context: "invest", contextRef: inv.id },
    );
    return NextResponse.json({ ok: true, sent: r.sent, skipped: r.skipped, suppressed: r.suppressed, error: readable(r.error) });
  }

  const seg: Seg = body.segment || {};
  const limit = Math.min(Number(body.limit) || 50, CAP);

  let q = supabaseAdmin
    .from("inv_investors")
    .select("id, firm_name, partner_name, email")
    .eq("address_purpose", "outreach_published")
    .not("email", "is", null)
    .neq("email", "")
    .limit(limit);
  if (seg.status && seg.status !== "all") q = q.eq("status", seg.status);
  if (seg.country) q = q.eq("country", seg.country);
  if (seg.sector) q = q.contains("sectors", [seg.sector]);
  if (seg.stage) q = q.contains("stages", [seg.stage]);

  const { data } = await q;
  const investors = (data as Inv[]) || [];

  let sent = 0;
  let failed = 0;
  let skipped = false;
  for (const inv of investors) {
    const to = (inv.email || "").trim().toLowerCase();
    if (!to.includes("@")) continue;
    const r = await sendLogged(
      { to, subject: fill(subject, inv), html: shell(fill(html, inv)), replyTo },
      { context: "invest", contextRef: inv.id },
    );
    if (r.skipped) {
      skipped = true;
      break;
    }
    if (r.sent) sent += 1;
    else failed += 1;
  }
  return NextResponse.json({ ok: true, eligible: investors.length, sent, failed, skipped, limit });
}
