// İÇERİK GÖRSELİ ÜRETİCİSİ.
//
// Fikir yazıları için markalı grafik üretir: kontrol listesi, karşılaştırma tablosu,
// akış şeması, alıntı kartı. Stok fotoğraf yerine bunlar kullanılıyor çünkü
// (a) özgün — Google'ın "değer katan içerik" testinde stok fotoğrafın karşılığı yok,
// (b) markalı — her yazıda aynı görsel dil,
// (c) ücretsiz ve telifsiz.
//
// Aynı motor iki boyutta basar:
//   blog    1200×675  (16:9, yazı gövdesine)
//   sosyal  1080×1350 (4:5, Instagram)
//
// Kullanım (kod içinden):
//   import { gorselCiz } from "./gorsel.mjs";
//   await gorselCiz({ tip: "liste", baslik: "...", maddeler: [...] }, "cikti.png");

import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const OLCU = {
  blog:   { w: 1200, h: 675 },
  sosyal: { w: 1080, h: 1350 },
};

// Startup Doktoru paleti — carousel.mjs ile aynı, logodan ölçülmüş.
const RENK = {
  zemin: "#F2F5F8", kart: "#FFFFFF", lacivert: "#050B14", kartKoyu: "#0E1726",
  metin: "#0B1420", soluk: "#5A6B80", vurgu: "#00A0C3", vurguParlak: "#00E5FF",
  cizgi: "#D5DDE6", uyari: "#B3382C", olumlu: "#10715A",
};

const logo = (dosya) => {
  try { return `data:image/png;base64,${readFileSync(resolve(`public/${dosya}`)).toString("base64")}`; }
  catch { return null; }
};
const LOGO_SIYAH = logo("logo-sd-siyah.png");
const LOGO_BEYAZ = logo("logo-sd-beyaz.png");

const kacar = (s) => String(s ?? "").replace(/[&<>"]/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const kalin = (s) => kacar(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");

// ── Görsel tipleri ────────────────────────────────────────────────────────
function govde(g) {
  const b = [];
  if (g.etiket) b.push(`<span class="rozet">${kacar(g.etiket)}</span>`);
  if (g.baslik) b.push(`<h1>${kalin(g.baslik)}</h1>`);

  if (g.tip === "liste") {
    b.push(`<ol class="liste">${(g.maddeler ?? []).map((m) =>
      `<li><span class="no"></span><span class="mt">${kalin(m)}</span></li>`).join("")}</ol>`);
  }

  if (g.tip === "tablo") {
    const s = g.satirlar ?? [];
    b.push(`<div class="tablo">
      ${g.sutunlar ? `<div class="tsatir tbaslik"><div>${kacar(g.sutunlar[0])}</div><div>${kacar(g.sutunlar[1])}</div></div>` : ""}
      ${s.map((r) => `<div class="tsatir"><div class="sol">${kalin(r[0])}</div><div class="sag">${kalin(r[1])}</div></div>`).join("")}
    </div>`);
  }

  if (g.tip === "sema") {
    b.push(`<div class="sema">${(g.adimlar ?? []).map((a, i) => `
      <div class="kutu"><span class="kno">${i + 1}</span><span class="kmt">${kalin(a)}</span></div>
      ${i < (g.adimlar.length - 1) ? '<div class="ok">↓</div>' : ""}`).join("")}</div>`);
  }

  if (g.tip === "alinti") {
    b.push(`<blockquote>${kalin(g.metin ?? "")}</blockquote>`);
    if (g.alt) b.push(`<p class="alt">${kalin(g.alt)}</p>`);
  }

  return b.join("\n");
}

const stil = (koyu, olcu) => `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap&subset=latin,latin-ext');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { width: ${olcu.w}px; height: ${olcu.h}px; overflow: hidden;
         font-family: "Space Grotesk", -apple-system, sans-serif;
         background: ${koyu ? RENK.lacivert : RENK.zemin};
         color: ${koyu ? "#fff" : RENK.metin};
         display: flex; flex-direction: column;
         padding: ${olcu.h > 900 ? "80px 64px" : "56px 64px"}; }
  .icerik { flex: 1 1 auto; display: flex; flex-direction: column; justify-content: center; gap: 26px; }
  .rozet { align-self: flex-start; display: inline-flex; align-items: center; height: 46px; padding: 0 22px;
           border: 3px solid ${koyu ? RENK.vurguParlak : RENK.vurgu}; border-radius: 999px;
           color: ${koyu ? RENK.vurguParlak : RENK.vurgu};
           font-size: 21px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; }
  h1 { font-size: ${olcu.h > 900 ? "58px" : "48px"}; line-height: 1.14; font-weight: 700;
       letter-spacing: -.022em; text-wrap: balance; }
  b { font-weight: 700; color: ${koyu ? RENK.vurguParlak : RENK.vurgu}; }

  .liste { list-style: none; display: flex; flex-direction: column; gap: 18px; counter-reset: n; }
  .liste li { display: flex; align-items: flex-start; gap: 18px; counter-increment: n;
              font-size: ${olcu.h > 900 ? "34px" : "29px"}; line-height: 1.38; }
  .liste .no { flex: 0 0 auto; width: 46px; height: 46px; border-radius: 999px;
               border: 3px solid ${koyu ? RENK.vurguParlak : RENK.vurgu};
               color: ${koyu ? RENK.vurguParlak : RENK.vurgu};
               display: flex; align-items: center; justify-content: center;
               font-size: 22px; font-weight: 700; margin-top: 3px; }
  .liste .no::before { content: counter(n); }

  .tablo { display: flex; flex-direction: column; border: 3px solid ${koyu ? "#1E293B" : RENK.cizgi};
           border-radius: 20px; overflow: hidden; }
  .tsatir { display: grid; grid-template-columns: 1fr 1fr;
            border-bottom: 2px solid ${koyu ? "#1E293B" : RENK.cizgi}; }
  .tsatir:last-child { border-bottom: 0; }
  .tsatir > div { padding: 20px 24px; font-size: ${olcu.h > 900 ? "30px" : "26px"}; line-height: 1.3; }
  .tsatir.tbaslik > div { background: ${koyu ? RENK.kartKoyu : "#E7ECF2"}; font-weight: 700;
                          font-size: 22px; text-transform: uppercase; letter-spacing: .05em;
                          color: ${koyu ? RENK.vurguParlak : RENK.vurgu}; }
  .tsatir .sag { border-left: 2px solid ${koyu ? "#1E293B" : RENK.cizgi}; }

  .sema { display: flex; flex-direction: column; align-items: stretch; gap: 10px; }
  .kuto, .kutu { display: flex; align-items: center; gap: 18px; padding: 20px 24px;
                 background: ${koyu ? RENK.kartKoyu : RENK.kart};
                 border: 3px solid ${koyu ? "#1E293B" : RENK.cizgi}; border-radius: 18px;
                 font-size: ${olcu.h > 900 ? "31px" : "27px"}; line-height: 1.3; }
  .kno { flex: 0 0 auto; width: 40px; height: 40px; border-radius: 999px;
         background: ${koyu ? RENK.vurguParlak : RENK.vurgu}; color: ${koyu ? RENK.lacivert : "#fff"};
         display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; }
  .ok { text-align: center; font-size: 26px; color: ${koyu ? RENK.vurguParlak : RENK.vurgu}; line-height: 1; }

  blockquote { font-size: ${olcu.h > 900 ? "46px" : "40px"}; line-height: 1.26; font-weight: 600;
               border-left: 6px solid ${koyu ? RENK.vurguParlak : RENK.vurgu}; padding-left: 28px;
               text-wrap: balance; }
  .alt { margin-top: 8px; font-size: 26px; color: ${koyu ? "#8397AE" : RENK.soluk}; }

  .dip { flex: 0 0 auto; display: flex; align-items: center; justify-content: flex-end; padding-top: 20px; }
  .dip img { height: ${olcu.h > 900 ? "62px" : "52px"}; width: auto; }
`;

/**
 * Tek görsel çizer.
 * @param {object} g  { tip: "liste"|"tablo"|"sema"|"alinti", etiket?, baslik?, ... }
 * @param {string} cikti  yazılacak .png yolu
 * @param {object} sec  { olcu: "blog"|"sosyal", koyu: bool }
 */
export async function gorselCiz(g, cikti, { olcu = "blog", koyu = false, browser = null } = {}) {
  const o = OLCU[olcu] ?? OLCU.blog;
  const kendi = !browser;
  const b = browser ?? await chromium.launch({ channel: "chrome", headless: true });
  try {
    const page = await b.newPage({ viewport: { width: o.w, height: o.h }, deviceScaleFactor: 1 });
    const lg = koyu ? LOGO_BEYAZ : LOGO_SIYAH;
    await page.setContent(`<!doctype html><html lang="tr"><head><meta charset="utf-8">
      <style>${stil(koyu, o)}</style></head><body>
      <div class="icerik">${govde(g)}</div>
      <div class="dip">${lg ? `<img src="${lg}" alt="Startup Doktoru">` : ""}</div>
    </body></html>`, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready).catch(() => {});
    await page.waitForTimeout(200);

    // OTOMATİK SIĞDIRMA. transform:scale KULLANILMIYOR — düzeni yeniden akıtmıyor,
    // öğe eski kutusunu kaplamaya devam ediyor ve taşma sürüyordu (ölçüldü: 6 adımlı
    // akış şemasının son iki kutusu kesiliyordu). `zoom` gerçekten yeniden akıtır.
    const olcek = await page.evaluate(() => {
      const el = document.querySelector(".icerik");
      if (!el) return 1;
      const tasiyorMu = () => document.body.scrollHeight > window.innerHeight + 1;
      let z = 1;
      // 0,55'e kadar 0,05 adımlarla küçült; sığan ilk değerde dur.
      while (tasiyorMu() && z > 0.55) { z = +(z - 0.05).toFixed(2); el.style.zoom = String(z); }
      return z;
    }).catch(() => 1);
    if (olcek < 1) await page.waitForTimeout(150);

    await page.screenshot({ path: cikti });
    await page.close();
    return cikti;
  } finally {
    if (kendi) await b.close().catch(() => {});
  }
}

/** Birden çok görseli tek tarayıcı oturumunda çizer. */
export async function gorselleriCiz(liste, { olcu = "blog", koyu = false } = {}) {
  const b = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const yazilan = [];
    for (const { gorsel, yol, koyu: k } of liste) {
      await gorselCiz(gorsel, yol, { olcu, koyu: k ?? koyu, browser: b });
      yazilan.push(yol);
    }
    return yazilan;
  } finally { await b.close().catch(() => {}); }
}
