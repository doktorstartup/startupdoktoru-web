// BEKÇİ — günlük durum özeti + gözden kaçanları proaktif uyarı.
// Kural-tabanlı (deterministik): son 24 saatin sinyallerini toplar, "dikkat" durumlarını işaretler.
// Amaç: Eser başka bir işe odaklanırken satış/yatırımcı/mail-sağlığı tarafında hiçbir şey kaçmasın.
// Yalnız service-role okur (inv_* + ds_* admin tabloları). CRON_SECRET'li route'tan tetiklenir.
import { supabaseAdmin } from "./supabase";

const SEGMENT = "tier1-invite";
const since24h = () => new Date(Date.now() - 24 * 3600000).toISOString();

type Digest = { subject: string; html: string; alertCount: number };

export async function buildDigest(): Promise<Digest> {
  const since = since24h();
  const alerts: string[] = []; // ⚠️ dikkat gerektiren, aksiyon bekleyen durumlar
  const lines: string[] = []; // bilgi satırları (günlük özet)

  // ── Satış & gelir (24s) ── yalnız bizim satışlarımız (product_id dolu, amount>0)
  const { data: sales } = await supabaseAdmin
    .from("ds_orders")
    .select("email, amount, product_id, created_at")
    .eq("payment_status", "paid")
    .not("product_id", "is", null)
    .gte("created_at", since);
  const paidSales = (sales || []).filter((o) => Number(o.amount || 0) > 0);
  const revenue = paidSales.reduce((s, o) => s + Number(o.amount || 0), 0);
  lines.push(`💰 <b>Satış (24s):</b> ${paidSales.length} adet · $${revenue.toFixed(0)}`);

  // ── Yeni lead + sepeti bırakan (24s) ── (head+exact: satır çekmeden sayım)
  const { count: newLeads } = await supabaseAdmin
    .from("ds_leads").select("id", { count: "exact", head: true }).gte("created_at", since);
  lines.push(`👤 <b>Yeni lead (24s):</b> ${newLeads || 0}`);
  const { count: abandoned } = await supabaseAdmin
    .from("ds_leads").select("id", { count: "exact", head: true })
    .neq("status", "CUSTOMER").contains("tags", ["checkout_started"]).gte("created_at", since);
  if ((abandoned || 0) > 0) lines.push(`🛒 <b>Sepeti bırakan (24s):</b> ${abandoned}`);

  // ── Yatırımcı davet kampanyası ──
  const { count: investSent24h } = await supabaseAdmin
    .from("inv_outreach").select("id", { count: "exact", head: true })
    .eq("segment", SEGMENT).not("sent_at", "is", null).gte("sent_at", since);
  const { count: investSentTotal } = await supabaseAdmin
    .from("inv_outreach").select("id", { count: "exact", head: true })
    .eq("segment", SEGMENT).not("sent_at", "is", null);
  const { count: poolCount } = await supabaseAdmin
    .from("inv_investors").select("id", { count: "exact", head: true })
    .contains("tags", ["tier1"]).eq("address_purpose", "outreach_published").not("email", "is", null).neq("email", "");
  const remaining = Math.max(0, (poolCount || 0) - (investSentTotal || 0));
  const sent24 = investSent24h || 0;
  lines.push(`📨 <b>Yatırımcı davet:</b> bugün ${sent24} · toplam ${investSentTotal || 0}/${poolCount || 0} · kalan ${remaining}`);

  // ⚠️ Hafta içi olup 0 davet gittiyse kampanya durmuş olabilir (cron bozuk?)
  const trDay = new Date(Date.now() + 3 * 3600000).getUTCDay(); // 1-5 = hafta içi
  if (trDay >= 1 && trDay <= 5 && sent24 === 0 && remaining > 0) {
    alerts.push(`Bugün hiç davet maili gitmedi ama gönderilecek ${remaining} kişi var — cron/gönderim durmuş olabilir.`);
  }

  // ⚠️ İlgilenen yatırımcılar — özellikle son 24 saatte gelen ilgi ACİL takip ister
  const { data: interested } = await supabaseAdmin
    .from("inv_investors")
    .select("firm_name, partner_name, email, interest_at")
    .not("interest_at", "is", null)
    .order("interest_at", { ascending: false })
    .limit(10);
  const interestedList = interested || [];
  const newInterest = interestedList.filter((i) => i.interest_at && i.interest_at >= since);
  if (interestedList.length) {
    lines.push(`⭐ <b>İlgilenen yatırımcı (toplam):</b> ${interestedList.length}`);
  }
  if (newInterest.length) {
    const who = newInterest.map((i) => `${i.partner_name || i.firm_name} (${i.email || "-"})`).join(", ");
    alerts.push(`Son 24 saatte ${newInterest.length} yatırımcı ilgilendi — hemen dönülmeli: ${who}`);
  }

  // ⚠️ Yanıtlanmamış gelen mailler (yatırımcı cevapları triage bekliyor)
  const { data: inbound } = await supabaseAdmin
    .from("ds_inbound_emails")
    .select("from_email, subject, received_at")
    .eq("handled", false)
    .order("received_at", { ascending: false })
    .limit(10);
  const inboundList = inbound || [];
  if (inboundList.length) {
    const who = inboundList.slice(0, 5).map((m) => m.from_email || "?").join(", ");
    alerts.push(`${inboundList.length} yanıt işlenmeyi bekliyor (gözden kaçmasın): ${who}`);
  }

  // ⚠️ Mail sağlığı (24s) — şikayet/bounce deliverability'i (dolayısıyla tüm mailleri) tehdit eder
  const { data: msgs } = await supabaseAdmin
    .from("ds_email_messages")
    .select("status")
    .gte("created_at", since);
  const m = msgs || [];
  const sent = m.length;
  const bounced = m.filter((x) => x.status === "bounced").length;
  const complained = m.filter((x) => x.status === "complained").length;
  if (sent > 0) {
    const bounceRate = (bounced / sent) * 100;
    lines.push(`📬 <b>Mail (24s):</b> ${sent} gönderim · ${bounced} bounce · ${complained} şikayet`);
    if (complained > 0) alerts.push(`${complained} spam şikayeti geldi — domain itibarını korumak için gönderimi gözden geçir.`);
    if (sent >= 20 && bounceRate > 5) alerts.push(`Bounce oranı yüksek (%${bounceRate.toFixed(1)}) — liste kalitesi/ısıtma kontrol edilmeli.`);
  }

  // ── Özet mail derle ──
  const dateStr = new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10);
  const alertBlock = alerts.length
    ? `<div style="background:#fef2f2;border-left:3px solid #dc2626;padding:10px 14px;margin:0 0 14px">
         <p style="margin:0 0 6px;color:#991b1b"><b>⚠️ ${alerts.length} durum dikkat istiyor:</b></p>
         <ul style="margin:0;padding-left:18px;color:#7f1d1d">${alerts.map((a) => `<li style="margin:0 0 4px">${a}</li>`).join("")}</ul>
       </div>`
    : `<p style="color:#059669;margin:0 0 14px">✅ Dikkat gerektiren bir durum yok. Her şey yolunda.</p>`;

  const html = `${alertBlock}
    <p style="margin:0 0 6px"><b>Günlük özet — ${dateStr}</b></p>
    <ul style="margin:0;padding-left:18px;color:#374151">${lines.map((l) => `<li style="margin:0 0 4px">${l}</li>`).join("")}</ul>
    <p style="margin:16px 0 0"><a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://startupdoktoru.com"}/admin">/admin panelini aç →</a></p>`;

  const subject = alerts.length
    ? `⚠️ ${alerts.length} dikkat + günlük özet (${dateStr})`
    : `🩺 Günlük özet (${dateStr}) — her şey yolunda`;

  return { subject, html, alertCount: alerts.length };
}
