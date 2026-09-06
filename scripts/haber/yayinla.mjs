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
import { gorselSirala, tutarYaz } from "./carousel.mjs";

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
const kacar = (s) => String(s ?? "").replace(/[&<>"]/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
// **kalın** → <strong>. Kaçırma ÖNCE yapılır, yani modelin yazdığı < > zararsızlaşmış olur.
const zengin = (s) => kacar(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

const TUR_TR = {
  "pre-seed": "tohum öncesi", seed: "tohum", "series-a": "A Serisi", "series-b": "B Serisi",
  "series-c+": "C Serisi ve sonrası", bridge: "köprü", grant: "hibe", debt: "borç",
};

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
async function gorselleriHazirla(paket, slug, adet = 3) {
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
  const sirali = [...site, ...diger].map((x) => join(kaynakDizin, x.dosya));
  if (!sirali.length) return { kapak: null, govde: [] };

  // Kapak: 1200×630'a KIRPARAK sığdır (letterbox değil).
  const kapakAd = "kapak.jpg";
  await ffmpegCalistir(["-y", "-i", resolve(sirali[0]),
    "-vf", "scale=1200:630:force_original_aspect_ratio=increase,crop=1200:630",
    "-q:v", "5", join(hedef, kapakAd)]);

  const govde = [];
  for (const [i, k] of sirali.slice(1, 1 + adet).entries()) {
    const ad = `gorsel-${i + 1}.jpg`;
    try {
      await ffmpegCalistir(["-y", "-i", resolve(k),
        "-vf", "scale='min(1100,iw)':-2", "-q:v", "6", join(hedef, ad)]);
      govde.push(ad);
    } catch { /* tek görsel düşerse yazı yine yayınlanır */ }
  }
  return { kapak: `/haber/${slug}/${kapakAd}`, govde: govde.map((a) => `/haber/${slug}/${a}`) };
}

// ── Gövde HTML'i — ŞABLON üretir ──────────────────────────────────────────
export function govdeYaz(kayit, metinler, gorseller) {
  const u = kayit.kunye;
  const tutar = tutarYaz(u.tutar?.deger, u.tutar?.birim);
  const tur = TUR_TR[u.tur_tipi] ?? null;
  const yatirimcilar = [u.lider, ...(u.katilanlar ?? [])].filter(Boolean);
  const kaynak = kayit.kaynaklar?.[0];
  const g = [...gorseller];
  const gorselAl = () => (g.length ? g.shift() : null);

  const par = (metin) => `<p>${zengin(metin)}</p>`;
  const figur = (src, alt) => src
    ? `<figure><img src="${kacar(src)}" alt="${kacar(alt)}" loading="lazy"></figure>` : "";

  const b = [];

  // 1) Künye — hepsi mekanik, modelin eli değmiyor.
  const kunyeSatirlari = [
    tutar && `<li><strong>Yatırım:</strong> ${kacar(tutar)}</li>`,
    tur && `<li><strong>Tur:</strong> ${kacar(tur)}</li>`,
    yatirimcilar.length && `<li><strong>Yatırımcılar:</strong> ${kacar(yatirimcilar.join(", "))}</li>`,
    u.kurucular?.length && `<li><strong>Kurucular:</strong> ${kacar(u.kurucular.join(", "))}</li>`,
    u.domain && `<li><strong>Site:</strong> <a href="https://${kacar(u.domain)}" rel="nofollow noopener" target="_blank">${kacar(u.domain)}</a></li>`,
  ].filter(Boolean);
  if (kunyeSatirlari.length) b.push(`<ul>${kunyeSatirlari.join("")}</ul>`);

  // 2) Ne iş yapıyor — SEO'nun hedeflediği bölüm ("<şirket> ne iş yapıyor")
  if (metinler.kurulus?.length || metinler.odak?.length) {
    b.push(`<h2>${kacar(u.sirket)} ne iş yapıyor?</h2>`);
    for (const p of metinler.kurulus ?? []) b.push(par(p));
    const gr = gorselAl();
    if (gr) b.push(figur(gr, `${u.sirket} — ${u.domain ?? ""}`.trim()));
    for (const p of metinler.odak ?? []) b.push(par(p));
  }

  // 3) Ölçek
  if (metinler.olcek?.length) {
    b.push(`<h2>Şirketin bugünkü ölçeği</h2>`);
    for (const p of metinler.olcek ?? []) b.push(par(p));
    const gr = gorselAl();
    if (gr) b.push(figur(gr, u.sirket));
  }

  // 4) Yatırım — yine mekanik
  if (tutar || yatirimcilar.length) {
    b.push(`<h2>Yatırım turu</h2>`);
    const cumle = yatirimcilar.length
      ? `${kacar(u.sirket)}, <strong>${kacar(yatirimcilar[0])}</strong>${yatirimcilar.length > 1 ? ` ve ${yatirimcilar.length - 1} yatırımcıdan` : "'dan"}${tutar ? ` <strong>${kacar(tutar)}</strong>` : ""} yatırım aldı.`
      : `${kacar(u.sirket)}, <strong>${kacar(tutar)}</strong> yatırım aldı.`;
    b.push(`<p>${cumle}${tur ? ` Tur <strong>${kacar(tur)}</strong> aşamasında gerçekleşti.` : ""}</p>`);
    const gr = gorselAl();
    if (gr) b.push(figur(gr, u.sirket));
  }

  // 4b) YOL HARİTASI — kaynaktan çıkarılmış üç durak. Şirketin nereden gelip
  // nereye gittiğini tek bakışta verir; okuma yükü düşük, bilgi yoğunluğu yüksek.
  const yh = metinler.yolharitasi ?? [];
  if (yh.length >= 2) {
    b.push(`<h2>${kacar(u.sirket)} nereye gidiyor?</h2>`);
    b.push(`<div class="ds-yol">${yh.map((d) => `
      <div class="ds-durak">
        <span class="ds-etiket">${kacar(d.etiket)}</span>
        <strong>${kacar(d.baslik)}</strong>
        ${(d.satirlar ?? []).length ? `<ul>${d.satirlar.map((x) => `<li>${kacar(x)}</li>`).join("")}</ul>` : ""}
      </div>`).join("")}</div>`);
  }

  // 4c) YORUM — Startup Doktoru'nun kendi değerlendirmesi. Olgu bölümlerinden
  // GÖRSEL OLARAK AYRIŞIR ve açıkça etiketlenir: bu kaynaktan aktarım değil, yorum.
  if ((metinler.yorum ?? []).length) {
    b.push(`<div class="ds-yorum">`);
    b.push(`<h2>Startup Doktoru yorumu</h2>`);
    for (const p of metinler.yorum) b.push(par(p));
    b.push(`</div>`);
  }

  // 5) Kaynak — telif ve şeffaflık
  if (kaynak?.url) {
    b.push(`<hr>`);
    b.push(`<p><em>Kaynak: <a href="${kacar(kaynak.url)}" rel="nofollow noopener" target="_blank">${kacar(kaynak.ad ?? "haber")}</a>${kaynak.baslik ? ` — ${kacar(kaynak.baslik)}` : ""}</em></p>`);
  }

  // 5b) Soru-cevap — kapsamı genişletir, okuma yükünü artırmaz.
  if ((metinler.sorular ?? []).length) {
    b.push(`<hr>`, `<h2>Sık sorulanlar</h2>`);
    for (const sc of metinler.sorular) {
      if (!sc?.soru || !sc?.cevap) continue;
      b.push(`<h3>${kacar(sc.soru)}</h3>`, par(sc.cevap));
    }
  }

  // 6) CTA
  b.push(`<hr>`);
  b.push(`<h2>Sen de yatırım almak istiyorsan</h2>`);
  b.push(`<p>Yatırımcı karşısına çıkmadan önce bilmen gerekenleri <a href="/free-training">ücretsiz eğitimde</a> anlatıyorum.</p>`);

  return b.join("\n");
}

// ── Yayın ─────────────────────────────────────────────────────────────────
export async function yayinla(kayit, metinler, { paket, kuru = false } = {}) {
  const u = kayit.kunye;
  const baslik = `${u.sirket} ne iş yapıyor?`;
  const slug = slugify(`${u.sirket}-ne-is-yapiyor`);
  const tutar = tutarYaz(u.tutar?.deger, u.tutar?.birim);

  const { kapak, govde } = await gorselleriHazirla(paket, slug);
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
  const { data: mevcut } = await db.from("ds_blog_posts").select("id").eq("slug", slug).maybeSingle();
  if (mevcut) {
    const { error } = await db.from("ds_blog_posts").update(satir).eq("id", mevcut.id);
    if (error) throw new Error(error.message);
    return { satir, kapak, govde, yazildi: true, guncellendi: true };
  }
  const { error } = await db.from("ds_blog_posts").insert([satir]);
  if (error) throw new Error(error.message);
  return { satir, kapak, govde, yazildi: true, guncellendi: false };
}

// ── CLI ───────────────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const dosya = process.argv[2];
  const kuru = process.argv.includes("--kuru");
  if (!dosya) {
    console.error("Kullanım: node --env-file=.env.local scripts/haber/yayinla.mjs kuyruk/<kayit>.json [--kuru]");
    process.exit(1);
  }
  const kayit = JSON.parse(readFileSync(dosya, "utf8"));
  const paket = join(PAKET_DIR, kayit.id);
  if (!existsSync(paket)) {
    console.error(`Paket yok: ${paket}\nÖnce: node scripts/haber/varlik.mjs ${dosya}`);
    process.exit(1);
  }
  const metinYolu = join(paket, "metin.json");
  const metinler = existsSync(metinYolu) ? JSON.parse(readFileSync(metinYolu, "utf8")) : {};
  if (!existsSync(metinYolu)) console.log("⚠  metin.json yok — yalnız künye ve yatırım bölümleri yazılacak.\n");

  if (!kuru && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("SUPABASE_SERVICE_ROLE_KEY yok. --env-file=.env.local ile çalıştır ya da --kuru kullan.");
    process.exit(1);
  }

  const r = await yayinla(kayit, metinler, { paket, kuru });
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
