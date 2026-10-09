// Haber yazısının gövde HTML'i — SAF modül, hiçbir bağımlılığı yok.
//
// yayinla.mjs'ten AYRILDI: o dosya @supabase/supabase-js ve ffmpeg-static
// import ediyor, CI ise hiç npm install yapmıyor. Regresyon testi govdeYaz'ı
// sınamak isteyince koşu ERR_MODULE_NOT_FOUND ile düştü. Aynı tuzağa
// appstore.mjs, gorsel-govde.mjs ve yazi-kapi.mjs ile de düşülmüştü.
//
// tutarYaz da buraya taşındı (carousel.mjs playwright çekiyor); carousel.mjs
// ve yayinla.mjs artık buradan alıyor, tek tanım kalıyor.

export const paraBirimi = { USD: "dolar", EUR: "euro", GBP: "sterlin", TRY: "TL" };

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

export const kacar = (s) => String(s ?? "").replace(/[&<>"]/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
// **kalın** → <strong>. Kaçırma ÖNCE yapılır, yani modelin yazdığı < > zararsızlaşmış olur.
const zengin = (s) => kacar(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

const TUR_TR = {
  "pre-seed": "tohum öncesi", seed: "tohum", "series-a": "A Serisi", "series-b": "B Serisi",
  "series-c+": "C Serisi ve sonrası", bridge: "köprü", grant: "hibe", debt: "borç",
};


// ── Gövde HTML'i — ŞABLON üretir ──────────────────────────────────────────
export function govdeYaz(kayit, metinler, gorseller) {
  const u = kayit.kunye;
  const tutar = tutarYaz(u.tutar?.deger, u.tutar?.birim);
  const tur = TUR_TR[u.tur_tipi] ?? null;
  const yatirimcilar = [u.lider, ...(u.katilanlar ?? [])].filter(Boolean);
  const kaynak = kayit.kaynaklar?.[0];
  const g = [...gorseller];

  const par = (metin) => `<p>${zengin(metin)}</p>`;
  // Altyazı ZORUNLU: okur görselin ne olduğunu ve nereden geldiğini bilmeli.
  const figur = (gr) => {
    if (!gr) return "";
    const alt = gr.tip === "uygulama"
      ? `${u.sirket} mobil uygulaması`
      : `${u.sirket} — ${u.domain ?? ""}`.trim();
    return `<figure><img src="${kacar(gr.yol)}" alt="${kacar(alt)}" loading="lazy">`
      + `<figcaption>${kacar(alt)}</figcaption></figure>`;
  };

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
    for (const p of metinler.odak ?? []) b.push(par(p));
    // Görseller ürünü anlatan bu bölümde durur. Ölçek ve yatırım turu
    // bölümlerine konulduğunda rakamla hiçbir ilgisi olmayan bir maket
    // çıkıyordu; o bölümlerde artık görsel yok.
    for (const gr of g.splice(0, g.length)) b.push(figur(gr));
  }

  // 3) Ölçek
  if (metinler.olcek?.length) {
    b.push(`<h2>Şirketin bugünkü ölçeği</h2>`);
    for (const p of metinler.olcek ?? []) b.push(par(p));
  }

  // 4) Yatırım — yine mekanik
  if (tutar || yatirimcilar.length) {
    b.push(`<h2>Yatırım turu</h2>`);
    const cumle = yatirimcilar.length
      ? `${kacar(u.sirket)}, <strong>${kacar(yatirimcilar[0])}</strong>${yatirimcilar.length > 1 ? ` ve ${yatirimcilar.length - 1} yatırımcıdan` : "'dan"}${tutar ? ` <strong>${kacar(tutar)}</strong>` : ""} yatırım aldı.`
      : `${kacar(u.sirket)}, <strong>${kacar(tutar)}</strong> yatırım aldı.`;
    b.push(`<p>${cumle}${tur ? ` Tur <strong>${kacar(tur)}</strong> aşamasında gerçekleşti.` : ""}</p>`);
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
