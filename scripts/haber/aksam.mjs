// Haber toplayıcı — AKŞAM YAYINI (tam otomatik).
//
// Her akşam 18:30 TR'de pg_cron → /api/cron/haber-aksam bu dosyayı çağırır:
//   1. RSS'leri o an toplar (topla + isle, DOSYA YAZMADAN — Vercel'de disk yok)
//   2. Son 24 saatin, eşiği geçen ve henüz yazısı olmayan haberlerini puana göre sıralar
//   3. Gemini ile metin yazar; doğrulama kapısı (metin.mjs → dogrula) aynen çalışır
//   4. Yazıları ARALIKLI saatlere taslak olarak basar: 19:00, 19:30, 20:00 TR (hepsi birden çıkmasın —
//      Eser kararı 2026-11-13). pg_cron yarım saatte bir tarihi gelenleri yayına çıkarır (migration 0041).
// Akşam başına en fazla GUNLUK_LIMIT yazı = yuva sayısı; elle kuyruğa alınmış yazı bir yuvayı doldurur.
// Görsel yok (yabancı şerit gibi): kapak ve görsel elle eklenebilir, yayinla.mjs yeniden basınca yayında kalır.
//
// Neden GitHub Actions değil: zamanlanmış işler 6-7 saat gecikiyor (ölçüldü 2026-11-09..12)
// ve haber.yml'e sır konmuyor (repo public).
//
// Yerelde dene:  node --env-file=.env.local scripts/haber/aksam.mjs --kuru

import { topla } from "./topla.mjs";
import { isle } from "./kuyruk.mjs";
import { metinUret } from "./metin.mjs";
import { satirYaz, yaziSlug } from "./yayinla-govde.mjs";

export const GUNLUK_LIMIT = 3;
export const ARALIK_DK = 30;       // yazılar arası süre; 1 saat için 60 yap (pg_cron yarım saatte bir koşar)
export const PUAN_ESIGI = 65;      // 2026-11 kuyruğu: 58-86; OpenAI derleme haberi 62-64 ile eşik altında kalıyordu
const PENCERE_MS = 24 * 3600_000;
const YEDEK_ADAY = 2;              // kapıdan düşen olursa yerine geçecek fazladan aday

// Bugünün 19:00 TR'si (16:00 UTC). Türkiye UTC+3 sabit.
export function aksamSaati(simdi = new Date()) {
  const t = new Date(simdi);
  t.setUTCHours(16, 0, 0, 0);
  return t;
}

// Akşamın yayın yuvaları: 19:00'dan başlayıp ARALIK_DK arayla GUNLUK_LIMIT adet.
// Tetik gecikip 19:00 geçtiyse yuvalar bir sonraki yarım saatten başlar — hiçbiri geçmişte kalmaz.
export function yuvalar(simdi = new Date()) {
  let bas = aksamSaati(simdi).getTime();
  const yarim = 30 * 60_000;
  if (simdi.getTime() >= bas) bas = Math.ceil((simdi.getTime() + 1) / yarim) * yarim;
  return Array.from({ length: GUNLUK_LIMIT }, (_, i) => new Date(bas + i * ARALIK_DK * 60_000).toISOString());
}

export async function aksamYayini({ db, simdi = new Date(), kuru = false, log = () => {} }) {
  const tum = yuvalar(simdi);

  // Elle kuyruğa alınmış yazının oturduğu yuva (genelde 19:00) dolu sayılır.
  const { data: doluSatir, error: e1 } = await db.from("ds_blog_posts")
    .select("yayin_tarihi").eq("durum", "taslak").in("yayin_tarihi", tum);
  if (e1) throw new Error(e1.message);
  const doluMs = new Set((doluSatir ?? []).map((r) => Date.parse(r.yayin_tarihi)));
  const bosYuva = tum.filter((t) => !doluMs.has(Date.parse(t)));
  const bos = bosYuva.length;
  if (!bos) return { yazilan: [], neden: `bu akşamın ${tum.length} yuvası zaten dolu` };

  const { adaylar, kaynakDurum } = await topla();
  if (kaynakDurum.every((k) => k.hata)) throw new Error("hiçbir haber kaynağı çekilemedi");
  // Olmayan dizin: hafıza boş başlar. Repo'daki kuyruk hafızası okunursa sabah GitHub'ın
  // topladığı haberler "paketlendi" sayılıp elenirdi. Tekrar yazmayı blog slug'ı engelliyor.
  const { yeni } = isle(adaylar, { dir: "/tmp/haber-aksam-hafizasiz", simdi });

  const taze = yeni.filter((k) => k.durum === "hazir" && k.puan >= PUAN_ESIGI
    && simdi - Date.parse(k.kunye.tarih) <= PENCERE_MS && k.kunye.sirket);
  const sluglar = taze.map((k) => yaziSlug(k.kunye.sirket));
  const { data: mevcut, error: e2 } = sluglar.length
    ? await db.from("ds_blog_posts").select("slug").in("slug", sluglar)
    : { data: [], error: null };
  if (e2) throw new Error(e2.message);
  const yazili = new Set((mevcut ?? []).map((r) => r.slug));
  const secilen = taze.filter((k) => !yazili.has(yaziSlug(k.kunye.sirket)))
    .sort((a, b) => b.puan - a.puan).slice(0, bos + YEDEK_ADAY);
  log(`${adaylar.length} aday → ${taze.length} taze → ${secilen.length} denenecek (${bos} yer)`);

  // Düşük güvenli alanlar (kurucu F1 .64, katılan .72) yayına girmez: çıkarım bazen
  // "Sequoia Capita l liderlik ederken Greenoaks" gibi cümle parçası yakalıyor.
  // Prompt'a "doğrulanmış olgu" diye de verilmesin diye metin üretiminden ÖNCE temizlenir.
  for (const k of secilen) for (const alan of k.dusuk_guven ?? []) k.kunye[alan] = [];

  // SIRAYLA, paralel değil: Gemini ücretsiz katmanı eşzamanlı isteklerde 503 veriyor
  // (ölçüldü 2026-11-13: 4 paralel isteğin 2'si düştü, aynı haber tek başına geçti).
  // Puan sırasıyla dener, yeterli yazı çıkınca durur; 503/429'da bir kez bekleyip yeniden dener.
  // SURE_SINIRI'ndan sonra yeni istek başlatmaz — uç 60 sn'de kesiliyor (toplama ~15 sn yiyor).
  // Her yazı üretilir üretilmez kaydedilir: uç kesilirse bitenler kaybolmaz.
  const SURE_SINIRI = 25_000, t0 = Date.now();
  const yazilan = [], dusen = [];
  for (const k of secilen) {
    if (yazilan.length >= bos) break;
    if (Date.now() - t0 > SURE_SINIRI) { dusen.push({ sirket: k.kunye.sirket, neden: "süre sınırı" }); continue; }
    let r;
    try { r = await metinUret(k); }
    catch (e) {
      if (/HTTP (503|429|500)/.test(e?.message ?? "") && Date.now() - t0 < SURE_SINIRI) {
        await new Promise((ok) => setTimeout(ok, 4000));
        try { r = await metinUret(k); } catch (e2) { dusen.push({ sirket: k.kunye.sirket, neden: e2?.message?.slice(0, 120) }); continue; }
      } else { dusen.push({ sirket: k.kunye.sirket, neden: e?.message?.slice(0, 120) }); continue; }
    }
    // Kapı cümle düşürür; şirketi tarif eden bölüm kalmadıysa yazı anlamsız.
    if (!(r.metinler.kurulus?.length || r.metinler.odak?.length)) { dusen.push({ sirket: k.kunye.sirket, neden: "kapıdan sonra tarif bölümü kalmadı" }); continue; }
    // Puan sırasıyla geldiği için en yüksek puanlı yazı ilk boş yuvaya (en erken saate) oturur.
    const satir = satirYaz(k, r.metinler);
    const yayin_tarihi = bosYuva[yazilan.length];
    if (!kuru) {
      const { error } = await db.from("ds_blog_posts").insert([{ ...satir, durum: "taslak", yayin_tarihi, lang: "tr" }]);
      if (error) { dusen.push({ sirket: k.kunye.sirket, neden: error.message }); continue; }
    }
    yazilan.push({ slug: satir.slug, baslik: satir.title, puan: k.puan, yayin_tarihi, kapi_dusurdu: r.sorunlar.length });
  }
  return { yazilan, dusen, yuvalar: tum, kuru };
}

// ── CLI ───────────────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const { createClient } = await import("@supabase/supabase-js");
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const kuru = process.argv.includes("--kuru");
  const t0 = Date.now();
  const r = await aksamYayini({ db, kuru, log: console.log });
  console.log(JSON.stringify(r, null, 2));
  console.log(`${((Date.now() - t0) / 1000).toFixed(1)} sn${kuru ? " — KURU KOŞU, veritabanına yazılmadı" : ""}`);
}
