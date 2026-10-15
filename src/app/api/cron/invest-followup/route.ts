import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { shell, esc } from "../../../../lib/email";
import { sendLogged } from "../../../../lib/mailer";

// INVEST follow-up — her gün: ilgilenen (interest_at) + henüz follow-up gönderilmemiş yatırımcılardan
// "haftanın girişimi"ne (featured) TEZ-UYUMLU olanlara, portal açıp eşleştirip giriş linkiyle şablon gönderir.
// Dedup: inv_investors.followup_sent_at. Biyotek yatırımcıya martech gönderilmez (fit kuralı).
// CRON_SECRET ile korunur. Loglanır (context='invest'); reply-to=inbound → cevaplar panele düşer.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://startupdoktoru.com";
const DAILY_CAP = Math.max(1, Math.min(Number(process.env.INVEST_FOLLOWUP_CAP) || 50, 200));
const BIO = ["biotech", "pharmaceutic", "medical device", "diagnostic"];
const lc = (s: string) => s.toLowerCase();

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Haftanın girişimi (admin'de featured + onaylı)
  const { data: pick } = await supabaseAdmin
    .from("inv_startup_profiles")
    .select("id, startup_name, sectors")
    .eq("featured", true)
    .eq("status", "approved")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!pick) return NextResponse.json({ ok: true, sent: 0, note: "featured girişim yok" });

  // Henüz follow-up gönderilmemiş ilgilenenler
  const { data: pool } = await supabaseAdmin
    .from("inv_investors")
    .select("id, firm_name, partner_name, email, sectors")
    .not("interest_at", "is", null)
    .is("followup_sent_at", null)
    .not("email", "is", null)
    .neq("email", "")
    .limit(1000);

  // Bu girişime görüşme isteyenler (hariç)
  const { data: reqs } = await supabaseAdmin
    .from("inv_matches")
    .select("investor_id")
    .eq("startup_id", pick.id)
    .eq("investor_action", "requested");
  const requested = new Set((reqs || []).map((r) => r.investor_id));

  const ps = (((pick.sectors as string[] | null) || []).map(lc));
  const startupBio = ps.some((s) => BIO.some((b) => s.includes(b)));
  const fit = (secs: string[] = []) => {
    const li = secs.map(lc);
    return li.some((s) => ps.includes(s)) && (startupBio || !li.some((s) => BIO.some((b) => s.includes(b))));
  };

  const replyTo = process.env.RESEND_INBOUND_ADDRESS || undefined;
  let sent = 0, skippedUnfit = 0;

  for (const inv of pool || []) {
    if (sent >= DAILY_CAP) break;
    const email = (inv.email || "").trim().toLowerCase();
    if (!email.includes("@") || requested.has(inv.id)) continue;
    if (!fit(inv.sectors)) { skippedUnfit++; continue; }

    await supabaseAdmin.auth.admin.createUser({ email, email_confirm: true }).catch(() => {});
    const link = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email });
    const th = link.data?.properties?.hashed_token;
    if (!th) continue;
    const actionLink = `${SITE}/en/investor?token_hash=${encodeURIComponent(th)}`;

    await supabaseAdmin.from("inv_investors").update({ portal_enabled: true }).eq("id", inv.id);
    await supabaseAdmin.from("inv_matches").upsert(
      [{ investor_id: inv.id, startup_id: pick.id, created_by: "followup-cron" }],
      { onConflict: "investor_id,startup_id", ignoreDuplicates: true },
    );

    const name = inv.partner_name || inv.firm_name || "there";
    const html = shell(`
      <p>Hi ${esc(name)},</p>
      <p>Thanks for raising your hand. We've set up a private page just for you — and each week we'll add one startup from our network that fits your thesis, so you get a short, curated shortlist instead of a flood.</p>
      <p>This week's pick is <strong>${esc(pick.startup_name)}</strong>. On your page you can review the <strong>pitch deck</strong> and the <strong>valuation</strong>, and if it clicks, just hit <strong>Request a meeting</strong> — we'll find a time so you can get to know the team directly.</p>
      <p><a href="${actionLink}" style="color:#2563eb;font-weight:600">Open your investor page →</a> <span style="color:#6b7280;font-size:13px">(one-tap secure sign-in)</span></p>
      <p>Not a fit? Just skip it — a fresh match comes next week. We keep the bar high and the list short on purpose.</p>
      <p>Best,<br/>Eser · Startup Doktoru</p>
    `);
    const r = await sendLogged(
      { to: email, subject: `This week's pick for your thesis — ${pick.startup_name}`, html, replyTo },
      { context: "invest", contextRef: inv.id, personal: true },
    );
    if (r.skipped) break; // Resend yapılandırılmamış
    if (r.sent) {
      await supabaseAdmin.from("inv_investors").update({ followup_sent_at: new Date().toISOString() }).eq("id", inv.id);
      sent += 1;
    }
  }

  return NextResponse.json({ ok: true, pick: pick.startup_name, sent, skippedUnfit });
}
