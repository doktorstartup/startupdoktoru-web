// INVEST hunt — toplu yatırımcı ekleyici/güncelleyici (service-role, uygulamadan ayrı).
// Yeni kayıt → 'pending' insert. Eşleşen kayıt 'pending' ise → verilen alanları GÜNCELLE
// (yeniden çalıştırınca zenginleştirir). 'verified'/'rejected' satıra dokunmaz (insan kararı).
// Beyin (çıkarım+skor) = Claude Code; bu script yalnız DB'ye yazan "el".
// Kullanım:
//   node --env-file=.env.local scripts/hunt/upsert-investor.mjs scripts/hunt/pilot-batch.json
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Env yok. `node --env-file=.env.local scripts/hunt/upsert-investor.mjs <dosya.json>` ile çalıştır.");
  process.exit(1);
}
const db = createClient(url, serviceKey);

// inv_investors'a yazılabilir alanlar (id/status/timestamp hariç).
const ALLOWED = [
  "firm_name", "partner_name", "role", "email", "email_secondary", "address_purpose",
  "website", "linkedin", "twitter", "thesis", "sectors", "stages", "ticket",
  "country", "city", "portfolio", "source_url", "tags", "notes",
];

const file = process.argv[2];
if (!file) { console.error("Kullanım: ... upsert-investor.mjs <dosya.json>"); process.exit(1); }
const records = [].concat(JSON.parse(readFileSync(file, "utf8")));

const norm = (s) => (s ?? "").toString().trim().toLowerCase().replace(/\/+$/, "");
const dedupeKey = (r) => norm(r.linkedin) || norm(r.email) || `${norm(r.firm_name)}|${norm(r.partner_name)}`;

const { data: existing, error: exErr } = await db
  .from("inv_investors").select("id,status,firm_name,partner_name,email,linkedin").limit(50000);
if (exErr) { console.error("Mevcut kayıtlar okunamadı:", exErr.message); process.exit(1); }
const byKey = new Map((existing ?? []).map((r) => [dedupeKey(r), r]));

const toInsert = [];
const toUpdate = [];
const skipped = [];
for (const r of records) {
  if (!r.firm_name || !r.firm_name.toString().trim()) { skipped.push([r, "firm_name yok"]); continue; }
  const fields = {};
  for (const f of ALLOWED) if (r[f] !== undefined && r[f] !== null && r[f] !== "") fields[f] = r[f];
  const match = byKey.get(dedupeKey(r));
  if (match) {
    if (match.status !== "pending") { skipped.push([r, `${match.status} — dokunulmadı`]); continue; }
    toUpdate.push({ id: match.id, patch: { ...fields, updated_at: new Date().toISOString() } });
  } else {
    if (!fields.address_purpose) fields.address_purpose = "unknown";
    toInsert.push({ ...fields, status: "pending" });
  }
}

let inserted = 0;
for (let i = 0; i < toInsert.length; i += 500) {
  const { error } = await db.from("inv_investors").insert(toInsert.slice(i, i + 500));
  if (error) { console.error("Insert hatası:", error.message); process.exit(1); }
  inserted += Math.min(500, toInsert.length - i);
}
let updated = 0;
for (const u of toUpdate) {
  const { error } = await db.from("inv_investors").update(u.patch).eq("id", u.id);
  if (error) { console.error("Update hatası:", error.message); process.exit(1); }
  updated++;
}
console.log(`✅ ${inserted} yeni eklendi, ${updated} güncellendi, ${skipped.length} atlandı.`);
for (const [r, why] of skipped) console.log(`  - ${why}: ${r.partner_name || r.firm_name || "?"}`);
