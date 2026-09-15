import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabase";
import { verifyAdminPassword } from "../../../../../lib/adminAuth";
import { shell } from "../../../../../lib/email";
import { sendLogged } from "../../../../../lib/mailer";

// Yatırımcıyı portala davet et: portal_enabled aç + sihirli link (magic link) e-postala.
// Sihirli linki Supabase üretir (göndermez); biz kendi Resend'imizle İngilizce yollarız.
// İşlem maili (transactional) → opt-out'a tabi değil, kişisel modda gönderilir.

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://startupdoktoru.com";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const auth = verifyAdminPassword(body.password);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!body.investorId) return NextResponse.json({ error: "investorId gerekli." }, { status: 400 });

  const { data: inv } = await supabaseAdmin
    .from("inv_investors")
    .select("id, firm_name, partner_name, email")
    .eq("id", body.investorId)
    .single();
  if (!inv) return NextResponse.json({ error: "Yatırımcı bulunamadı." }, { status: 404 });

  const email = (inv.email || "").trim().toLowerCase();
  if (!email.includes("@")) return NextResponse.json({ error: "Bu yatırımcının e-postası yok." }, { status: 400 });

  // Auth kullanıcısını garantile (yoksa oluştur). Zaten varsa hatayı yut.
  const created = await supabaseAdmin.auth.admin.createUser({ email, email_confirm: true });
  if (created.error && !/already|registered|exists/i.test(created.error.message)) {
    return NextResponse.json({ error: `Kullanıcı oluşturulamadı: ${created.error.message}` }, { status: 500 });
  }

  // Tek kullanımlık giriş linki üret (göndermeden). Yatırımcı /en/investor'a düşer.
  const link = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${SITE}/en/investor` },
  });
  const actionLink = link.data?.properties?.action_link;
  if (link.error || !actionLink) {
    return NextResponse.json({ error: `Link üretilemedi: ${link.error?.message || "bilinmiyor"}` }, { status: 500 });
  }

  const name = inv.partner_name || inv.firm_name || "there";
  const html = shell(`
    <p>Hi ${name},</p>
    <p>Thanks for your interest. We've opened a private deal-flow area where you can review the startups from our community that match your thesis — each with a one-line pitch, value proposition, team size and deck.</p>
    <p><a href="${actionLink}" style="color:#2563eb;font-weight:600">Sign in to your investor area →</a></p>
    <p style="font-size:13px;color:#6b7280">This is a one-time secure link for ${email}. If you didn't expect this, you can ignore it.</p>
  `);

  const r = await sendLogged(
    { to: email, subject: "Your Startup Doktoru investor access", html },
    { context: "transactional", contextRef: inv.id, personal: true },
  );

  await supabaseAdmin
    .from("inv_investors")
    .update({ portal_enabled: true, invited_at: new Date().toISOString() })
    .eq("id", inv.id);

  return NextResponse.json({ ok: true, sent: r.sent, skipped: r.skipped, error: r.error });
}
