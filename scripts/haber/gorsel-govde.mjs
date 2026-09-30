// Görsel gövdesinin HTML'i — SAF fonksiyon, hiçbir bağımlılığı yok.
//
// gorsel.mjs'ten AYRILDI: o dosya playwright-core import ediyor ve
// scripts/haber/node_modules gitignore'da; CI hiç npm install yapmıyor.
// Regresyon testi gorsel.mjs'i import edince her koşu ERR_MODULE_NOT_FOUND
// ile düşüyordu. Aynı hata 13 Eylül'de appstore.mjs ile de yaşanmıştı.

const kacar = (s) => String(s ?? "").replace(/[&<>"]/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const kalin = (s) => kacar(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");

// ── Görsel tipleri ────────────────────────────────────────────────────────
export function govde(g) {
  const b = [];
  if (g.etiket) b.push(`<span class="rozet">${kacar(g.etiket)}</span>`);
  if (g.baslik) b.push(`<h1>${kalin(g.baslik)}</h1>`);

  if (g.tip === "liste") {
    b.push(`<ol class="liste">${(g.maddeler ?? []).map((m) =>
      `<li><span class="no"></span><span class="mt">${kalin(m)}</span></li>`).join("")}</ol>`);
  }

  if (g.tip === "tablo") {
    const s = g.satirlar ?? [];
    // Sütun sayısı VERİDEN gelir. Eskiden [0] ve [1]'e sabitti: dört sütunlu bir
    // tablo iki sütun basılıyor, kalan iki sütun sessizce düşüyordu. Okuyucu
    // tabloyu eksiksiz sanıyordu — en kötü hata türü.
    const kolon = Math.max(g.sutunlar?.length ?? 0, ...s.map((r) => r.length), 2);
    const hucre = (r) => Array.from({ length: kolon }, (_, i) =>
      `<div class="${i === 0 ? "sol" : "sag"}">${kalin(r[i] ?? "")}</div>`).join("");
    b.push(`<div class="tablo" style="--kolon:${kolon}">
      ${g.sutunlar?.some((x) => String(x).trim())
        ? `<div class="tsatir tbaslik">${Array.from({ length: kolon }, (_, i) =>
            `<div>${kacar(g.sutunlar[i] ?? "")}</div>`).join("")}</div>`
        : ""}
      ${s.map((r) => `<div class="tsatir">${hucre(r)}</div>`).join("")}
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
