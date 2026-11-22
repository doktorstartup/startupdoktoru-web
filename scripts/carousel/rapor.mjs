// Tür deneyi raporu (2026-11-22): aynı saatte (19:00) Instagram Reels mi kaydırmalı post mu daha iyi tutuyor?
// Yalnız 48 saatini doldurmuş gönderiler sayılır (çoğu erişim ilk iki günde gelir). Veriyi günlük sosyal cron yazar:
// Reels → ds_sosyal_video, kaydırmalı post → ds_carousel_kuyruk.ig_metrikler. Salt okuma.
// LinkedIn kıyaslanamaz: uygulamanın gönderi istatistiği okuma izni yok.
//
// Kullanım: node scripts/carousel/rapor.mjs [--gun 30]
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "../../node_modules/@supabase/supabase-js/dist/index.mjs";

const KOK = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(join(KOK, "../../.env.local"), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")]),
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const gi = process.argv.indexOf("--gun");
const GUN = gi > -1 ? Number(process.argv[gi + 1]) : 30;
const bas = new Date(Date.now() - GUN * 86400000).toISOString();
const son = new Date(Date.now() - 48 * 3600000).toISOString();
const hata = (e) => { if (e) { console.error(e.message); process.exit(1); } };

const { data: reels, error: e1 } = await db.from("ds_sosyal_video").select("baslik, yayin_at, metrikler").eq("platform", "instagram").gte("yayin_at", bas).lte("yayin_at", son);
hata(e1);
const { data: car, error: e2 } = await db.from("ds_carousel_kuyruk").select("baslik, yayin_at, ig_metrikler").eq("durum", "yayinda").not("ig_metrikler", "is", null).gte("yayin_at", bas).lte("yayin_at", son);
hata(e2);

const gonderiler = [
  ...reels.map((r) => ({ tur: "Reels", baslik: r.baslik, an: r.yayin_at, m: r.metrikler })),
  ...car.map((c) => ({ tur: "Carousel", baslik: c.baslik, an: c.yayin_at, m: c.ig_metrikler })),
].sort((a, b) => a.an.localeCompare(b.an));

const ALAN = [["erisim", "Erişim"], ["views", "Görüntülenme"], ["kaydet", "Kaydetme"], ["paylasim", "Paylaşım"], ["etkilesim", "Etkileşim"], ["takip", "Takip"]];
const gunAdi = (t) => new Date(t).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul", weekday: "short", day: "2-digit", month: "2-digit" });
const sayi = (v) => (v == null ? "—" : String(v));

console.log(`Son ${GUN} gün, 48 saatini doldurmuş Instagram gönderileri\n`);
console.log(["Tarih".padEnd(12), "Tür".padEnd(9), ...ALAN.map(([, a]) => a.slice(0, 9).padStart(10)), "  Başlık"].join(""));
for (const g of gonderiler) {
  console.log([gunAdi(g.an).padEnd(12), g.tur.padEnd(9), ...ALAN.map(([k]) => sayi(g.m?.[k]).padStart(10)), "  ", (g.baslik || "").slice(0, 40)].join(""));
}

// Ortanca: tek bir patlayan gönderi ortalamayı çarpıtmasın.
const ortanca = (d) => {
  const s = d.filter((v) => typeof v === "number").sort((a, b) => a - b);
  if (!s.length) return null;
  const o = Math.floor(s.length / 2);
  return s.length % 2 ? s[o] : Math.round((s[o - 1] + s[o]) / 2);
};
console.log("\nOrtanca");
for (const tur of ["Reels", "Carousel"]) {
  const t = gonderiler.filter((g) => g.tur === tur);
  const oran = ortanca(t.map((g) => (g.m?.erisim ? Math.round((1000 * (g.m.kaydet || 0)) / g.m.erisim) : null)));
  console.log(`${tur.padEnd(9)} (${String(t.length).padStart(2)} gönderi)`.padEnd(21), ...ALAN.map(([k]) => sayi(ortanca(t.map((g) => g.m?.[k]))).padStart(10)), `   kaydetme/1000 erişim: ${sayi(oran)}`);
}
const nCar = gonderiler.filter((g) => g.tur === "Carousel").length;
if (nCar < 4) console.log(`\nNot: ${nCar} kaydırmalı post var; karar için en az 4–6 gerekir.`);
