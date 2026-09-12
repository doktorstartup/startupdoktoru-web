// INVEST — ilgi (interest) yakalama + otomatik profil.
// "İlgileniyorum" bağlantısı imzalıdır (HMAC): kimse başkası adına ilgi işaretleyemez.
// Sır: UNSUBSCRIBE_SECRET (yoksa service-role) — ek env gerektirmez (suppression ile aynı desen).
import crypto from "crypto";
import { supabaseAdmin } from "./supabase";
import { notifyAdmin, esc } from "./email";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://startupdoktoru.com";

function secret() {
  return process.env.UNSUBSCRIBE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

export function interestToken(id: string): string {
  return crypto.createHmac("sha256", secret()).update(`interest:${id}`).digest("hex").slice(0, 32);
}

export function verifyInterestToken(id: string, token: string): boolean {
  if (!token) return false;
  const expected = Buffer.from(interestToken(id));
  const got = Buffer.from(token);
  return expected.length === got.length && crypto.timingSafeEqual(expected, got);
}

// Maildeki "İlgileniyorum" CTA hedefi.
export function interestUrl(id: string): string {
  return `${SITE}/api/invest/interest?i=${encodeURIComponent(id)}&t=${interestToken(id)}`;
}

type InvRow = {
  id: string; firm_name: string; partner_name: string | null;
  email: string | null; tags: string[] | null; interest_at: string | null;
};

// İlgi işareti (link tıklaması): yatırımcıyı 'interested' yap → otomatik profil.
// tags += 'interested', interest_at set; inv_outreach 'interested'; ilk seferde ekibe bildir.
export async function markInterested(investorId: string, source: "link"): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("inv_investors")
    .select("id, firm_name, partner_name, email, tags, interest_at")
    .eq("id", investorId)
    .single();
  const inv = data as InvRow | null;
  if (!inv) return false;

  const tags = Array.isArray(inv.tags) ? [...inv.tags] : [];
  if (!tags.includes("interested")) tags.push("interested");
  const firstTime = !inv.interest_at;
  const nowIso = new Date().toISOString();

  await supabaseAdmin
    .from("inv_investors")
    .update({ tags, interest_at: inv.interest_at || nowIso, updated_at: nowIso })
    .eq("id", investorId);

  // Kampanya outreach satırını 'interested' yap; yoksa oluştur.
  const { data: rows } = await supabaseAdmin
    .from("inv_outreach")
    .select("id")
    .eq("investor_id", investorId)
    .order("prepared_at", { ascending: false })
    .limit(1);
  if (rows && rows.length) {
    await supabaseAdmin.from("inv_outreach").update({ status: "interested", replied_at: nowIso }).eq("id", rows[0].id);
  } else {
    await supabaseAdmin.from("inv_outreach").insert([
      { investor_id: investorId, segment: "tier1-invite", status: "interested", replied_at: nowIso, notes: `ilgi (${source})` },
    ]);
  }

  if (firstTime) {
    const who = esc(inv.partner_name || inv.firm_name || inv.email || "?");
    await notifyAdmin(
      `Yatırımcı ilgilendi: ${who}`,
      `<p><b>${who}</b>${inv.firm_name ? ` — ${esc(inv.firm_name)}` : ""} platforma ilgi gösterdi.</p>
       <p>E-posta: ${esc(inv.email || "-")}</p>
       <p>Pipeline: <a href="${SITE}/admin/invest?interested=1">/admin/invest?interested=1</a></p>`,
    );
  }
  return true;
}

// Yanıt (inbound) geldiğinde: outreach 'replied' (ilgi işaretini ezmez) + ekibe bildir.
// Yanıt her zaman ilgi değildir ("çıkar" olabilir) → profili OTOMATİK oluşturmuyoruz; insan triage eder.
export async function noteInvestorReply(investorId: string, fromEmail: string | null, preview: string | null): Promise<void> {
  const { data: rows } = await supabaseAdmin
    .from("inv_outreach")
    .select("id, status")
    .eq("investor_id", investorId)
    .order("prepared_at", { ascending: false })
    .limit(1);
  if (rows && rows.length && rows[0].status !== "interested") {
    await supabaseAdmin.from("inv_outreach").update({ status: "replied", replied_at: new Date().toISOString() }).eq("id", rows[0].id);
  }
  await notifyAdmin(
    `Yatırımcı yanıtı: ${esc(fromEmail || "?")}`,
    `<p>Bir yatırımcı outreach'e <b>yanıt verdi</b>.</p>
     <p style="color:#4b5563">${esc((preview || "").slice(0, 400))}</p>
     <p>Panel: <a href="${SITE}/admin/mail">/admin/mail</a></p>`,
  );
}
