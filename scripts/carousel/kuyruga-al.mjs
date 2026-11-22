// Kaydırmalı postu Instagram kuyruğuna alır: slaytları JPEG'e çevirip Storage'a yükler, ilk boş öğlen 12:00'ye (TR) yerleştirir.
// Video (19:00) ve söz hikâyesi (07:00) kuyruklarından ayrıdır. Yayını site yapar (/api/cron/hikaye, 15 dk'da bir; Paylaşım düğmesi kapalıysa atmaz).
//
// Klasör düzeni: <klasör>/slaytlar/slide_01.png … (sırayla) ve <klasör>/metin.md (Instagram açıklaması; "# " ile başlayan başlık satırı atılır).
// Kullanım: node scripts/carousel/kuyruga-al.mjs <klasör> "<başlık>" [--an 2026-11-22T12:00]
// Liste:    node scripts/carousel/kuyruga-al.mjs --liste
// İptal:    node scripts/carousel/kuyruga-al.mjs --iptal <id>
import { readFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ffmpeg from "../haber/node_modules/ffmpeg-static/index.js";
import { createClient } from "../../node_modules/@supabase/supabase-js/dist/index.mjs";

const KOK = dirname(fileURLToPath(import.meta.url));
const SAAT = 12; // TR
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
  const { data, error } = await db.from("ds_carousel_kuyruk").select("id, baslik, yayin_at, durum, link, hata").gte("yayin_at", new Date(Date.now() - 7 * 86400000).toISOString()).order("yayin_at");
  hata(error);
  for (const s of data) console.log(`${tr(s.yayin_at)}  ${s.durum.padEnd(9)} ${s.id}  ${s.baslik}${s.link ? `  ${s.link}` : ""}${s.hata ? `  (${s.hata})` : ""}`);
  process.exit(0);
}
if (a === "--iptal") {
  const { data, error } = await db.from("ds_carousel_kuyruk").update({ durum: "iptal" }).eq("id", b).eq("durum", "bekliyor").select("id");
  hata(error);
  console.log(data.length ? "İptal edildi." : "Bulunamadı ya da yayın başladı.");
  process.exit(0);
}
if (!a || !b) {
  console.error('Kullanım: node scripts/carousel/kuyruga-al.mjs <klasör> "<başlık>" [--an 2026-11-22T12:00]');
  process.exit(1);
}

const slaytlar = readdirSync(join(a, "slaytlar")).filter((f) => /^slide_\d+\.(png|jpe?g)$/.test(f)).sort();
if (slaytlar.length < 2 || slaytlar.length > 10) hata({ message: `Instagram 2–10 görsel kabul eder, klasörde ${slaytlar.length} var.` });
const metin = readFileSync(join(a, "metin.md"), "utf8").split("\n").filter((l) => !l.startsWith("# ")).join("\n").trim();
if (!metin) hata({ message: "metin.md boş." });
if (metin.length > 2200) hata({ message: `Açıklama ${metin.length} karakter; Instagram sınırı 2200.` });

// Saat: --an verildiyse o, yoksa ilk boş günün 12:00'si (en az 30 dk sonrası).
const ai = process.argv.indexOf("--an");
let yayin;
if (ai > -1) {
  yayin = new Date(`${process.argv[ai + 1]}:00+03:00`);
  if (!(yayin.getTime() > Date.now())) hata({ message: "--an geçmişte ya da geçersiz." });
} else {
  const { data: dolu, error } = await db.from("ds_carousel_kuyruk").select("yayin_at").in("durum", ["bekliyor", "isleniyor", "yayinda"]).gte("yayin_at", new Date().toISOString());
  hata(error);
  const gunler = new Set(dolu.map((d) => new Date(d.yayin_at).toLocaleDateString("sv", { timeZone: "Europe/Istanbul" })));
  for (let i = 0; i < 60 && !yayin; i++) {
    const gun = new Date(Date.now() + i * 86400000).toLocaleDateString("sv", { timeZone: "Europe/Istanbul" });
    const t = new Date(`${gun}T${String(SAAT).padStart(2, "0")}:00:00+03:00`);
    if (t.getTime() > Date.now() + 30 * 60000 && !gunler.has(gun)) yayin = t;
  }
}

// Instagram yalnız JPEG kabul eder.
const klasor = `carousel/${randomUUID()}`;
const yollar = [];
for (const [i, f] of slaytlar.entries()) {
  const jpg = execFileSync(ffmpeg, ["-v", "error", "-i", join(a, "slaytlar", f), "-q:v", "2", "-f", "image2", "-c:v", "mjpeg", "-"], { maxBuffer: 50 * 1024 * 1024 });
  const yol = `${klasor}/${String(i + 1).padStart(2, "0")}.jpg`;
  hata((await db.storage.from("paylasim-video").upload(yol, jpg, { contentType: "image/jpeg" })).error);
  yollar.push(yol);
}
const { data: satir, error: e2 } = await db.from("ds_carousel_kuyruk").insert({ baslik: b, metin, gorsel_yollar: yollar, yayin_at: yayin.toISOString() }).select("id").single();
hata(e2);
console.log(`✓ ${tr(yayin)} — ${b} (${yollar.length} slayt, ${satir.id})`);
