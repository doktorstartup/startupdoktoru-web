import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { verifySvix } from "../../../../lib/svix";

// Resend GİDEN mail olayları → ds_email_messages durumunu günceller.
// Olaylar: email.sent/delivered/delivery_delayed/opened/clicked/bounced/complained.
// data.email_id, gönderimde sakladığımız provider_id ile eşleşir.
// Kurulum: Resend panelinde webhook → bu URL; imza sırrı RESEND_WEBHOOK_SECRET'e.

export const runtime = "nodejs";

// Durum ilerleme sırası — geriye düşürmeyiz (delivered'dan sonra 'sent' gelirse yok sayılır).
const RANK: Record<string, number> = { queued: 0, sent: 1, delivered: 2, opened: 3, clicked: 4 };

export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "RESEND_WEBHOOK_SECRET tanımlı değil." }, { status: 503 });

  const raw = await req.text();
  const ok = verifySvix(secret, {
    id: req.headers.get("svix-id"),
    timestamp: req.headers.get("svix-timestamp"),
    signature: req.headers.get("svix-signature"),
  }, raw);
  if (!ok) return NextResponse.json({ error: "Geçersiz imza." }, { status: 401 });

  let evt: { type?: string; data?: { email_id?: string } };
  try {
    evt = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Geçersiz gövde." }, { status: 400 });
  }

  const emailId = evt.data?.email_id;
  const type = evt.type || "";
  if (!emailId) return NextResponse.json({ ok: true, ignored: "email_id yok" });

  const { data: msg } = await supabaseAdmin
    .from("ds_email_messages")
    .select("id, status, open_count, click_count, opened_at, clicked_at")
    .eq("provider_id", emailId)
    .single<{ id: string; status: string; open_count: number; click_count: number; opened_at: string | null; clicked_at: string | null }>();
  if (!msg) return NextResponse.json({ ok: true, ignored: "kayıt yok" }); // takip edilmeyen mail → yok say

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {};
  const advance = (to: string) => {
    if ((RANK[msg.status] ?? 0) < (RANK[to] ?? 0)) patch.status = to;
  };

  switch (type) {
    case "email.delivered":
      patch.delivered_at = now;
      advance("delivered");
      break;
    case "email.opened":
      patch.open_count = (msg.open_count || 0) + 1;
      if (!msg.opened_at) patch.opened_at = now; // ilk açılmayı sabitle
      advance("opened");
      break;
    case "email.clicked":
      patch.click_count = (msg.click_count || 0) + 1;
      if (!msg.clicked_at) patch.clicked_at = now; // ilk tıklamayı sabitle
      advance("clicked");
      break;
    case "email.bounced":
      patch.status = "bounced";
      patch.bounced_at = now;
      break;
    case "email.complained":
      patch.status = "complained";
      patch.complained_at = now;
      break;
    default:
      return NextResponse.json({ ok: true, ignored: type }); // sent / delivery_delayed vb. → durum zaten 'sent'
  }

  await supabaseAdmin.from("ds_email_messages").update(patch).eq("id", msg.id);
  return NextResponse.json({ ok: true });
}
