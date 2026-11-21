// Söz hikâyesini Instagram kuyruğuna alır: görseli Storage'a yükler, ilk boş sabah 07:00'a (TR) yerleştirir.
// Yayını site yapar (/api/cron/hikaye, 15 dk'da bir; Paylaşım düğmesi kapalıysa atmaz).
//
// Kullanım: node scripts/hikaye/kuyruga-al.mjs <gorsel.jpg> "<söz>"
// Liste:    node scripts/hikaye/kuyruga-al.mjs --liste
// İptal:    node scripts/hikaye/kuyruga-al.mjs --iptal <id>
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "../../node_modules/@supabase/supabase-js/dist/index.mjs";

const KOK = dirname(fileURLToPath(import.meta.url));
const SAAT = 7; // TR
const env = Object.fromEntries(
  readFileSync(join(KOK, "../../.env.local"), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")]),
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const tr = (t) => new Date(t).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", dateStyle: "medium", timeStyle: "short" });
const hata = (e) => { if (e) { console.error(e.message); process.exit(1); } };

const [a, b] = process.argv.slice(2);
if (a === "--liste") {
  const { data, error } = await db.from("ds_hikaye_kuyruk").select("id, soz, yayin_at, durum, hata").gte("yayin_at", new Date(Date.now() - 3 * 86400000).toISOString()).order("yayin_at");
  hata(error);
  for (const s of data) console.log(`${tr(s.yayin_at)}  ${s.durum.padEnd(9)} ${s.id}  ${s.soz.slice(0, 60)}${s.hata ? `  (${s.hata})` : ""}`);
  process.exit(0);
}
if (a === "--iptal") {
  const { data, error } = await db.from("ds_hikaye_kuyruk").update({ durum: "iptal" }).eq("id", b).eq("durum", "bekliyor").select("id");
  hata(error);
  console.log(data.length ? "İptal edildi." : "Bulunamadı ya da yayın başladı.");
  process.exit(0);
}
if (!a || !b) {
  console.error('Kullanım: node scripts/hikaye/kuyruga-al.mjs <gorsel.jpg> "<söz>"');
  process.exit(1);
}

// İlk boş gün: yarın ya da sonrası (bugünün 07:00'ı geçmiş olabilir), dolu günler atlanır.
const { data: dolu, error } = await db.from("ds_hikaye_kuyruk").select("yayin_at").in("durum", ["bekliyor", "isleniyor", "yayinda"]).gte("yayin_at", new Date().toISOString());
hata(error);
const gunler = new Set(dolu.map((d) => new Date(d.yayin_at).toLocaleDateString("sv", { timeZone: "Europe/Istanbul" })));
const an = new Date();
let yayin;
for (let i = 0; i < 60; i++) {
  const gun = new Date(an.getTime() + i * 86400000).toLocaleDateString("sv", { timeZone: "Europe/Istanbul" });
  const t = new Date(`${gun}T${String(SAAT).padStart(2, "0")}:00:00+03:00`);
  if (t.getTime() > an.getTime() + 30 * 60000 && !gunler.has(gun)) { yayin = t; break; }
}

const yol = `hikaye/${randomUUID()}.jpg`;
hata((await db.storage.from("paylasim-video").upload(yol, readFileSync(a), { contentType: "image/jpeg" })).error);
const { data: satir, error: e2 } = await db.from("ds_hikaye_kuyruk").insert({ soz: b, gorsel_yol: yol, yayin_at: yayin.toISOString() }).select("id").single();
hata(e2);
console.log(`✓ ${tr(yayin)} — ${b.slice(0, 60)} (${satir.id})`);
