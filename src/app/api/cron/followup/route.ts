import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { sendEmail, followupEmail } from "../../../../lib/email";

// Takip otomasyonu (Vercel Cron — günlük). 2-5 gün önce kaydolmuş ama müşteri
// olmamış lead'lere bir kez hatırlatma maili atar ('followup_sent' tag'i ile idempotent).
// CRON_SECRET tanımlıysa Authorization: Bearer <secret> şart.

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
    }
  }

  const now = Date.now();
  const from = new Date(now - 5 * 86400000).toISOString(); // 5 gün önce
  const to = new Date(now - 2 * 86400000).toISOString(); // 2 gün önce

  const { data: leads, error } = await supabaseAdmin
    .from("ds_leads")
    .select("id, name, email, status, tags")
    .neq("status", "CUSTOMER")
    .gte("created_at", from)
    .lte("created_at", to)
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let sent = 0;
  for (const lead of leads || []) {
    const tags: string[] = lead.tags || [];
    if (tags.includes("followup_sent")) continue;
    if (!lead.email || !lead.email.includes("@")) continue;

    const { subject, html } = followupEmail(lead.name || undefined);
    const r = await sendEmail({ to: lead.email, subject, html });
    if (r.skipped) break; // Resend anahtarı yok — boşuna döngüye girme

    await supabaseAdmin
      .from("ds_leads")
      .update({ tags: [...tags, "followup_sent"] })
      .eq("id", lead.id);
    if (r.sent) sent += 1;
  }

  return NextResponse.json({ ok: true, candidates: leads?.length || 0, sent });
}
