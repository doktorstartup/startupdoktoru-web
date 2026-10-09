// Haber toplayıcı — BLOG YAYINI.
//
// Kuyruk kaydı + metin.json → ds_blog_posts satırı + public/haber/<slug>/ görselleri.
//
// İKİ KURAL, ikisi de bu dosyanın varlık sebebi:
//  1. HTML'i ŞABLON üretir. Model çıktısı içine KAÇIRILMIŞ METİN olarak girer, asla
//     HTML olarak değil. Böylece model HTML/script yazamaz — blog sayfası içeriği
//     dangerouslySetInnerHTML ile basıyor (blog/[slug]/page.tsx).
//  2. Rakamlar kuyruk kaydından MEKANİK basılır. Model tutara, tur tipine, yatırımcı
//     adına dokunmaz.
//
// GÖRSELLER: Supabase Storage DEĞİL, public/haber/<slug>/ → Vercel CDN.
// Gerekçe: Supabase ücretsiz katmanında 5 GB/ay egress var ve o havuz e-kitap
// indirmeleriyle PAYLAŞIMLI. Vercel Hobby'de 100 GB/ay ve ayrı havuz.
// (Repo ~158 MB/yıl büyür; GitHub uyarı eşiği 1 GB → ~6 yıl. Eşiğe yaklaşınca
//  Cloudflare R2'ye taşınır: 10 GB ücretsiz, egress $0.)
//
// Kullanım:
//   node --env-file=.env.local scripts/haber/yayinla.mjs kuyruk/<kayit>.json
//   node --env-file=.env.local scripts/haber/yayinla.mjs kuyruk/<kayit>.json --kuru

import { createClient } from "@supabase/supabase-js";
import ffmpeg from "ffmpeg-static";
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { gorselSirala } from "./carousel.mjs";

const PAKET_DIR = process.env.HABER_PAKET_DIR || "paketler";
const GORSEL_KOK = "public/haber";

const TR = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", İ: "i", Ç: "c", Ğ: "g", Ö: "o", Ş: "s", Ü: "u" };
export const slugify = (s) => (s || "").trim()
  .replace(/[çğıöşüİÇĞÖŞÜ]/g, (m) => TR[m] || m)
  .toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-")
  .replace(/-+/g, "-").replace(/^-|-$/g, "");

// Model çıktısı buradan geçer: HTML'e dönüşemez.
// Kesme işareti (') BİLEREK kaçırılmıyor: Türkçede çok sık ("İzmir'de", "40'tan") ve
// metin içeriğinde de çift tırnaklı özniteliklerde de tehlikesiz. Kaçırılırsa HTML
// kaynağı &#39; yığınına dönüyor ve admin panelinden elle düzenlemek zorlaşıyor.
import { govdeYaz, tutarYaz, kacar } from "./yayinla-govde.mjs";
export { govdeYaz };

function ffmpegCalistir(args) {
  return new Promise((c, h) => {
    const p = spawn(ffmpeg, args, { stdio: ["ignore", "ignore", "pipe"] });
    let e = ""; p.stderr.on("data", (d) => { e += d; });
    p.on("close", (k) => (k === 0 ? c() : h(new Error(`ffmpeg ${k}: ${e.slice(-300)}`))));
  });
}

// ── Görselleri hazırla ────────────────────────────────────────────────────
// Kapak 1200×630 (OG standardı), gövde görselleri en fazla 1100 geniş.
// Blog gövdesi 768 px (max-w-3xl); 1100 retina için yeterli, fazlası boşuna bayt.
// q:v 6 ≈ 150-250 KB. Bu dosyalar REPOYA giriyor, boyut doğrudan repo büyümesi.
async function gorselleriHazirla(paket, slug, adet = 3, kapakDosya = null) {
  const kaynakDizin = join(paket, "02_gorsel");
  const hedef = join(GORSEL_KOK, slug);
  if (!existsSync(kaynakDizin)) return { kapak: null, govde: [] };

  rmSync(hedef, { recursive: true, force: true });
  mkdirSync(hedef, { recursive: true });

  // Entropi sırası: fotoğraflar üstte, dekoratif şekiller altta.
  // AMA App Store görselleri (20_*) SİTE fotoğraflarının ARKASINA alınır — carousel
  // kapağındaki kararla aynı gerekçe: onlar tek bir uygulamanın iç ekranı, şirketi
  // anlatmıyor. Ölçüldü: entropi sıralaması onları öne çıkarıyor (yoğun arayüz),
  // sonuçta HubX yazısının kapağı bir mutfak fotoğrafı oluyordu.
  const puanli = await gorselSirala(paket);
  const site = puanli.filter((x) => x.dosya.startsWith("10_site"));
  const diger = puanli.filter((x) => !x.dosya.startsWith("10_site"));
  let sirali = [...site, ...diger].map((x) => join(kaynakDizin, x.dosya));
  // --kapak ile elle seçim. Otomatik sıralama şirketin konusunu bilemiyor:
  // egaranti'nin sitesindeki en yüksek entropili görseller EKİP PORTRELERİYDİ
  // ve kapak, haberde adı hiç geçmeyen bir kişinin fotoğrafı oluyordu —
  // okur onu haberin öznesi sanar. İNDEKS DEĞİL DOSYA ADI alınır: carousel.mjs
  // ile buradaki sıralama farklı, numara vermek karıştırırdı.
  if (kapakDosya) {
    const i = sirali.findIndex((y) => y.endsWith(kapakDosya));
    if (i < 0) throw new Error(`--kapak bulunamadı: ${kapakDosya}`);
    sirali = [sirali[i], ...sirali.filter((_, j) => j !== i)];
  }
  if (!sirali.length) return { kapak: null, govde: [] };

  // Kapak: 1200×630'a KIRPARAK sığdır (letterbox değil).
  const kapakAd = "kapak.jpg";
  await ffmpegCalistir(["-y", "-i", resolve(sirali[0]),
    "-vf", "scale=1200:630:force_original_aspect_ratio=increase,crop=1200:630",
    "-q:v", "5", join(hedef, kapakAd)]);

  // GÖVDEYE YALNIZ KONUSUNU BİLDİĞİMİZ GÖRSEL GİRER.
  // Eskiden entropi sırasındaki ilk N dosya gövdeye serpiliyordu. Konuyu
  // bilmediğimiz için egaranti yazısına şirketin sitesindeki bir EKİP
  // PORTRESİ düştü — yazıda adı geçmeyen biri, okur onu haberin öznesi sanar.
  // Diğer ikisi de soyut arayüz maketiydi ve "ölçek"/"yatırım turu"
  // başlıklarının altında hiçbir şey anlatmıyordu.
  //
  // Bildiğimiz iki kaynak var: App Store ekranları (kimlik kapısından geçti,
  // şirketin uygulaması olduğu kesin) ve hero (ana sayfanın tepesi). Rastgele
  // site fotoğrafı gövdeye girmez — kapak için elle seçilebilir (--kapak).
  const bilinen = (y) => /20_appstore|01_hero/.test(y);
  const govde = [];
  for (const [i, k] of sirali.slice(1).filter(bilinen).slice(0, adet).entries()) {
    const ad = `gorsel-${i + 1}.jpg`;
    try {
      await ffmpegCalistir(["-y", "-i", resolve(k),
        "-vf", "scale='min(1100,iw)':-2", "-q:v", "6", join(hedef, ad)]);
      govde.push({ yol: `/haber/${slug}/${ad}`, tip: /20_appstore/.test(k) ? "uygulama" : "site" });
    } catch { /* tek görsel düşerse yazı yine yayınlanır */ }
  }
  return { kapak: `/haber/${slug}/${kapakAd}`, govde };
}


// ── Yayın ─────────────────────────────────────────────────────────────────
export async function yayinla(kayit, metinler, { paket, kuru = false, kapakDosya = null } = {}) {
  const u = kayit.kunye;
  const baslik = `${u.sirket} ne iş yapıyor?`;
  const slug = slugify(`${u.sirket}-ne-is-yapiyor`);
  const tutar = tutarYaz(u.tutar?.deger, u.tutar?.birim);

  const { kapak, govde } = await gorselleriHazirla(paket, slug, 3, kapakDosya);
  const content = govdeYaz(kayit, metinler, govde);

  const ilkCumle = (metinler.kurulus?.[0] ?? metinler.odak?.[0] ?? "").replace(/\*\*/g, "");
  const satir = {
    title: tutar ? `${tutar} yatırım alan ${u.sirket} ne iş yapıyor?` : baslik,
    slug,
    content,
    seo_title: `${u.sirket} ne iş yapıyor? ${tutar ? `${tutar} yatırım aldı` : ""}`.trim(),
    seo_description: (ilkCumle || `${u.sirket} hakkında künye, kurucular ve yatırım detayları.`).slice(0, 300),
    cover_image: kapak,
  };

  if (kuru) return { satir, kapak, govde, yazildi: false };

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  // Aynı slug varsa güncelle — script iki kez koşarsa kopya yazı oluşmasın.
  const { data: mevcut } = await db.from("ds_blog_posts").select("id").eq("slug", slug).eq("lang", "tr").maybeSingle();
  if (mevcut) {
    const { error } = await db.from("ds_blog_posts").update(satir).eq("id", mevcut.id);
    if (error) throw new Error(error.message);
    return { satir, kapak, govde, yazildi: true, guncellendi: true };
  }
  // Yeni yazı TASLAK olarak basılır — yayına alma kararı admin panelinden verilir.
  // Güncellemede durum'a dokunulmaz: yayındaki bir yazı yeniden basılınca yayında kalır.
  const { error } = await db.from("ds_blog_posts").insert([{ ...satir, durum: "taslak", lang: "tr" }]);
  if (error) throw new Error(error.message);
  return { satir, kapak, govde, yazildi: true, guncellendi: false };
}

// ── CLI ───────────────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const dosya = process.argv[2];
  const kuru = process.argv.includes("--kuru");
  const ki = process.argv.indexOf("--kapak");
  const kapakDosya = ki > -1 ? process.argv[ki + 1] : null;
  if (!dosya) {
    console.error("Kullanım: node --env-file=.env.local scripts/haber/yayinla.mjs kuyruk/<kayit>.json [--kuru]");
    process.exit(1);
  }
  const kayit = JSON.parse(readFileSync(dosya, "utf8"));
  const paket = join(PAKET_DIR, kayit.id);
  const metinYolu = join(paket, "metin.json");

  // İKİ ŞERİT. Türk girişimi → tam paket (B-roll + carousel + görseller).
  // Yabancı girişim → yalnız metin; görsel üretilmez. Gerekçe ölçüldü: Türk
  // şirketi haberi yabancının ~40 katı okunuyor, görsel emeği yabancıda
  // karşılığını bulmuyor. Bu yüzden ARTIK PAKET ZORUNLU DEĞİL — zorunlu olan
  // metin.json. Görsel klasörü yoksa yazı görselsiz yayınlanır.
  if (!existsSync(metinYolu)) {
    console.error(`metin.json yok: ${metinYolu}`);
    console.error(`  Metni yazdır:  node scripts/haber/metin.mjs ${dosya} --prompt`);
    console.error(`  Türk girişimiyse önce paketi çek: node scripts/haber/varlik.mjs ${dosya}`);
    process.exit(1);
  }
  const metinler = JSON.parse(readFileSync(metinYolu, "utf8"));
  const gorselVar = existsSync(join(paket, "02_gorsel"));
  if (!gorselVar) console.log("ℹ  görsel klasörü yok — yazı GÖRSELSİZ yayınlanacak (yabancı girişim şeridi).\n");

  if (!kuru && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("SUPABASE_SERVICE_ROLE_KEY yok. --env-file=.env.local ile çalıştır ya da --kuru kullan.");
    process.exit(1);
  }

  const r = await yayinla(kayit, metinler, { paket, kuru, kapakDosya });
  console.log(`başlık : ${r.satir.title}`);
  console.log(`slug   : /blog/${r.satir.slug}`);
  console.log(`kapak  : ${r.kapak ?? "—"}`);
  console.log(`görsel : ${r.govde.length} adet → public/haber/${r.satir.slug}/`);
  const kelime = r.satir.content.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  const uygun = kelime >= 300 && kelime <= 800;
  console.log(`uzunluk: ~${kelime} kelime  ${uygun ? "✓ uygun" : "⚠ bant dışı"} (haber hedefi 300-800)`);
  console.log(`durum  : ${r.yazildi ? (r.guncellendi ? "güncellendi" : "yeni yazı eklendi") : "KURU KOŞU — veritabanına yazılmadı"}`);
  if (kuru) {
    console.log(`\n─── gövde HTML (ilk 900 karakter) ───\n${r.satir.content.slice(0, 900)}`);
  }
}
