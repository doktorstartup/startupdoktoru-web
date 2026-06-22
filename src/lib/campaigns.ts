// Drip kampanya motoru (server). enroll() tetikte kişiyi kaydeder; processEnrollment/processDue
// zamanı gelen adımları gönderir. Müşteri olan kişide seri durur. Resend yoksa beklemede kalır.
import { supabaseAdmin } from "./supabase";
import { sendEmail, shell } from "./email";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://startupdoktoru.com";

function fill(s: string, name: string) {
  return s.replaceAll("{{name}}", name || "").replaceAll("{{site}}", SITE).replace(/ +([,!.])/g, "$1");
}

type Step = { delay_minutes: number; subject: string; body_html: string };
type Enrollment = { id: string; campaign_id: string; email: string; name: string | null; enrolled_at: string; sent_steps: number; done: boolean };

// Tek bir kaydı işle: zamanı gelen adımları gönder.
export async function processEnrollment(id: string) {
  const { data: e } = await supabaseAdmin.from("ds_campaign_enrollments").select("*").eq("id", id).single<Enrollment>();
  if (!e || e.done) return;

  // Müşteri olduysa seriyi durdur (satın aldıysa pazarlama maili atma).
  const { data: lead } = await supabaseAdmin.from("ds_leads").select("status").ilike("email", e.email).limit(1);
  if (lead && lead[0]?.status === "CUSTOMER") {
    await supabaseAdmin.from("ds_campaign_enrollments").update({ done: true }).eq("id", id);
    return;
  }

  const { data: steps } = await supabaseAdmin
    .from("ds_campaign_steps")
    .select("delay_minutes, subject, body_html")
    .eq("campaign_id", e.campaign_id)
    .order("step_order");
  const list = (steps as Step[]) || [];

  let sent = e.sent_steps;
  const elapsedMin = (Date.now() - new Date(e.enrolled_at).getTime()) / 60000;

  while (sent < list.length) {
    const step = list[sent];
    if (step.delay_minutes > elapsedMin) break; // zamanı gelmedi
    const r = await sendEmail({ to: e.email, subject: fill(step.subject, e.name || ""), html: shell(fill(step.body_html, e.name || "")) });
    if (r.skipped) return; // Resend yok → adımı işaretleme, sonra gider
    sent++;
  }

  const done = sent >= list.length;
  if (sent !== e.sent_steps || done) {
    await supabaseAdmin.from("ds_campaign_enrollments").update({ sent_steps: sent, done }).eq("id", id);
  }
}

// Tetik gerçekleşince eşleşen kampanyalara kaydet + anında (gecikme 0) adımları gönder.
export async function enroll(triggerType: "lead" | "abandoned" | "interest", triggerValue: string | null, person: { email?: string; name?: string }) {
  const email = (person.email || "").trim().toLowerCase();
  if (!email.includes("@")) return;

  let query = supabaseAdmin.from("ds_campaigns").select("id").eq("trigger_type", triggerType).eq("enabled", true);
  if (triggerValue) query = query.eq("trigger_value", triggerValue);
  const { data: campaigns } = await query;

  for (const c of campaigns || []) {
    const { data: enr } = await supabaseAdmin
      .from("ds_campaign_enrollments")
      .upsert([{ campaign_id: c.id, email, name: person.name || null }], { onConflict: "campaign_id,email", ignoreDuplicates: true })
      .select("id");
    if (enr && enr.length > 0) {
      await processEnrollment(enr[0].id); // gecikme 0 adımları anında gitsin
    }
  }
}

// Cron: bekleyen tüm kayıtları işle.
export async function processDue(limit = 300) {
  const { data: pending } = await supabaseAdmin.from("ds_campaign_enrollments").select("id").eq("done", false).limit(limit);
  let processed = 0;
  for (const e of pending || []) {
    await processEnrollment(e.id);
    processed++;
  }
  return processed;
}
