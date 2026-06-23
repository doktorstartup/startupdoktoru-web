// Drip kampanya motoru (server).
//  - 'delay' kampanyalar: enroll'da gecikme-0 anında, sonrası processDue (cron) ile.
//  - 'weekly' kampanyalar: her Pazar bir adım (processWeekly). 13 haftalık seri böyle.
// Müşteri olan kişide seri durur. Resend yoksa beklemede kalır.
import { supabaseAdmin } from "./supabase";
import { sendEmail, shell } from "./email";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://startupdoktoru.com";

function fill(s: string, name: string) {
  return s.replaceAll("{{name}}", name || "").replaceAll("{{site}}", SITE).replace(/ +([,!.])/g, "$1");
}

type Step = { delay_minutes: number; subject: string; body_html: string };
type Enrollment = { id: string; campaign_id: string; email: string; name: string | null; enrolled_at: string; sent_steps: number; done: boolean; last_sent_at: string | null };

async function isCustomer(email: string) {
  const { data } = await supabaseAdmin.from("ds_leads").select("status").ilike("email", email).limit(1);
  return data && data[0]?.status === "CUSTOMER";
}

const TRAINING_PRODUCTS = ["investor_training", "startup_giris", "degerleme", "all_access_bundle"];

// Kişi bir EĞİTİM (e-kitap hariç) satın aldı mı? E-kitap upsell serisini durdurmak için.
async function ownsTraining(email: string) {
  const { data } = await supabaseAdmin
    .from("ds_orders")
    .select("product_id")
    .eq("payment_status", "paid")
    .ilike("email", email)
    .in("product_id", TRAINING_PRODUCTS)
    .limit(1);
  return !!(data && data.length > 0);
}

async function weeklyCampaignIds(): Promise<string[]> {
  const { data } = await supabaseAdmin.from("ds_campaigns").select("id").eq("cadence", "weekly");
  return (data || []).map((c) => c.id as string);
}

// Gecikmeli kampanya: zamanı gelen adımları gönder.
export async function processEnrollment(id: string) {
  const { data: e } = await supabaseAdmin.from("ds_campaign_enrollments").select("*").eq("id", id).single<Enrollment>();
  if (!e || e.done) return;
  // Durdurma koşulu kampanya türüne göre değişir:
  //  - ebook_upsell: kişi EĞİTİM alınca dur (e-kitap müşterisi olmak durdurmaz; amacı eğitime yükseltmek).
  //  - diğer kampanyalar: müşteri olunca dur.
  const { data: camp } = await supabaseAdmin
    .from("ds_campaigns").select("trigger_type").eq("id", e.campaign_id).single<{ trigger_type: string }>();
  const stop = camp?.trigger_type === "ebook_upsell" ? await ownsTraining(e.email) : await isCustomer(e.email);
  if (stop) {
    await supabaseAdmin.from("ds_campaign_enrollments").update({ done: true }).eq("id", id);
    return;
  }
  const { data: steps } = await supabaseAdmin
    .from("ds_campaign_steps").select("delay_minutes, subject, body_html").eq("campaign_id", e.campaign_id).order("step_order");
  const list = (steps as Step[]) || [];
  let sent = e.sent_steps;
  const elapsedMin = (Date.now() - new Date(e.enrolled_at).getTime()) / 60000;
  while (sent < list.length) {
    const step = list[sent];
    if (step.delay_minutes > elapsedMin) break;
    const r = await sendEmail({ to: e.email, subject: fill(step.subject, e.name || ""), html: shell(fill(step.body_html, e.name || "")) });
    if (r.skipped) return;
    sent++;
  }
  const done = sent >= list.length;
  if (sent !== e.sent_steps || done) {
    await supabaseAdmin.from("ds_campaign_enrollments").update({ sent_steps: sent, done }).eq("id", id);
  }
}

// Haftalık seri: her çağrıda (Pazar cron) sıradaki TEK adımı gönder.
// last_sent_at ile 6 günden kısa sürede ikinci kez göndermeyi engelle (çift tetik koruması).
export async function processWeekly(limit = 1000) {
  const ids = await weeklyCampaignIds();
  if (ids.length === 0) return 0;
  const { data: pending } = await supabaseAdmin
    .from("ds_campaign_enrollments").select("*").eq("done", false).in("campaign_id", ids).limit(limit);
  let sentCount = 0;
  for (const e of (pending as Enrollment[]) || []) {
    if (e.last_sent_at && Date.now() - new Date(e.last_sent_at).getTime() < 6 * 86400000) continue; // bu hafta gitti
    if (await isCustomer(e.email)) {
      await supabaseAdmin.from("ds_campaign_enrollments").update({ done: true }).eq("id", e.id);
      continue;
    }
    const { data: steps } = await supabaseAdmin
      .from("ds_campaign_steps").select("subject, body_html").eq("campaign_id", e.campaign_id).order("step_order");
    const list = (steps as Step[]) || [];
    if (e.sent_steps >= list.length) {
      await supabaseAdmin.from("ds_campaign_enrollments").update({ done: true }).eq("id", e.id);
      continue;
    }
    const step = list[e.sent_steps];
    const r = await sendEmail({ to: e.email, subject: fill(step.subject, e.name || ""), html: shell(fill(step.body_html, e.name || "")) });
    if (r.skipped) break; // Resend yok
    const nextSent = e.sent_steps + 1;
    await supabaseAdmin
      .from("ds_campaign_enrollments")
      .update({ sent_steps: nextSent, last_sent_at: new Date().toISOString(), done: nextSent >= list.length })
      .eq("id", e.id);
    if (r.sent) sentCount++;
  }
  return sentCount;
}

// Tetik gerçekleşince eşleşen kampanyalara kaydet. Gecikmeli kampanyalarda gecikme-0 anında gider;
// haftalık kampanyalarda ilk adım ilk Pazar gider (anında gönderim yok).
export async function enroll(triggerType: "lead" | "abandoned" | "interest" | "ebook_upsell", triggerValue: string | null, person: { email?: string; name?: string }) {
  const email = (person.email || "").trim().toLowerCase();
  if (!email.includes("@")) return;
  let query = supabaseAdmin.from("ds_campaigns").select("id, cadence").eq("trigger_type", triggerType).eq("enabled", true);
  if (triggerValue) query = query.eq("trigger_value", triggerValue);
  const { data: campaigns } = await query;
  for (const c of campaigns || []) {
    const { data: enr } = await supabaseAdmin
      .from("ds_campaign_enrollments")
      .upsert([{ campaign_id: c.id, email, name: person.name || null }], { onConflict: "campaign_id,email", ignoreDuplicates: true })
      .select("id");
    if (enr && enr.length > 0 && c.cadence !== "weekly") {
      await processEnrollment(enr[0].id);
    }
  }
}

// Cron (gecikmeli kampanyalar): haftalık olmayan bekleyen kayıtları işle.
export async function processDue(limit = 300) {
  const weekly = await weeklyCampaignIds();
  let q = supabaseAdmin.from("ds_campaign_enrollments").select("id").eq("done", false).limit(limit);
  if (weekly.length > 0) q = q.not("campaign_id", "in", `(${weekly.join(",")})`);
  const { data: pending } = await q;
  let processed = 0;
  for (const e of pending || []) {
    await processEnrollment(e.id);
    processed++;
  }
  return processed;
}
