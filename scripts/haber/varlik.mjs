// Haber toplayıcı — GÖRSEL/VİDEO VARLIK ÇEKİMİ.
//
// Operatörün eline CapCut'a sürüklenebilir bir klasör bırakır:
//   paketler/<slug>/
//     01_video/    9:16 ve 4:5 kaydırma videoları  (senin üstüne çekeceğin B-roll)
//     02_gorsel/   hero, mobil, şirket fotoğrafları, logo, App Store görselleri
//     brand.json   marka renkleri + logo URL'i
//     QC.json      hangi kapı geçti, hangi kapı eledi
//
// ÖNEMLİ — GÖRSEL STRATEJİSİ:
// Referans hesabın (upcornco) carousel'lerinde ÜRÜN EKRANI yok; kurucu, ofis ve ekip
// FOTOĞRAFLARI var. Ölçüldü: arzın ~3/4'ünde ürün ekranı diye bir şey yok (donanım,
// biyoteknoloji, ilaç) ve yazılım olanların ürünü giriş duvarının arkasında.
// Bu yüzden iki ayrı iş yapılır:
//   (a) kaydırma videosu  → senin video çekimin için B-roll  (bizim farkımız)
//   (b) şirket fotoğrafları → carousel slide'ları için        (upcorn'un kullandığı malzeme)
// Landing sayfasındaki görseller "ürün ekranı" diye ETİKETLENMEZ: socure.com'un
// landing görselleri müşteri logolarıdır (Citi, Coinbase…), onları Socure'un ürünü gibi
// sunmak yanlış olurdu. Ham malzeme olarak veriliyor, etiketi operatör koyuyor.
//
// Bu dosya OPERATÖRÜN MAKİNESİNDE koşar (GitHub Actions'ta değil): tarayıcı ister.
// Kullanım:
//   node scripts/haber/varlik.mjs kuyruk/2026-08-28_hubx-5ca6.json
//   node scripts/haber/varlik.mjs --domain hubx.co --ad HubX

import { chromium } from "playwright-core";
import ffmpeg from "ffmpeg-static";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync, readFileSync, existsSync, statSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

// Paketler repoya girmez (.gitignore). Yeri HABER_PAKET_DIR ile değiştirilebilir —
// örneğin Google Drive senkron klasörü, böylece paketler otomatik yedeklenir.
export const PAKET_DIR = process.env.HABER_PAKET_DIR || "paketler";

// Ölçülmüş parametreler — değiştirmeden önce QC'yi tekrar koştur.
const FPS = 30;
// OKUNABİLİR HIZ. İlk sürüm sayfanın TAMAMINI 4 saniyede geçiyordu: 12.160 px / 4 sn
// = saniyede ~3.000 piksel, hiçbir şey okunmuyordu. Artık hız sabit, MESAFE ondan türüyor:
// uzun sayfanın tamamı değil, o sürede okunabilecek kadarı geziliyor.
let HIZ_PX_SN = 340;            // --hiz ile değişir
let SURE_SN = 8;                // --sure ile değişir
// Başta ve sonda duraklama: ilk kare (hero) ve son kare okunabilsin.
const DURAK_ORAN = 0.10;        // süренin %10'u başta, %10'u sonda
const MOBIL = { width: 360, height: 640, dsf: 3 };   // ×3 = tam 1080×1920
const DIKEY = { width: 360, height: 450, dsf: 3 };   // ×3 = tam 1080×1350 (Instagram 4:5)
const ZAMAN_ASIMI = 30_000;

// Çerez/consent banner'ı: önce kozmetik CSS, sonra rol tabanlı tıklama yedeği.
// overflow:auto ŞART — banner gizlenince sayfa kilitli kalıyor ve video donuk çıkıyor.
const CEREZ_CSS = `
  [id*="cookie" i], [class*="cookie" i], [id*="consent" i], [class*="consent" i],
  [id*="gdpr" i], [class*="gdpr" i], [id*="usercentrics" i], [aria-label*="cookie" i],
  #onetrust-consent-sdk, #CybotCookiebotDialog, .cky-consent-container, .cc-window,
  [class*="cmp-" i], [id*="didomi" i] { display: none !important; }
`;
// Bazı banner'lar gizlenince sayfa kilitli kalır ve video donuk çıkar. Çözümü bu:
// AMA KÖRLEMESİNE UYGULANMAZ — ölçüldü: hubx.co gayet normal kayarken bu satır
// kaydırmayı tamamen öldürüyor (site html'e 640px yükseklik veriyor).
// Önce kaydırma denenir, KİLİTLİ ÇIKARSA uygulanır.
const KILIT_ACMA_CSS = `html, body { overflow: auto !important; position: static !important; }`;
const KABUL_KALIP = /^(accept|allow|agree|got it|ok|kabul|tümünü kabul|anladım)/i;

// Bot duvarı işaretçileri — Cloudflare 403 yerine 200 + meydan okuma sayfası dönebiliyor.
const BOT_DUVARI = /ray id|cloudflare|verify you are human|doğrulayın|güvenlik doğrulaması|access denied|just a moment|checking your browser|security checkpoint/i;

// Hız/süre dışarıdan ayarlanabilir (CLI ya da çağıran kod).
export function ayarla({ hiz, sure } = {}) {
  if (Number.isFinite(hiz) && hiz > 0) HIZ_PX_SN = hiz;
  if (Number.isFinite(sure) && sure > 0) SURE_SN = sure;
  return { hiz: HIZ_PX_SN, sure: SURE_SN };
}

const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
const kacKare = (n) => String(n).padStart(4, "0");

// ── ffmpeg ────────────────────────────────────────────────────────────────
function ffmpegCalistir(args) {
  return new Promise((cozum, hata) => {
    const p = spawn(ffmpeg, args, { stdio: ["ignore", "pipe", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => { err += d; });
    p.on("close", (kod) => (kod === 0 ? cozum(err) : hata(new Error(`ffmpeg ${kod}: ${err.slice(-400)}`))));
  });
}

// mp4 bit hızı (kb/s). Bot duvarı videoları ~156, gerçek sayfalar 3.900-11.600 ölçüldü.
async function bitHizi(mp4, sureSn = SURE_SN) {
  const bayt = statSync(mp4).size;
  return Math.round((bayt * 8) / sureSn / 1000);
}

// Benzersiz gri seviye: boş/bembeyaz görüntüyü yakalar. Gerçek sayfalar 93-235 ölçüldü.
async function griSeviye(png) {
  const cikti = await new Promise((cozum, hata) => {
    const p = spawn(ffmpeg, ["-v", "error", "-i", png, "-vf", "scale=32:32,format=gray", "-f", "rawvideo", "-"],
      { stdio: ["ignore", "pipe", "pipe"] });
    const parcalar = [];
    p.stdout.on("data", (d) => parcalar.push(d));
    p.on("close", (k) => (k === 0 ? cozum(Buffer.concat(parcalar)) : hata(new Error("gri okunamadi"))));
  });
  return new Set(cikti).size;
}

// ── Sayfa hazırlığı ───────────────────────────────────────────────────────
async function sayfaHazirla(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: ZAMAN_ASIMI });
  await page.addStyleTag({ content: CEREZ_CSS }).catch(() => {});
  // CSS yetmezse butona bas (bazı banner'lar shadow DOM'da).
  for (const rol of ["button", "link"]) {
    const dugmeler = await page.getByRole(rol).all().catch(() => []);
    for (const d of dugmeler.slice(0, 25)) {
      const m = (await d.textContent().catch(() => "") ?? "").trim();
      if (m && KABUL_KALIP.test(m)) { await d.click({ timeout: 1500 }).catch(() => {}); break; }
    }
  }
  await page.addStyleTag({ content: CEREZ_CSS }).catch(() => {});

  // Kaydırma gerçekten çalışıyor mu? Fareyi ortaya alıp küçük bir tekerlek denemesi.
  const kaydiMi = async () => {
    await page.mouse.move(180, 320).catch(() => {});
    await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
    await page.mouse.wheel(0, 400).catch(() => {});
    await bekle(350);
    const y = await page.evaluate(() => window.scrollY || 0).catch(() => 0);
    await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
    await bekle(150);
    return y > 50;
  };

  let kilitAcildi = false;
  if (!(await kaydiMi())) {
    // Kilitli görünüyor: şimdi kilit açma CSS'ini uygula ve tekrar dene.
    await page.addStyleTag({ content: KILIT_ACMA_CSS }).catch(() => {});
    kilitAcildi = await kaydiMi();
  }

  // Lazy-load görselleri tetikle, sonra başa dön.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
      window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  }).catch(() => {});
  await bekle(700);
  return { kilitAcildi };
}

// ── Kaydırma videosu ──────────────────────────────────────────────────────
// Playwright'ın recordVideo'su KULLANILMAZ: bit hızı 1 Mbit/s'e sabit kodlanmış,
// fps parametresi yok, 1080×1920'de metin okunmuyor. Kare kare çekip ffmpeg ile birleştiriyoruz.
async function kaydirmaVideosu(browser, url, ciktiMp4, gecici, ekran) {
  const ctx = await browser.newContext({
    viewport: { width: ekran.width, height: ekran.height },
    deviceScaleFactor: ekran.dsf, isMobile: true, hasTouch: true,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });
  const page = await ctx.newPage();
  try {
    await sayfaHazirla(page, url);

    const olcum = await page.evaluate(() => ({
      yukseklik: document.body.scrollHeight,
      gorunum: window.innerHeight,
      metin: (document.body.innerText || "").slice(0, 3000),
      baslik: document.title || "",
    }));

    // Kapı: kaydırılmayan sayfa = 120 aynı kare = donuk 4 sn video.
    if (olcum.yukseklik <= olcum.gorunum * 2) {
      return { hata: `sayfa kaydırılmıyor (${olcum.yukseklik}px ≤ 2×${olcum.gorunum})`, olcum };
    }
    if (BOT_DUVARI.test(olcum.metin)) {
      return { hata: "bot koruması sayfası", olcum };
    }

    mkdirSync(gecici, { recursive: true });
    const KARE = Math.round(SURE_SN * FPS);
    const kaydirilabilir = olcum.yukseklik - olcum.gorunum;
    // Hız sabit → mesafe türetiliyor. Sayfa kısaysa tamamı, uzunsa okunabilir kadarı.
    const hareketSn = SURE_SN * (1 - 2 * DURAK_ORAN);
    const menzil = Math.min(kaydirilabilir, Math.round(HIZ_PX_SN * hareketSn));

    // Fareyi sayfanın ORTASINA getir. Playwright'ta imleç (0,0)'da başlar ve tekerlek
    // olayı oradaki öğeye gider — genelde sabit header, ki o kaymaz. (Ölçüldü: bu satır
    // olmadan hubx.co'da 120 karenin 101'i aynı yerde kalıyordu.)
    await page.mouse.move(Math.round(ekran.width / 2), Math.round(ekran.height / 2));

    // Konum okuma. Önce ucuz yol (window.scrollY); o hiç kıpırdamıyorsa scroll-jacking
    // kütüphanesi (Lenis/Locomotive) olabilir, o zaman kapsayıcıyı ararız — ama bu arama
    // her karede değil, yalnız gerektiğinde yapılır (120 kare × DOM taraması pahalı).
    let kapsayiciAra = false;
    const konumOku = () => page.evaluate((ara) => {
      const y = window.scrollY || 0;
      if (!ara) return y;
      let en = y;
      for (const el of document.querySelectorAll("body *")) {
        if (el.scrollTop > en && el.scrollHeight > el.clientHeight + 50) en = el.scrollTop;
      }
      return en;
    }, kapsayiciAra).catch(() => 0);

    let oncekiKonum = await konumOku();
    let hicKaymadi = 0;

    for (let i = 0; i < KARE; i++) {
      const q = i / (KARE - 1);
      // Profil: durakla → yumuşak hızlan → SABİT HIZ → yumuşak yavaşla → durakla.
      // Saf easeInOutQuad kullanılmıyor: ortada hızı 2 katına çıkarıyor ve tam da
      // okunması gereken yerde metin akıp gidiyor.
      let e;
      const r = DURAK_ORAN, ramp = 0.12;
      if (q <= r) e = 0;
      else if (q >= 1 - r) e = 1;
      else {
        const u = (q - r) / (1 - 2 * r);                     // 0..1 hareket fazı
        if (u < ramp) e = (u * u) / (2 * ramp * (1 - ramp));  // yumuşak başlangıç
        else if (u > 1 - ramp) { const v = 1 - u; e = 1 - (v * v) / (2 * ramp * (1 - ramp)); }
        else e = (u - ramp / 2) / (1 - ramp);                 // sabit hız
      }
      const hedef = Math.round(menzil * Math.max(0, Math.min(1, e)));

      // ÖNCE gerçek fare tekerleği: scroll-jacking kütüphaneleri buna cevap veriyor,
      // window.scrollTo'ya vermiyor (ölçüldü: hubx.co'da scrollTo ile 120 kare AYNI çıktı).
      const fark = hedef - oncekiKonum;
      if (fark > 0) await page.mouse.wheel(0, fark).catch(() => {});
      await bekle(35);                                   // smooth-scroll'un yetişmesi için
      let konum = await konumOku();

      // Tekerlek işe yaramadıysa: önce kapsayıcı aramayı aç, sonra klasik yola düş.
      if (Math.abs(konum - oncekiKonum) < 2 && fark > 4 && !kapsayiciAra) {
        kapsayiciAra = true;
        konum = await konumOku();
      }
      if (Math.abs(konum - oncekiKonum) < 2 && fark > 4) {
        await page.evaluate((y) => {
          window.scrollTo(0, y);
          for (const el of document.querySelectorAll("body *")) {
            if (el.scrollHeight > el.clientHeight + 50) el.scrollTop = y;
          }
        }, hedef).catch(() => {});
        konum = await konumOku();
      }

      if (Math.abs(konum - oncekiKonum) < 2 && fark > 4) hicKaymadi++;
      oncekiKonum = konum;
      await page.screenshot({ path: join(gecici, `f${kacKare(i)}.png`) });
    }

    // Karelerin çoğu aynı yerdeyse video donuk demektir. Bit hızı bunu dolaylı
    // yakalıyor ama sebebini söylemiyor; burada doğrudan ölçülüyor.
    // Duraklama kareleri zaten yerinde duruyor; eşik onları hesaba katıyor.
    if (hicKaymadi > KARE * (0.6 + 2 * DURAK_ORAN)) {
      return { hata: `sayfa kaydırılamadı (${hicKaymadi}/${KARE} kare aynı yerde — scroll-jacking?)`, olcum };
    }

    await ffmpegCalistir(["-y", "-framerate", String(FPS), "-i", join(gecici, "f%04d.png"),
      "-c:v", "libx264", "-crf", "21", "-pix_fmt", "yuv420p", "-movflags", "+faststart", ciktiMp4]);

    const ilkKare = join(gecici, "f0000.png");
    const gri = await griSeviye(ilkKare).catch(() => 0);
    const kb = await bitHizi(ciktiMp4);
    const gercekHiz = Math.round(menzil / hareketSn);
    return { olcum, gri, kb, ilkKare, menzil, gercekHiz, sure: SURE_SN,
             kapsam: Math.round((menzil / kaydirilabilir) * 100) };
  } finally {
    await ctx.close().catch(() => {});
  }
}

// ── Şirket fotoğrafları (carousel'in asıl malzemesi) ──────────────────────
// BOYUT ALT SINIRI YOK: ölçüldü, lupindental.com'un kurucu fotoğrafları 350×350 ve
// ≥1080×600 filtresi tam da gereken görselleri siliyordu.
const FOTO_SAYFALARI = ["", "/about", "/about-us", "/team", "/company", "/careers", "/hakkimizda", "/ekibimiz", "/kurumsal"];

async function fotografTopla(browser, kokUrl) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2,
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  });
  const page = await ctx.newPage();
  const bulunan = new Map();
  let marka = null;
  try {
    for (const yol of FOTO_SAYFALARI) {
      const url = kokUrl.replace(/\/$/, "") + yol;
      try {
        const r = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15_000 });
        if (!r || !r.ok()) continue;
      } catch { continue; }
      await page.addStyleTag({ content: CEREZ_CSS }).catch(() => {});
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
          window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 50));
        }
      }).catch(() => {});
      await bekle(400);

      if (!marka) {
        marka = await page.evaluate(() => ({
          tema_rengi: document.querySelector('meta[name="theme-color"]')?.content ?? null,
          og_image: document.querySelector('meta[property="og:image"]')?.content ?? null,
          site_adi: document.querySelector('meta[property="og:site_name"]')?.content ?? null,
          baslik: document.title || null,
        })).catch(() => null);
      }

      const gorseller = await page.evaluate(() => {
        const cik = [];
        for (const im of document.images) {
          const w = im.naturalWidth, h = im.naturalHeight;
          if (!im.currentSrc || w < 200 || h < 200) continue;   // ikon/logo eleği, fotoğraf eleği DEĞİL
          if (/\.svg($|\?)/i.test(im.currentSrc)) continue;
          cik.push({ src: im.currentSrc, w, h, alt: (im.alt || "").slice(0, 120) });
        }
        return cik;
      }).catch(() => []);

      for (const g of gorseller) if (!bulunan.has(g.src)) bulunan.set(g.src, { ...g, sayfa: yol || "/" });
    }
  } finally { await ctx.close().catch(() => {}); }

  // Büyükten küçüğe: kurucu/ekip fotoğrafları genelde orta boy, hero'lar büyük.
  return { gorseller: [...bulunan.values()].sort((a, b) => b.w * b.h - a.w * a.h).slice(0, 14), marka };
}

// ── Görsel indirme ────────────────────────────────────────────────────────
// Paket kendi kendine yeterli olmalı: operatör klasörü CapCut'a sürüklüyor,
// URL listesini değil. Sırayla indirilir (paralel indirme bazı CDN'lerde 429 yiyor).
async function gorselleriIndir(urller, dizin, onEk) {
  mkdirSync(dizin, { recursive: true });
  const cikti = [];
  for (const [i, url] of urller.entries()) {
    try {
      const r = await fetch(url, {
        headers: { "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" },
        signal: AbortSignal.timeout(20_000),
      });
      if (!r.ok) { cikti.push(null); continue; }
      const tip = (r.headers.get("content-type") ?? "").toLowerCase();
      const uzanti = tip.includes("png") ? "png" : tip.includes("webp") ? "webp"
        : tip.includes("avif") ? "avif" : tip.includes("gif") ? "gif" : "jpg";
      const bayt = Buffer.from(await r.arrayBuffer());
      if (bayt.length < 8_000) { cikti.push(null); continue; }   // ikon/piksel değil, fotoğraf istiyoruz
      const ad = `${onEk}_${String(i + 1).padStart(2, "0")}.${uzanti}`;
      writeFileSync(join(dizin, ad), bayt);
      cikti.push(ad);
    } catch { cikti.push(null); }
  }
  return cikti;
}

// ── App Store görselleri (ücretsiz, anahtarsız) ───────────────────────────
// Ölçülen isabet %12,5 — esasen TR tüketici uygulaması kanalı. Bulunamaması normal.

const konak = (url) => { try { return new URL(url).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; } };

// KİMLİK KAPISI. Uygulama ADINDA şirket adının geçmesi kanıt DEĞİL: "Crusoe"
// aramasi "Crusoe Squeaky Ball Bubble POP"u (satıcı: Cristian Cendon Marquez,
// doggymakers.com) getiriyor ve eski kapı bunu geçiriyordu. Ölçümde ayrımı
// yapan tek alan satıcı kimliği: gerçek eşleşmelerin hepsinde şirket adı
// sellerName'de geçiyor (HUBX YAZILIM…, ULTRAHUMAN HEALTHCARE…, MIDAS
// FINANSAL…), altı yanlış eşleşmenin hiçbirinde geçmiyor.
// sellerUrl ayrı bir kabul yolu — marka alan adı tüzel adla uyuşmayabiliyor
// (Midas → getmidas.com), o yüzden VE değil VEYA.
export function appStoreUygunMu(r, sirketAdi, domain) {
  const anahtar = sirketAdi.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (anahtar.length < 4) return false;
  const satici = String(r.sellerName ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (satici.includes(anahtar)) return true;
  const d = String(domain ?? "").replace(/^www\./, "").toLowerCase();
  return !!d && konak(r.sellerUrl ?? "") === d;
}

export async function appStoreGorselleri(sirketAdi, domain) {
  try {
    const u = `https://itunes.apple.com/search?term=${encodeURIComponent(sirketAdi)}&country=tr&entity=software&limit=5`;
    const d = await (await fetch(u, { signal: AbortSignal.timeout(10_000) })).json();
    const uy = (d.results ?? []).find((r) => appStoreUygunMu(r, sirketAdi, domain));
    if (!uy) return { bulundu: false, neden: `${d.resultCount ?? 0} sonuç, satıcı kimliği eşleşen yok` };
    // 320x480bb.jpg → 1290x2796bb.jpg ile tam çözünürlük (doğrulandı, http 200).
    const tam = (uy.screenshotUrls ?? []).map((s) => s.replace(/\/\d+x\d+bb\.(jpg|png)$/, "/1290x2796bb.$1"));
    return { bulundu: true, uygulama: uy.trackName, saglayici: uy.sellerName, ikon: uy.artworkUrl512 ?? null, ekranlar: tam.slice(0, 5) };
  } catch (e) { return { bulundu: false, neden: e.message }; }
}

// ── Ana akış ──────────────────────────────────────────────────────────────
export async function varlikCek({ domain, sirketAdi, slug, dizin = PAKET_DIR }) {
  const kok = `https://${domain}`;
  const paket = join(dizin, slug);
  // Geçici kareler PAKETİN İÇİNE YAZILMAZ: 240 PNG × ~0,5 MB = ~120 MB ve paket
  // klasörü Drive'a bağlıysa bunların hepsi senkronize olup sonra silinir.
  // Sistem geçici klasörü kullanılıyor; sadece bitmiş dosyalar pakete gider.
  const gecici = join(mkdtempSync(join(tmpdir(), "haber-kare-")), "k");
  mkdirSync(join(paket, "01_video"), { recursive: true });
  mkdirSync(join(paket, "02_gorsel"), { recursive: true });

  const qc = { domain, sirket: sirketAdi, kapilar: {}, uyarilar: [] };
  const browser = await chromium.launch({ channel: "chrome", headless: true });

  try {
    // 1) 9:16 kaydırma videosu — ana B-roll
    const v916 = await kaydirmaVideosu(browser, kok, join(paket, "01_video", "01_kaydirma_9x16.mp4"), gecici, MOBIL);
    if (v916.hata) {
      qc.kapilar.video_9x16 = { gecti: false, neden: v916.hata };
    } else {
      // Kalite kapısı: dört sinyal. Tek eşik yetmiyor — Cloudflare doğrulama ekranı
      // 144 benzersiz gri seviye alıp kusursuz bir mp4 üretebiliyor.
      const botMu = BOT_DUVARI.test(v916.olcum.metin);
      const gecti = !botMu && v916.gri >= 20 && v916.kb >= 1000;
      qc.kapilar.video_9x16 = { gecti, gri_seviye: v916.gri, bit_hizi_kbs: v916.kb,
        sayfa_yuksekligi: v916.olcum.yukseklik, bot_duvari: botMu,
        sure_sn: v916.sure, kaydirma_px: v916.menzil, hiz_px_sn: v916.gercekHiz, sayfa_kapsami: `%${v916.kapsam}` };
      if (!gecti) qc.uyarilar.push(`9:16 video kalite kapısını geçemedi (gri ${v916.gri}, ${v916.kb} kb/s)`);
      // Hero: videonun ilk karesi
      if (existsSync(v916.ilkKare)) {
        await ffmpegCalistir(["-y", "-i", v916.ilkKare, "-q:v", "3", join(paket, "02_gorsel", "01_hero_9x16.jpg")]);
      }
    }
    rmSync(gecici, { recursive: true, force: true });

    // 2) 4:5 kaydırma videosu — Instagram carousel/feed oranı
    const v45 = await kaydirmaVideosu(browser, kok, join(paket, "01_video", "02_kaydirma_4x5.mp4"), gecici, DIKEY);
    qc.kapilar.video_4x5 = v45.hata ? { gecti: false, neden: v45.hata } : { gecti: true, bit_hizi_kbs: v45.kb };
    rmSync(gecici, { recursive: true, force: true });

    // 3) Şirket fotoğrafları — carousel'in asıl malzemesi
    const { gorseller, marka } = await fotografTopla(browser, kok);
    // URL yetmez: paket kendi kendine yeterli olmalı, CapCut'a dosya sürükleniyor.
    const inen = await gorselleriIndir(gorseller.map((g) => g.src), join(paket, "02_gorsel"), "10_site");
    for (const [i, g] of gorseller.entries()) g.dosya = inen[i] ?? null;
    qc.kapilar.fotograf = { gecti: inen.filter(Boolean).length > 0, bulunan: gorseller.length, inen: inen.filter(Boolean).length };
    writeFileSync(join(paket, "brand.json"), JSON.stringify({ marka, gorseller }, null, 2) + "\n");
    if (!gorseller.length) qc.uyarilar.push("şirket sitesinde ≥200px görsel bulunamadı");

    // Logo: og:image genelde markalı kapak görselidir (header'daki <img> çoğu zaman
    // 64px'lik bir CDN thumb'ı — carousel'de kullanılamaz).
    if (marka?.og_image) {
      const l = await gorselleriIndir([marka.og_image], join(paket, "02_gorsel"), "05_logo");
      if (l[0]) qc.kapilar.logo = { gecti: true, dosya: l[0] };
    }

    // 4) App Store
    const app = await appStoreGorselleri(sirketAdi, domain);
    if (app.bulundu && app.ekranlar?.length) {
      app.inen = await gorselleriIndir(app.ekranlar, join(paket, "02_gorsel"), "20_appstore");
    }
    qc.kapilar.appstore = app.bulundu
      ? { gecti: true, uygulama: app.uygulama, saglayici: app.saglayici, ekran: (app.inen ?? []).filter(Boolean).length }
      : { gecti: false, neden: app.neden };
    writeFileSync(join(paket, "02_gorsel", "appstore.json"), JSON.stringify(app, null, 2) + "\n");

    qc.yayina_hazir = !!qc.kapilar.video_9x16?.gecti && gorseller.length > 0;
    writeFileSync(join(paket, "QC.json"), JSON.stringify(qc, null, 2) + "\n");
    return { paket, qc };
  } finally {
    rmSync(gecici, { recursive: true, force: true });
    await browser.close().catch(() => {});
  }
}

// ── CLI ───────────────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const a = process.argv.slice(2);
  let domain, sirketAdi, slug;

  // Kaydırma hızı/süresi ayarlanabilir: her sitenin yoğunluğu farklı.
  const sayi = (bayrak, varsayilan) => {
    const i = a.indexOf(bayrak);
    const v = i > -1 ? Number(a[i + 1]) : NaN;
    return Number.isFinite(v) && v > 0 ? v : varsayilan;
  };
  ayarla({ hiz: sayi("--hiz", 340), sure: sayi("--sure", 8) });

  const di = a.indexOf("--domain");
  if (di > -1) {
    domain = a[di + 1];
    const ai = a.indexOf("--ad");
    sirketAdi = ai > -1 ? a[ai + 1] : domain.split(".")[0];
    slug = domain.replace(/[^a-z0-9]+/gi, "-");
  } else if (a[0]) {
    const k = JSON.parse(readFileSync(a[0], "utf8"));
    domain = k.kunye?.domain; sirketAdi = k.kunye?.sirket; slug = k.id;
  }

  if (!domain) {
    console.error("Kullanım: node scripts/haber/varlik.mjs kuyruk/<kayit>.json");
    console.error("     ya da node scripts/haber/varlik.mjs --domain hubx.co --ad HubX");
  console.error("Seçenekler: --sure <saniye, vars. 8>  --hiz <px/sn, vars. 340>");
    process.exit(1);
  }

  console.log(`${sirketAdi} → https://${domain}`);
  const t0 = Date.now();
  const { paket, qc } = await varlikCek({ domain, sirketAdi, slug });
  console.log(`\n${paket}  (${((Date.now() - t0) / 1000).toFixed(1)} sn)`);
  for (const [ad, k] of Object.entries(qc.kapilar)) {
    console.log(`  ${k.gecti ? "✓" : "✗"} ${ad.padEnd(12)} ${JSON.stringify(k)}`);
  }
  for (const u of qc.uyarilar) console.log(`  ⚠  ${u}`);
  console.log(qc.yayina_hazir ? "\n✅ paket hazır" : "\n⚠️  paket eksik — QC.json'a bak");
}
