// FİKİR → BLOG YAZISI.
//
// Haber hattından AYRI bir yol: kaynağı bir haber değil, Eser'in kendi fikri.
// Yazı yapılandırılmış JSON olarak yazilar/<slug>.json içinde durur; bu dosya onu
// HTML'e çevirir, markalı görselleri üretir ve ds_blog_posts'a yazar.
//
// KAYNAK KURALI — haber hattındakinden FARKLI ama aynı ilkeye dayanır:
// Haber yazılarında her iddia kaynak metinde birebir aranır. Burada kaynak metin yok;
// onun yerine her SOMUT İDDİA (rakam, tarih, şirket adı) bir kaynağa bağlanmak zorunda.
// `kaynaklar` boşken sayı içeren cümle yayınlanamaz — dogrulaKaynak() bunu zorlar.
// Gerekçe: fikir yazısı olması uydurma istatistik yazma izni değildir.
//
// Kullanım:
//   node scripts/haber/yazi.mjs yazilar/<slug>.json --kuru
//   node --env-file=.env.local scripts/haber/yazi.mjs yazilar/<slug>.json

import { createClient } from "@supabase/supabase-js";
import { readFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { gorselleriCiz } from "./gorsel.mjs";

const GORSEL_KOK = "public/haber";

const TR = { ç:"c", ğ:"g", ı:"i", ö:"o", ş:"s", ü:"u", İ:"i", Ç:"c", Ğ:"g", Ö:"o", Ş:"s", Ü:"u" };
export const slugify = (s) => (s || "").trim()
  .replace(/[çğıöşüİÇĞÖŞÜ]/g, (m) => TR[m] || m)
  .toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-")
  .replace(/-+/g, "-").replace(/^-|-$/g, "");

const kacar = (s) => String(s ?? "").replace(/[&<>"]/g, (c) =>
  ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]));
const zengin = (s) => kacar(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

// ── Uzunluk hedefleri ─────────────────────────────────────────────────────
// 2026 verisi iki farklı yöne işaret ediyor ve ikisi de doğru:
//  · Klasik Google sıralaması: ilk 10'daki yazılar ortalama 1.447 kelime (Backlinko),
//    SEMrush ölçümünde 2.450'ye kadar. Tatlı nokta 1.500-2.500. 800'ün altı ve
//    3.500'ün üstü ikisi de daha kötü performans veriyor.
//  · Yapay zeka aramaları (AI Overviews): alıntılanan sayfalar ortalama 1.282 kelime,
//    AMA alıntılananların %53,4'ü 1.000 kelimenin ALTINDA. Yani uzunluk şart değil;
//    şart olan bölümlenmiş, kolay alıntılanabilir yapı.
// Sonuç: uzunluk tek başına sıralama getirmiyor, KAPSAM getiriyor. Hedef bant
// yazı tipine göre değişiyor — haber kısa, analiz uzun olmalı.
export const HEDEF = {
  // Taban BİLEREK 800 — araştırmadaki klasik SEO tatlı noktası 1.500-2.500 ama
  // yapay zeka aramalarında alıntılanan sayfaların %53,4'ü 1.000 kelimenin ALTINDA.
  // Okuma yükünü artırmamak için kısa taraf seçildi; kapsam dolguyla değil,
  // soru-cevap bloğuyla genişletiliyor.
  analiz:  { alt: 800,  ust: 2200, ad: "fikir/analiz yazısı" },
  rehber:  { alt: 1800, ust: 3000, ad: "nasıl yapılır rehberi" },
  liste:   { alt: 1000, ust: 1800, ad: "liste yazısı" },
  haber:   { alt: 300,  ust: 800,  ad: "haber/güncelleme" },
};

export function uzunlukDegerlendir(kelime, tip = "analiz") {
  const h = HEDEF[tip] ?? HEDEF.analiz;
  if (kelime < h.alt) return { durum: "kısa", h, fark: h.alt - kelime };
  if (kelime > h.ust) return { durum: "uzun", h, fark: kelime - h.ust };
  return { durum: "uygun", h, fark: 0 };
}

// ── Kaynak kapısı ─────────────────────────────────────────────────────────
// Somut iddia = içinde 2+ haneli sayı geçen cümle. Böyle bir cümle varsa yazının
// kaynak listesi boş olamaz. Kaynağı olmayan istatistik yazının en zayıf yeridir.
export function dogrulaKaynak(yazi) {
  const uyarilar = [];
  const metinler = (yazi.bolumler ?? [])
    .filter((b) => b.tip === "p" || b.tip === "alinti")
    .map((b) => b.metin ?? "");
  const sayiliCumle = metinler.filter((m) => /\d{2,}/.test(m));
  if (sayiliCumle.length && !(yazi.kaynaklar ?? []).length) {
    uyarilar.push(`${sayiliCumle.length} cümlede sayı var ama yazının kaynak listesi BOŞ`);
  }
  // Her kaynağın gerçek bir URL'i olmalı.
  for (const k of yazi.kaynaklar ?? []) {
    if (!/^https?:\/\//.test(k.url ?? "")) uyarilar.push(`geçersiz kaynak URL'i: ${k.ad ?? "?"}`);
  }
  return uyarilar;
}

// ── Gövde HTML'i — şablon üretir ──────────────────────────────────────────
export function govdeYaz(yazi, gorselYollari) {
  const g = [...gorselYollari];
  const b = [];
  for (const bol of yazi.bolumler ?? []) {
    if (bol.tip === "h2") b.push(`<h2>${kacar(bol.metin)}</h2>`);
    else if (bol.tip === "h3") b.push(`<h3>${kacar(bol.metin)}</h3>`);
    else if (bol.tip === "p") b.push(`<p>${zengin(bol.metin)}</p>`);
    else if (bol.tip === "liste") b.push(`<ul>${(bol.maddeler ?? []).map((m) => `<li>${zengin(m)}</li>`).join("")}</ul>`);
    else if (bol.tip === "alinti") b.push(`<blockquote>${zengin(bol.metin)}</blockquote>`);
    else if (bol.tip === "ayrac") b.push(`<hr>`);
    else if (bol.tip === "gorsel") {
      const yol = g.shift();
      if (yol) b.push(`<figure><img src="${kacar(yol)}" alt="${kacar(bol.gorsel?.baslik ?? "")}" loading="lazy">${
        bol.altyazi ? `<figcaption>${kacar(bol.altyazi)}</figcaption>` : ""}</figure>`);
    }
  }

  // SORU-CEVAP. Üç izleyiciyi birden besleyen tek blok:
  //  · Google: kapsamı genişletir (komşu sorulara cevap verir) — uzunluk değil KAPSAM
  //    sıralama getiriyor.
  //  · Yapay zeka aramaları: alıntılanan parça neredeyse hep 50-200 kelime; "net soru +
  //    net cevap" tam da motorların koparıp alıntıladığı biçim.
  //  · İnsan: atlanabilir olduğu için okuma yükünü artırmaz.
  if ((yazi.sorular ?? []).length) {
    b.push(`<hr>`, `<h2>${kacar(yazi.sorular_baslik ?? "Sık sorulanlar")}</h2>`);
    for (const sc of yazi.sorular) {
      if (!sc?.soru || !sc?.cevap) continue;
      b.push(`<h3>${kacar(sc.soru)}</h3>`);
      b.push(`<p>${zengin(sc.cevap)}</p>`);
    }
  }

  if ((yazi.kaynaklar ?? []).length) {
    b.push(`<hr>`, `<h2>Kaynaklar</h2>`);
    b.push(`<ul>${yazi.kaynaklar.map((k) =>
      `<li><a href="${kacar(k.url)}" rel="nofollow noopener" target="_blank">${kacar(k.ad)}</a>${
        k.not ? ` — ${kacar(k.not)}` : ""}</li>`).join("")}</ul>`);
  }

  // CTA. JSON'da HTML BULUNMAZ — kaçırma kuralı gereği ham etiket metin olarak basılırdı
  // (ölçüldü: ilk sürümde <a href=...> okuyucuya aynen görünüyordu). Bağı şablon kurar.
  b.push(`<hr>`);
  b.push(`<h2>${kacar(yazi.cta_baslik ?? "Bir adım daha")}</h2>`);
  const ctaMetin = zengin(yazi.cta ?? "Girişimini kurarken hangi kararı kime devrettiğini bilmek en az ürünün kadar önemli.");
  const bag = yazi.cta_link
    ? ` <a href="${kacar(yazi.cta_link)}">${kacar(yazi.cta_link_metin ?? "Ücretsiz eğitime göz at")}</a>.`
    : "";
  b.push(`<p>${ctaMetin}${bag}</p>`);
  return b.join("\n");
}

// ── Yayın ─────────────────────────────────────────────────────────────────
export async function yayinlaYazi(yazi, { kuru = false } = {}) {
  const slug = yazi.slug || slugify(yazi.baslik);
  const hedef = join(GORSEL_KOK, slug);

  // Görseller: bölümlerdeki `gorsel` tipleri sırayla çizilir.
  const gorselBolumleri = (yazi.bolumler ?? []).filter((x) => x.tip === "gorsel" && x.gorsel);
  let yollar = [];
  if (gorselBolumleri.length) {
    rmSync(hedef, { recursive: true, force: true });
    mkdirSync(hedef, { recursive: true });
    const is = gorselBolumleri.map((x, i) => ({
      gorsel: x.gorsel, koyu: !!x.koyu, yol: join(hedef, `g-${i + 1}.png`),
    }));
    await gorselleriCiz(is, { olcu: "blog" });
    yollar = is.map((x, i) => `/haber/${slug}/g-${i + 1}.png`);
  }

  // KAPAK ayrı üretilir. Gövdedeki ilk görseli kapak yapmak onu sayfada İKİ KEZ
  // gösteriyordu (bir kez kapak, bir kez figür). Kapak, yazının başlığını taşıyan
  // kendi kartı olsun — hem tekrar biter hem sosyal önizleme için doğru görsel olur.
  let kapak = null;
  if (yazi.kapak !== false) {
    mkdirSync(hedef, { recursive: true });
    await gorselleriCiz([{
      yol: join(hedef, "kapak.png"), koyu: true,
      gorsel: { tip: "alinti", etiket: yazi.kapak_etiket ?? "Yazı",
                metin: yazi.kapak_metin ?? yazi.baslik, alt: "Startup Doktoru" },
    }], { olcu: "blog" });
    kapak = `/haber/${slug}/kapak.png`;
  }
  const content = govdeYaz(yazi, yollar);
  const satir = {
    title: yazi.baslik,
    slug,
    content,
    seo_title: yazi.seo_title ?? yazi.baslik,
    seo_description: (yazi.seo_description ?? "").slice(0, 300),
    cover_image: kapak,
  };

  if (kuru) return { satir, yollar, yazildi: false };

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: mevcut } = await db.from("ds_blog_posts").select("id").eq("slug", slug).maybeSingle();
  if (mevcut) {
    const { error } = await db.from("ds_blog_posts").update(satir).eq("id", mevcut.id);
    if (error) throw new Error(error.message);
    return { satir, yollar, yazildi: true, guncellendi: true };
  }
  // Yeni yazı TASLAK olarak basılır — yayına alma kararı admin panelinden verilir.
  // Güncellemede durum'a dokunulmaz: yayındaki bir yazı yeniden basılınca yayında kalır.
  const { error } = await db.from("ds_blog_posts").insert([{ ...satir, durum: "taslak" }]);
  if (error) throw new Error(error.message);
  return { satir, yollar, yazildi: true, guncellendi: false };
}

// ── CLI ───────────────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const dosya = process.argv[2];
  const kuru = process.argv.includes("--kuru");
  if (!dosya) { console.error("Kullanım: node scripts/haber/yazi.mjs yazilar/<slug>.json [--kuru]"); process.exit(1); }
  const yazi = JSON.parse(readFileSync(dosya, "utf8"));

  const uyarilar = dogrulaKaynak(yazi);
  if (uyarilar.length) {
    console.error("KAYNAK KAPISI:");
    for (const u of uyarilar) console.error(`  ✗ ${u}`);
    process.exit(1);
  }

  if (!kuru && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("SUPABASE_SERVICE_ROLE_KEY yok. --env-file=.env.local ile çalıştır ya da --kuru kullan.");
    process.exit(1);
  }

  const r = await yayinlaYazi(yazi, { kuru });
  const kelime = r.satir.content.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  const u = uzunlukDegerlendir(kelime, yazi.tip ?? "analiz");
  const isaret = { uygun: "✓", kısa: "⚠", uzun: "⚠" }[u.durum];
  console.log(`başlık : ${r.satir.title}`);
  console.log(`slug   : /blog/${r.satir.slug}`);
  console.log(`görsel : ${r.yollar.length} adet`);
  console.log(`uzunluk: ~${kelime} kelime  ${isaret} ${u.durum}` +
    (u.durum === "uygun" ? ` (${u.h.ad} hedefi ${u.h.alt}-${u.h.ust})`
      : ` — ${u.h.ad} hedefi ${u.h.alt}-${u.h.ust}, ${u.fark} kelime ${u.durum === "kısa" ? "eksik" : "fazla"}`));
  console.log(`kaynak : ${(yazi.kaynaklar ?? []).length} adet`);
  console.log(`durum  : ${r.yazildi ? (r.guncellendi ? "güncellendi" : "yeni yazı eklendi") : "KURU KOŞU"}`);
}
