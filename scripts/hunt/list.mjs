// INVEST hunt — pending yatırımcıları iletişim kanalına göre gruplu listeler (inceleme yardımcısı).
// Kullanım: node --env-file=.env.local scripts/hunt/list.mjs
import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data, error } = await db.from("inv_investors")
  .select("firm_name,partner_name,email,linkedin,country,stages,tags,status")
  .eq("status", "pending").order("firm_name", { ascending: true }).limit(50000);
if (error) { console.error(error.message); process.exit(1); }

const rows = data || [];
const tag = (r, t) => (r.tags || []).includes(t);
const line = (r) => {
  const who = `${r.firm_name}${r.partner_name ? ` — ${r.partner_name}` : ""}`;
  const st = (r.stages || []).join("/") || "-";
  return `  ${who}  ·  ${st}  ·  ${r.country || "-"}`;
};

const email = rows.filter((r) => r.email && String(r.email).trim());
const linkedin = rows.filter((r) => !r.email && tag(r, "linkedin-only"));
const form = rows.filter((r) => !r.email && tag(r, "form-only"));
const other = rows.filter((r) => !r.email && !tag(r, "linkedin-only") && !tag(r, "form-only"));

console.log(`\n📧 E-POSTALI (${email.length}) — outreach'a en yakın:`);
email.forEach((r) => console.log(`${line(r)}  ·  ${r.email}`));
console.log(`\n🔗 LINKEDIN-ONLY (${linkedin.length}):`);
linkedin.forEach((r) => console.log(line(r)));
console.log(`\n📄 FORM-ONLY (${form.length}):`);
form.forEach((r) => console.log(line(r)));
console.log(`\n❔ DİĞER (${other.length}) — e-posta/etiket yok (eski manuel kayıtlar dahil):`);
other.forEach((r) => console.log(line(r)));
