// INVEST hunt — pending havuz istatistiği.
// Kullanım: node --env-file=.env.local scripts/hunt/stats.mjs
import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data, error } = await db.from("inv_investors").select("email,country,tags,status").limit(50000);
if (error) { console.error(error.message); process.exit(1); }

const rows = data || [];
const p = rows.filter((r) => r.status === "pending");
const has = (t) => (r) => (r.tags || []).includes(t);
const withEmail = p.filter((r) => r.email && String(r.email).trim());

console.log(`Toplam kayıt: ${rows.length} | pending: ${p.length}`);
console.log(`  e-postalı (pending): ${withEmail.length}`);
console.log(`  TR (pending): ${p.filter((r) => r.country === "TR").length}`);
console.log(`  linkedin-only: ${p.filter(has("linkedin-only")).length}`);
console.log(`  form-only: ${p.filter(has("form-only")).length}`);
