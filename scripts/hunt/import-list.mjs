// INVEST — tier-1 CSV import (yatırımcı listesi → inv_investors).
// Bağımlılıksız sağlam CSV parser (tez metinlerinde virgül/tırnak/satır sonu var).
// Kullanım: node --env-file=.env.local scripts/hunt/import-list.mjs "<csv yolu>"
// Yazar: tags=['tier1'], country='INT' (→ İngilizce mail), e-postalı → outreach_published, status='pending'.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const file = process.argv[2];
if (!file) { console.error('Kullanım: ... import-list.mjs "<csv yolu>"'); process.exit(1); }

// ── CSV parser (RFC4180: tırnaklı alan, "" kaçışı, gömülü virgül/newline) ──
function parseCSV(text) {
  const rows = []; let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\r") { /* skip */ }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const raw = readFileSync(file, "utf8").replace(/^﻿/, "");
const rows = parseCSV(raw);
if (rows.length < 2) { console.error("CSV boş."); process.exit(1); }

const H = rows[0].map((h) => (h || "").trim());
const col = (p) => H.findIndex((h) => h.toLowerCase().startsWith(p.toLowerCase()));
const I = {
  ad: col("Ad"), email: col("E-posta"), fon: col("Fon"), unvan: col("Unvan"), linkedin: col("LinkedIn"),
  sektor: col("Sektor"), asama: col("Asama"), cekMin: col("Cek min"), cekMax: col("Cek max"),
  cekTipik: col("Cek tipik"), tez: col("Fonun tezi"), kaynak: col("Tez kaynagi"), son: col("Son yatirimlar"), uyari: col("UYARI"),
};
const g = (r, i) => (i >= 0 ? (r[i] || "").trim() : "");
const arr = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);
const link = (v) => (v && !/^https?:\/\//i.test(v) ? "https://" + v : v);

const records = [];
for (const r of rows.slice(1)) {
  if (!r || r.every((c) => !(c || "").trim())) continue;
  const email = g(r, I.email).toLowerCase();
  const firm = g(r, I.fon) || g(r, I.ad);
  if (!firm) continue; // firm_name NOT NULL
  const min = g(r, I.cekMin), max = g(r, I.cekMax), tip = g(r, I.cekTipik);
  const ticket = [min && max ? `${min}–${max}` : (min || max), tip ? `(tipik ${tip})` : ""].filter(Boolean).join(" ");
  const kaynak = g(r, I.kaynak);
  const uyari = g(r, I.uyari);
  records.push({
    firm_name: firm.slice(0, 300),
    partner_name: g(r, I.ad) || null,
    role: g(r, I.unvan) || null,
    email: email || null,
    address_purpose: email ? "outreach_published" : "unknown",
    linkedin: link(g(r, I.linkedin)) || null,
    website: /^https?:|\./.test(kaynak) ? kaynak : null,
    source_url: /^https?:|\./.test(kaynak) ? kaynak : null,
    sectors: arr(g(r, I.sektor)),
    stages: arr(g(r, I.asama)),
    ticket: ticket || null,
    thesis: g(r, I.tez) || null,
    portfolio: g(r, I.son) || null,
    country: "INT",
    status: "pending",
    tags: ["tier1"],
    notes: uyari ? `UYARI: ${uyari}` : null,
  });
}

// ── Dedupe (mevcut inv_investors'a karşı) ──
const norm = (s) => (s ?? "").toString().trim().toLowerCase().replace(/\/+$/, "");
const key = (r) => norm(r.linkedin) || norm(r.email) || `${norm(r.firm_name)}|${norm(r.partner_name)}`;
const { data: existing, error: exErr } = await db.from("inv_investors").select("firm_name,partner_name,email,linkedin").limit(50000);
if (exErr) { console.error("Mevcut okunamadı:", exErr.message); process.exit(1); }
const seen = new Set((existing || []).map(key));

const toInsert = [];
let dup = 0, noEmail = 0;
for (const r of records) {
  const k = key(r);
  if (seen.has(k)) { dup++; continue; }
  seen.add(k);
  if (!r.email) noEmail++;
  toInsert.push(r);
}

console.log(`CSV: ${records.length} kayıt · yeni: ${toInsert.length} · duplicate: ${dup} · e-postasız (yeni): ${noEmail}`);
let inserted = 0;
for (let i = 0; i < toInsert.length; i += 500) {
  const { error } = await db.from("inv_investors").insert(toInsert.slice(i, i + 500));
  if (error) { console.error("Insert hatası:", error.message); process.exit(1); }
  inserted += Math.min(500, toInsert.length - i);
}
console.log(`✅ ${inserted} yatırımcı içeri alındı (tier1, INT, ${toInsert.length - noEmail} e-postalı outreach_published).`);
