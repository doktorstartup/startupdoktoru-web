// Haber toplayıcı — KAYDIRMALI POST (carousel) ÜRETİMİ.
//
// Referans düzen (upcornco): kapak = tam kadraj fotoğraf + koyu degrade + SORU başlık;
// iç slide'lar = açık zemin, üstte tekrar eden etiket, 2 kısa paragraf (taşıyıcı bilgiler
// kalın), altta yuvarlak köşeli görsel, sol altta sayaç + marka, sağ altta ok.
//
// Instagram carousel doğru boyut: 1080×1350 (4:5). Güvenli kenar: yanlar 60 px, üst/alt 80 px
// (profil ızgarası her postu 3:4'e kırpıyor, genişlik 1012 px'e iniyor).
//
// RAKAM KURALI — bu dosyanın en önemli kuralı:
// Tutar, tur tipi ve değerleme kuyruk kaydından MEKANİK olarak basılır. Model bunları
// yazmaz, yalnız yorum cümlelerini yazar. Sayısal yalan "doğrula" diyerek değil,
// yazdırmayarak imkânsız kılınıyor.
//
// Kullanım:
//   node scripts/haber/carousel.mjs kuyruk/2026-08-28_hubx-5ca6.json

import { chromium } from "playwright-core";
import ffmpeg from "ffmpeg-static";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

export const GENISLIK = 1080, YUKSEKLIK = 1350;

// Startup Doktoru paleti (src/app/globals.css ile aynı). Carousel'de zemin AÇIK:
// akışta okunurluk için. Marka bağı lacivert metin + turkuaz vurgu ile kuruluyor.
// Startup Doktoru paleti. Turkuaz LOGODAN ölçüldü (#00A0C3, en sık ikinci renk);
// site globals.css'te koyu zemin için daha parlak #00E5FF kullanıyor. Açık slaytta
// logo turkuazı, koyu slaytta site turkuazı — ikisi de aynı marka ailesi.
const RENK = {
  zemin: "#F2F5F8",
  kart: "#FFFFFF",
  lacivert: "#050B14",   // globals.css --background
  kartKoyu: "#0E1726",   // globals.css --card
  metin: "#0B1420",
  soluk: "#5A6B80",
  vurgu: "#00A0C3",      // LOGO turkuazı — açık zeminde
  vurguParlak: "#00E5FF", // site turkuazı — koyu zeminde
  cizgi: "#D5DDE6",
};

// Logo — İKİ SÜRÜM, yüzeye göre seçilir. Markanın kendi şeffaf dosyaları:
//   logo-sd-beyaz.png → KOYU yüzeyler (kapak fotoğrafı, kapanış slaytı)
//   logo-sd-siyah.png → AÇIK yüzeyler (iç slaytlar)
// Tek sürümü filtreyle zorlamak yerine doğru sürümü kullanmak: parlaklık/gölge
// hilesi gerekmiyor, her iki zeminde de tam kontrast.
function logoData(dosya) {
  try {
    return `data:image/png;base64,${readFileSync(resolve(`public/${dosya}`)).toString("base64")}`;
  } catch { return null; }
}

const kacar = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// **kalın** işaretlemesini <b> yapar. Metin ÖNCE kaçırılır, sonra bu uygulanır —
// yani model çıktısı HTML olarak yorumlanamaz.
const kalinla = (s) => kacar(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");

const paraBirimi = { USD: "dolar", EUR: "euro", GBP: "sterlin", TRY: "TL" };

// 75000000 USD → "75 milyon dolar"
export function tutarYaz(deger, birim) {
  if (!Number.isFinite(deger) || deger <= 0) return null;
  const b = paraBirimi[birim] ?? birim ?? "";
  const tr = (n) => String(n).replace(".", ",");
  if (deger >= 1e9) return `${tr(+(deger / 1e9).toFixed(1))} milyar ${b}`.trim();
  if (deger >= 1e6) return `${tr(+(deger / 1e6).toFixed(deger % 1e6 ? 1 : 0))} milyon ${b}`.trim();
  if (deger >= 1e3) return `${tr(Math.round(deger / 1e3))} bin ${b}`.trim();
  return `${deger} ${b}`.trim();
}

const TUR_TR = {
  "pre-seed": "tohum öncesi", seed: "tohum", "series-a": "A Serisi",
  "series-b": "B Serisi", "series-c+": "C Serisi ve sonrası", bridge: "köprü", grant: "hibe", debt: "borç",
};

// ── Taslak slayt içeriği ──────────────────────────────────────────────────
// Olgular kayıttan mekanik gelir; yorum cümleleri model tarafından doldurulur
// (metin adımı). Model doldurmazsa slayt düşer, uydurma metin basılmaz.
export function slaytTaslagi(kayit, metinler = {}) {
  const u = kayit.kunye;
  const tutar = tutarYaz(u.tutar?.deger, u.tutar?.birim);
  const tur = TUR_TR[u.tur_tipi] ?? null;
  const yatirimcilar = [u.lider, ...(u.katilanlar ?? [])].filter(Boolean);
  const etiket = `${u.sirket} NE İŞ YAPIYOR?`;

  const s = [];

  // 1 — Kapak: tam kadraj fotoğraf + SORU başlık
  s.push({
    tip: "kapak", etiket: "HABER",
    baslik: metinler.kapak_baslik
      ?? (tutar ? `${tutar} yatırım alan ${u.sirket} ne iş yapıyor?` : `${u.sirket} ne iş yapıyor?`),
  });

  // 2 — Kuruluş / ne yapıyor
  if (metinler.kurulus) s.push({ tip: "ic", etiket, paragraflar: metinler.kurulus });

  // 3 — Odak / ürün
  if (metinler.odak) s.push({ tip: "ic", etiket, paragraflar: metinler.odak });

  // 4 — Ölçek / önceki yatırım
  if (metinler.olcek) s.push({ tip: "ic", etiket, paragraflar: metinler.olcek });

  // 5 — YATIRIM: rakamlar burada, hepsi mekanik
  const y1 = yatirimcilar.length
    ? `${u.sirket}, **${yatirimcilar[0]}**${yatirimcilar.length > 1 ? ` ve **${yatirimcilar.length - 1}** yatırımcıdan` : "'dan"} ${tutar ? `**${tutar}**` : "yatırım"} aldı.`
    : (tutar ? `${u.sirket}, **${tutar}** yatırım aldı.` : null);
  const y2 = tur ? `Tur **${tur}** aşamasında gerçekleşti.` : null;
  if (y1) s.push({ tip: "ic", etiket, paragraflar: [y1, y2].filter(Boolean), kunye: true });

  // Son — CTA
  s.push({
    tip: "kapanis",
    baslik: metinler.cta_baslik ?? "Sen de yatırım alıp milyon dolarlık bir iş kurmak istersen…",
    alt: metinler.cta_alt ?? "Ücretsiz eğitim: startupdoktoru.com",
  });

  return s;
}

// ── HTML ──────────────────────────────────────────────────────────────────
const LOGO_BEYAZ = logoData("logo-sd-beyaz.png");
const LOGO_SIYAH = logoData("logo-sd-siyah.png");

function slaytHtml(s, i, toplam, gorselYolu) {
  const sayac = `${i + 1}/${toplam}`;
  const ok = `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="${RENK.vurgu}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;

  if (s.tip === "kapak") {
    return `<div class="slayt kapak">
      ${gorselYolu ? `<img class="tamkadraj" src="${gorselYolu}" alt="">` : `<div class="tamkadraj bos"></div>`}
      <div class="perde"></div>
      <div class="ust">${LOGO_BEYAZ ? `<img class="kapak-logo" src="${LOGO_BEYAZ}" alt="Startup Doktoru">`
        : `<span class="marka-yazi">STARTUP<span class="nokta">.</span>DOKTORU</span>`}</div>
      <div class="alt">
        <span class="rozet beyaz">${kacar(s.etiket)}</span>
        <h1>${kalinla(s.baslik)}</h1>
      </div>
    </div>`;
  }

  if (s.tip === "kapanis") {
    return `<div class="slayt kapanis">
      <div class="orta">
        <h2>${kalinla(s.baslik)}</h2>
        <p class="cta-alt">${kalinla(s.alt)}</p>
      </div>
      <div class="dip">
        <span class="rozet">${sayac}</span>
        ${LOGO_BEYAZ ? `<img class="dip-logo" src="${LOGO_BEYAZ}" alt="">` : ""}
      </div>
    </div>`;
  }

  return `<div class="slayt ic">
    <div class="ust"><span class="rozet">${kacar(s.etiket)}</span></div>
    <div class="govde">
      ${(s.paragraflar ?? []).map((p) => `<p>${kalinla(p)}</p>`).join("")}
      ${gorselYolu ? `<figure><img src="${gorselYolu}" alt=""></figure>` : ""}
    </div>
    <div class="dip">
      <div class="dip-sol">
        <span class="rozet">${sayac}</span>
        ${LOGO_SIYAH ? `<img class="dip-logo" src="${LOGO_SIYAH}" alt="">` : `<span class="rozet">STARTUP DOKTORU</span>`}
      </div>
      <div class="ok">${ok}</div>
    </div>
  </div>`;
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap&subset=latin,latin-ext');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { width: ${GENISLIK}px; height: ${YUKSEKLIK}px; overflow: hidden;
         font-family: "Space Grotesk", -apple-system, sans-serif; }
  .slayt { width: ${GENISLIK}px; height: ${YUKSEKLIK}px; position: relative;
           background: ${RENK.zemin}; display: flex; flex-direction: column;
           padding: 80px 60px; }

  .rozet { display: inline-flex; align-items: center; height: 54px; padding: 0 26px;
           border: 3px solid ${RENK.vurgu}; border-radius: 999px; color: ${RENK.vurgu};
           font-size: 26px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
           white-space: nowrap; }
  .rozet + .rozet { margin-left: 16px; }
  .rozet.beyaz { border-color: rgba(255,255,255,.85); color: #fff; }

  /* ── kapak ── */
  .kapak { padding: 0; }
  .kapak .tamkadraj { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .kapak .tamkadraj.bos { background: linear-gradient(135deg, #0E1726, ${RENK.lacivert}); }
  /* Üst perde GÜÇLÜ: logo açık gri + turkuaz, ve kapak fotoğrafı parlak olabiliyor
     (ölçüldü: HubX kapağında kum rengi kaya üstünde logo kayboluyordu). */
  .kapak .perde { position: absolute; inset: 0;
    background: linear-gradient(to bottom, rgba(5,11,20,.72) 0%, rgba(5,11,20,.34) 14%,
                rgba(5,11,20,0) 30%, rgba(8,20,42,.74) 62%, rgba(6,16,34,.96) 100%); }
  .kapak .ust { position: absolute; top: 68px; left: 64px; z-index: 2; }
  .kapak .logo { height: 62px; width: auto; filter: brightness(0) invert(1); opacity: .96; }
  .kapak .marka-yazi { color: #fff; font-weight: 700; font-size: 30px; letter-spacing: .14em; }
  .kapak .nokta { color: ${RENK.vurguParlak}; }
  /* Logo beyaz zeminli: koyu yüzeyde beyaz rozet içinde durur. */
  /* Logo ince çizgili ve 2,1:1 oranında — okunması için YER İSTİYOR.
     Ölçüldü: içerik kadrajın %89'unu kaplıyor, kırpacak boşluk yok; çözüm büyütmek. */
  /* Logo artık yazıyı da taşıyor (STARTUP DOKTORU), oran ~2,4:1 — yükseklik daha az yeter.
     Kapakta fotoğrafın parlaklığı her karede değişiyor: gölge okunurluğu garantiler. */
  .kapak-logo { display: block; height: 96px; width: auto;
                filter: drop-shadow(0 2px 10px rgba(0,0,0,.55)); }
  .dip-sol { display: flex; align-items: center; gap: 26px; }
  .dip-logo { height: 62px; width: auto; }
  .kapak .alt { position: absolute; left: 64px; right: 64px; bottom: 78px; z-index: 2; }
  .kapak h1 { margin-top: 26px; color: #fff; font-size: 68px; line-height: 1.13;
              font-weight: 700; letter-spacing: -.022em; text-wrap: balance; }

  /* ── iç ── */
  .ic .ust { flex: 0 0 auto; }
  .ic .govde { flex: 1 1 auto; display: flex; flex-direction: column; justify-content: center;
               gap: 44px; padding: 40px 0; }
  .ic p { color: ${RENK.metin}; font-size: 46px; line-height: 1.38; font-weight: 500; letter-spacing: -.012em; }
  .ic b { font-weight: 700; }
  .ic figure { margin-top: 8px; border: 3px solid ${RENK.vurgu}; border-radius: 28px;
               overflow: hidden; background: ${RENK.kart}; }
  .ic figure img { display: block; width: 100%; height: 430px; object-fit: cover; }
  .dip { flex: 0 0 auto; display: flex; align-items: center; justify-content: space-between; }
  .ok { width: 76px; height: 76px; border: 3px solid ${RENK.vurgu}; border-radius: 999px;
        display: flex; align-items: center; justify-content: center; }

  /* ── kapanış ── */
  .kapanis { background: ${RENK.lacivert}; justify-content: space-between; }
  .kapanis .orta { flex: 1 1 auto; display: flex; flex-direction: column; justify-content: center; }
  .kapanis h2 { color: #fff; font-size: 62px; line-height: 1.2; font-weight: 700;
                letter-spacing: -.02em; text-wrap: balance; }
  .kapanis .cta-alt { margin-top: 34px; color: ${RENK.vurguParlak}; font-size: 40px; font-weight: 600; }
  .kapanis .rozet { border-color: rgba(255,255,255,.5); color: rgba(255,255,255,.85); }
`;

// ── Görsel seçimi ─────────────────────────────────────────────────────────
// Paketten indirilmiş görseller. Kapak için EN BÜYÜĞÜ, iç slide'lar için sırayla.
// Görselin "fotoğraf mı, dekoratif şekil mi" ölçüsü: 32×32 griye indirip benzersiz
// seviye sayısı. Fotoğrafta yüksek, düz/bulanık dekoratif şekilde düşük.
// BOYUTA GÖRE SIRALAMA YETMİYOR — ölçüldü: HubX'in en büyük görseli dev bir bulanık
// "X" harfiydi ve kapak olarak seçilmişti.
async function entropiOlc(dosya) {
  try {
    const buf = await new Promise((cozum, hata) => {
      const pr = spawn(ffmpeg, ["-v", "error", "-i", dosya, "-vf", "scale=32:32,format=gray", "-f", "rawvideo", "-"],
        { stdio: ["ignore", "pipe", "pipe"] });
      const p = [];
      pr.stdout.on("data", (d) => p.push(d));
      pr.on("close", (k) => (k === 0 ? cozum(Buffer.concat(p)) : hata(new Error("okunamadi"))));
    });
    return new Set(buf).size;
  } catch { return 0; }
}

export async function gorselSirala(paket) {
  const dizin = join(paket, "02_gorsel");
  if (!existsSync(dizin)) return [];
  const adaylar = readdirSync(dizin)
    .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f) && !f.startsWith("05_logo"));
  const sonuc = [];
  for (const f of adaylar) sonuc.push({ dosya: f, entropi: await entropiOlc(resolve(join(dizin, f))) });
  return sonuc.sort((a, b) => b.entropi - a.entropi);
}

function paketGorselleri(paket, siraliAdlar = null) {
  const dizin = join(paket, "02_gorsel");
  if (!existsSync(dizin)) return { kapak: null, icler: [], logo: null };
  const hepsi = readdirSync(dizin).filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f));
  const logo = hepsi.find((f) => f.startsWith("05_logo")) ?? null;
  const site = hepsi.filter((f) => f.startsWith("10_site"));
  const app = hepsi.filter((f) => f.startsWith("20_appstore"));
  const hero = hepsi.find((f) => f.startsWith("01_hero")) ?? null;
  const sirala = siraliAdlar ?? [...site, ...app];
  // file:// KULLANILMAZ: setContent sayfaya about:blank kaynağı veriyor ve tarayıcı
  // yerel dosya isteklerini engelliyor (ölçüldü: kapak görseli kırık ikon çıktı).
  // Görseller base64 olarak gömülüyor — kaynak sorunu tamamen ortadan kalkıyor.
  const gom = (f) => {
    if (!f) return null;
    try {
      const tam = resolve(join(dizin, f));
      const uzanti = f.split(".").pop().toLowerCase();
      const tip = uzanti === "png" ? "image/png" : uzanti === "webp" ? "image/webp" : "image/jpeg";
      return `data:${tip};base64,${readFileSync(tam).toString("base64")}`;
    } catch { return null; }
  };
  return {
    kapak: gom(sirala[0] ?? hero),
    icler: sirala.slice(1).map(gom),
    logo: gom(logo),
  };
}

// ── Çizim ─────────────────────────────────────────────────────────────────
export async function carouselCiz(slaytlar, paket, { dizin = "03_carousel", kapakNo = null } = {}) {
  const cikti = join(paket, dizin);
  mkdirSync(cikti, { recursive: true });

  // Entropiye göre sırala: fotoğraflar üste, dekoratif şekiller alta.
  const puanli = await gorselSirala(paket);
  // KAPAK site fotoğrafından seçilir. App Store görselleri arayüz ekranıdır — iç
  // slide'da iyi durur ama kapakta değil (referans hesap kapakta ekip/kurucu fotoğrafı
  // kullanıyor). Ölçüldü: App Store ekranları entropide site fotoğraflarını geçiyor.
  const sitePuanli = puanli.filter((x) => x.dosya.startsWith("10_site"));
  const digerleri = puanli.filter((x) => !x.dosya.startsWith("10_site"));
  let sirali = [...sitePuanli, ...digerleri].map((x) => x.dosya);

  if (kapakNo != null) {
    // Operatör kapağı seçtiyse (--gorseller listesindeki numara) onu başa al.
    const tumSirali = puanli.map((x) => x.dosya);
    const secilen = tumSirali[kapakNo - 1];
    if (secilen) sirali = [secilen, ...sirali.filter((f) => f !== secilen)];
  }
  const g = paketGorselleri(paket, sirali.length ? sirali : null);

  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ viewport: { width: GENISLIK, height: YUKSEKLIK }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const yazilan = [];
  try {
    let icSira = 0;
    for (const [i, s] of slaytlar.entries()) {
      // Görseller SIRAYLA dağıtılır: slayt sayısı değiştiğinde indeks kaymasın.
      let gorsel = null;
      if (s.tip === "kapak") gorsel = g.kapak;
      else if (s.tip === "ic" && s.gorsel !== false) {
        gorsel = g.icler[icSira % Math.max(1, g.icler.length)] ?? null;
        icSira++;
      }
      const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><style>${CSS}</style></head>
        <body>${slaytHtml(s, i, slaytlar.length, gorsel)}</body></html>`;
      await page.setContent(html, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready).catch(() => {});
      await page.waitForTimeout(220);
      const ad = `slide_${String(i + 1).padStart(2, "0")}.png`;
      await page.screenshot({ path: join(cikti, ad) });
      yazilan.push(ad);
    }
  } finally {
    await browser.close().catch(() => {});
  }
  return { dizin: cikti, dosyalar: yazilan };
}

// ── CLI ───────────────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const dosya = process.argv[2];
  if (!dosya) { console.error("Kullanım: node scripts/haber/carousel.mjs kuyruk/<kayit>.json"); process.exit(1); }
  const kayit = JSON.parse(readFileSync(dosya, "utf8"));
  const paket = join(process.env.HABER_PAKET_DIR || "paketler", kayit.id);
  if (!existsSync(paket)) { console.error(`Paket yok: ${paket}\nÖnce: node scripts/haber/varlik.mjs ${dosya}`); process.exit(1); }

  // Metin dosyası varsa kullan; yoksa yalnız olgu slaytları üretilir.
  const metinYolu = join(paket, "metin.json");
  const metinler = existsSync(metinYolu) ? JSON.parse(readFileSync(metinYolu, "utf8")) : {};
  if (!existsSync(metinYolu)) {
    console.log("⚠  metin.json yok — yalnız olgu slaytları üretiliyor (kapak + yatırım + CTA).");
    console.log("   Yorum slaytları için metin adımını çalıştır.\n");
  }

  const ki = process.argv.indexOf("--kapak");
  const kapakNo = ki > -1 ? Number(process.argv[ki + 1]) : null;

  if (process.argv.includes("--gorseller")) {
    // Operatör kapağı kendi seçsin: adaylar entropi sırasıyla listelenir.
    const liste = await gorselSirala(paket);
    console.log("Görsel adayları (entropi = fotoğraf olma ihtimali, yüksek olan üstte):\n");
    liste.forEach((x, i) => console.log(`  ${String(i + 1).padStart(2)}. entropi ${String(x.entropi).padStart(3)}  ${x.dosya}`));
    console.log("\nKapağı seçmek için:  --kapak <numara>");
    process.exit(0);
  }

  const slaytlar = slaytTaslagi(kayit, metinler);
  const { dizin, dosyalar } = await carouselCiz(slaytlar, paket, { kapakNo });
  console.log(`${dosyalar.length} slayt → ${dizin}`);
  for (const [i, d] of dosyalar.entries()) console.log(`  ${d}  ${slaytlar[i].tip}`);
  console.log("\nGörselleri değiştirmek için:  --gorseller  (liste)   --kapak <n>  (kapağı seç)");
}
