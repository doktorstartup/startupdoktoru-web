// Kaydırmalı postu kuyruğa alır: slaytları JPEG'e (Instagram) ve tek PDF'e (LinkedIn belgesi) çevirip Storage'a yükler,
// ilk boş günün 19:00'una (TR) yerleştirir. Tür deneyi (2026-11-22): carousel videonun yerine çıkar, video olan güne konmaz;
// video yerleştirici de carousel olan günü atlar (migration 0054). Yayını site yapar (/api/cron/hikaye, 15 dk'da bir; Paylaşım düğmesi kapalıysa atmaz).
//
// Klasör düzeni: <klasör>/slaytlar/slide_01.png … (sırayla), <klasör>/metin.md (Instagram açıklaması; "# " ile başlayan
// başlık satırı atılır) ve isteğe bağlı <klasör>/linkedin.md (LinkedIn metni; yoksa LinkedIn'e gitmez).
// Kullanım: node scripts/carousel/kuyruga-al.mjs <klasör> "<başlık>" [--an 2026-11-22T19:00]
// Güncelle: node scripts/carousel/kuyruga-al.mjs --guncelle <id> <klasör>   (bekleyen satıra PDF + LinkedIn metni ekler)
// Liste:    node scripts/carousel/kuyruga-al.mjs --liste
// İptal:    node scripts/carousel/kuyruga-al.mjs --iptal <id>
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ffmpeg from "../haber/node_modules/ffmpeg-static/index.js";
import { chromium } from "../haber/node_modules/playwright-core/index.mjs";
import { createClient } from "../../node_modules/@supabase/supabase-js/dist/index.mjs";
import { instagramMetinHatalari } from "../instagram-metin.mjs";

const KOK = dirname(fileURLToPath(import.meta.url));
const SAAT = 19; // TR, video saati
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
// Slaytlar tek PDF: her sayfa 1080×1350 (LinkedIn belge gönderisi sayfa sayfa kaydırılır).
async function pdfUret(klasor, slaytlar) {
  const sayfalar = slaytlar.map((f) => `<img src="data:image/png;base64,${readFileSync(join(klasor, "slaytlar", f)).toString("base64")}">`).join("");
  const tarayici = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const sayfa = await tarayici.newPage();
    await sayfa.setContent(`<style>@page{size:1080px 1350px;margin:0}body{margin:0}img{display:block;width:1080px;height:1350px;break-after:page}</style>${sayfalar}`, { waitUntil: "load" });
    return await sayfa.pdf({ width: "1080px", height: "1350px", printBackground: true });
  } finally {
    await tarayici.close();
  }
}
const slaytListesi = (klasor) => readdirSync(join(klasor, "slaytlar")).filter((f) => /^slide_\d+\.png$/.test(f)).sort();
const linkedinMetni = (klasor) => (existsSync(join(klasor, "linkedin.md")) ? readFileSync(join(klasor, "linkedin.md"), "utf8").split("\n").filter((l) => !l.startsWith("# ")).join("\n").trim() || null : null);
async function pdfYukle(depoKlasoru, klasor) {
  const yol = `${depoKlasoru}/slaytlar.pdf`;
  hata((await db.storage.from("paylasim-video").upload(yol, await pdfUret(klasor, slaytListesi(klasor)), { contentType: "application/pdf" })).error);
  return yol;
}

if (a === "--guncelle") {
  const klasor = process.argv[4];
  const li = linkedinMetni(klasor);
  if (!li) hata({ message: "linkedin.md yok ya da boş." });
  const { data: satir, error } = await db.from("ds_carousel_kuyruk").select("gorsel_yollar").eq("id", b).eq("durum", "bekliyor").single();
  hata(error);
  const pdf_yol = await pdfYukle(satir.gorsel_yollar[0].replace(/\/[^/]+$/, ""), klasor);
  hata((await db.from("ds_carousel_kuyruk").update({ pdf_yol, linkedin_metin: li }).eq("id", b)).error);
  console.log(`✓ PDF + LinkedIn metni eklendi (${b})`);
  process.exit(0);
}
if (!a || !b) {
  console.error('Kullanım: node scripts/carousel/kuyruga-al.mjs <klasör> "<başlık>" [--an 2026-11-22T19:00]');
  process.exit(1);
}

const slaytlar = slaytListesi(a);
if (slaytlar.length < 2 || slaytlar.length > 10) hata({ message: `Instagram 2–10 görsel kabul eder, klasörde ${slaytlar.length} var.` });
const metin = readFileSync(join(a, "metin.md"), "utf8").split("\n").filter((l) => !l.startsWith("# ")).join("\n").trim();
if (!metin) hata({ message: "metin.md boş." });
if (metin.length > 2200) hata({ message: `Açıklama ${metin.length} karakter; Instagram sınırı 2200.` });
const metinHatasi = instagramMetinHatalari(metin);
if (metinHatasi.length) hata({ message: `metin.md:\n  - ${metinHatasi.join("\n  - ")}` });

// Saat: --an verildiyse o, yoksa ilk boş günün 12:00'si (en az 30 dk sonrası).
const ai = process.argv.indexOf("--an");
let yayin;
if (ai > -1) {
  yayin = new Date(`${process.argv[ai + 1]}:00+03:00`);
  if (!(yayin.getTime() > Date.now())) hata({ message: "--an geçmişte ya da geçersiz." });
  const gun = yayin.toLocaleDateString("sv", { timeZone: "Europe/Istanbul" });
  const { data: ayniGun, error: e0 } = await db.from("ds_paylasim").select("baslik").gte("yayin_at", `${gun}T00:00:00+03:00`).lt("yayin_at", `${gun}T23:59:59+03:00`);
  hata(e0);
  if (ayniGun.length) hata({ message: `O gün video var (${ayniGun[0].baslik}); carousel videonun yerine çıkar, aynı güne konmaz.` });
} else {
  const { data: dolu, error } = await db.from("ds_carousel_kuyruk").select("yayin_at").in("durum", ["bekliyor", "isleniyor", "yayinda"]).gte("yayin_at", new Date().toISOString());
  hata(error);
  const { data: videolar, error: e1 } = await db.from("ds_paylasim").select("yayin_at").gte("yayin_at", new Date().toISOString());
  hata(e1);
  const gunler = new Set([...dolu, ...videolar].map((d) => new Date(d.yayin_at).toLocaleDateString("sv", { timeZone: "Europe/Istanbul" })));
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
const linkedin_metin = linkedinMetni(a);
const pdf_yol = linkedin_metin ? await pdfYukle(klasor, a) : null;
const { data: satir, error: e2 } = await db.from("ds_carousel_kuyruk").insert({ baslik: b, metin, gorsel_yollar: yollar, yayin_at: yayin.toISOString(), pdf_yol, linkedin_metin }).select("id").single();
hata(e2);
console.log(`✓ ${tr(yayin)} — ${b} (${yollar.length} slayt${linkedin_metin ? " + LinkedIn PDF" : ", LinkedIn yok: linkedin.md eklenmemiş"}, ${satir.id})`);
