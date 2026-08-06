import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { verifySvix } from "../../../../lib/svix";

// Resend Inbound (gelen mail/cevap) webhook → ds_inbound_emails.
// from_email → yatırımcı eşleşmesi + son 'invest' mesajıyla ilişkilendirme.
// Kurulum: reply alt-alanına (ör. reply.startupdoktoru.com) MX kaydı + Resend Inbound webhook → bu URL.
// İmza sırrı RESEND_INBOUND_SECRET (yoksa RESEND_WEBHOOK_SECRET'e düşer).

export const runtime = "nodejs";

// "Ad <mail@x>" | "mail@x" | {email,name} | {address,name} → {email,name}
function parseAddr(v: unknown): { email: string | null; name: string | null } {
  if (!v) return { email: null, name: null };
  if (typeof v === "string") {
    const m = v.match(/<([^>]+)>/);
    const email = (m ? m[1] : v).trim().toLowerCase() || null;
    const name = m ? v.replace(/<[^>]+>/, "").replace(/"/g, "").trim() || null : null;
    return { email, name };
  }
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    const email = (typeof o.email === "string" ? o.email : typeof o.address === "string" ? o.address : "").toLowerCase() || null;
    const name = typeof o.name === "string" ? o.name : null;
    return { email, name };
  }
  return { email: null, name: null };
}

export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_INBOUND_SECRET || process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "RESEND_INBOUND_SECRET tanımlı değil." }, { status: 503 });

  const raw = await req.text();
  const ok = verifySvix(secret, {
    id: req.headers.get("svix-id"),
    timestamp: req.headers.get("svix-timestamp"),
    signature: req.headers.get("svix-signature"),
  }, raw);
  if (!ok) return NextResponse.json({ error: "Geçersiz imza." }, { status: 401 });

  let evt: { type?: string; data?: Record<string, unknown> };
  try {
    evt = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Geçersiz gövde." }, { status: 400 });
  }
  // Bu uç yalnız gelen mail olayını işler (yanlış kablolamada çöp kayıt olmasın).
  if (evt.type && evt.type !== "email.received") return NextResponse.json({ ok: true, ignored: evt.type });
  const d = evt.data || {};

  const from = parseAddr(d.from);
  const toRaw = Array.isArray(d.to) ? d.to[0] : d.to;
  const to = parseAddr(toRaw);
  const subject = typeof d.subject === "string" ? d.subject : null;
  const text = typeof d.text === "string" ? d.text : "";
  const preview = text ? text.slice(0, 1000) : null;
  const providerId = (typeof d.email_id === "string" ? d.email_id : typeof d.id === "string" ? d.id : null);

  // Yatırımcı eşleşmesi: from_email birincil adresle eşleşir mi?
  // (email_secondary eşleşmesi 0014 migration canlıya girince eklenebilir.)
  let matchedInvestor: string | null = null;
  if (from.email) {
    const { data: inv } = await supabaseAdmin
      .from("inv_investors")
      .select("id")
      .ilike("email", from.email)
      .limit(1);
    matchedInvestor = inv?.[0]?.id ?? null;
  }

  // Bu adrese giden son 'invest' mesajı (thread ilişkilendirmesi)
  let matchedMessage: string | null = null;
  if (from.email) {
    const { data: msg } = await supabaseAdmin
      .from("ds_email_messages")
      .select("id")
      .eq("context", "invest")
      .eq("to_email", from.email)
      .order("created_at", { ascending: false })
      .limit(1);
    matchedMessage = msg?.[0]?.id ?? null;
  }

  // provider_id benzersiz → tekrar teslimde çakışmayı önle (upsert)
  await supabaseAdmin.from("ds_inbound_emails").upsert(
    [{
      provider_id: providerId,
      from_email: from.email,
      from_name: from.name,
      to_email: to.email,
      subject,
      preview,
      matched_investor_id: matchedInvestor,
      matched_message_id: matchedMessage,
      raw: evt as unknown as Record<string, unknown>,
    }],
    providerId ? { onConflict: "provider_id", ignoreDuplicates: true } : undefined,
  );

  return NextResponse.json({ ok: true, matchedInvestor: !!matchedInvestor });
}
