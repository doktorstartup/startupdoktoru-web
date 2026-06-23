import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { verifyAdminPassword } from "../../../../lib/adminAuth";
import { sendEmail, shell } from "../../../../lib/email";

// Toplu bülten: tüm lead'lere tek seferlik bilgilendirme maili (ör. haftalık startup haberleri).
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://startupdoktoru.com";
const fill = (s: string, name: string) =>
  s.replaceAll("{{name}}", name || "").replaceAll("{{site}}", SITE).replace(/ +([,!.])/g, "$1");

// Alıcı sayısını döndür (UI için)
export async function GET(req: NextRequest) {
  const auth = verifyAdminPassword(req.nextUrl.searchParams.get("password"));
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { count } = await supabaseAdmin.from("ds_leads").select("id", { count: "exact", head: true });
  return NextResponse.json({ count: count || 0 });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const auth = verifyAdminPassword(body.password);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const html = typeof body.body_html === "string" ? body.body_html : "";
  if (!subject || !html) return NextResponse.json({ error: "Konu ve içerik gerekli." }, { status: 400 });

  // Test: sadece tek adrese
  if (body.testEmail) {
    const r = await sendEmail({ to: body.testEmail, subject: fill(subject, "Test"), html: shell(fill(html, "Test")) });
    return NextResponse.json({ ok: true, test: true, sent: r.sent, skipped: r.skipped });
  }

  // Herkese: distinct lead e-postaları
  const { data: leads } = await supabaseAdmin.from("ds_leads").select("email, name").limit(5000);
  const seen = new Set<string>();
  let sent = 0;
  let failed = 0;
  let skipped = false;
  for (const l of leads || []) {
    const email = (l.email || "").trim().toLowerCase();
    if (!email.includes("@") || seen.has(email)) continue;
    seen.add(email);
    const r = await sendEmail({ to: email, subject: fill(subject, l.name || ""), html: shell(fill(html, l.name || "")) });
    if (r.skipped) {
      skipped = true;
      break;
    }
    if (r.sent) sent += 1;
    else failed += 1;
  }
  return NextResponse.json({ ok: true, total: seen.size, sent, failed, skipped });
}
