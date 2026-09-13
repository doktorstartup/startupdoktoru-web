// App Store kimlik kapısı — saf fonksiyon, hiçbir bağımlılığı yok.
//
// varlik.mjs'ten buraya AYRILDI: o dosya playwright-core ve ffmpeg-static
// import ediyor, bunlar scripts/haber/node_modules'ta (gitignore'da) duruyor.
// Regresyon testi varlik.mjs'i import ettiği için CI'da her koşu
// ERR_MODULE_NOT_FOUND ile düşüyordu — görsel çekimi CI'da hiç koşmadığı hâlde.
// Test artık bu bağımsız modülü import ediyor.

const konak = (url) => { try { return new URL(url).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; } };

// Arama sonucundaki uygulama gerçekten bu şirkete mi ait? Satıcı adı ya da
// satıcı sitesi eşleşmiyorsa aynı isimli başka bir uygulamayı kabul etmeyiz.
export function appStoreUygunMu(r, sirketAdi, domain) {
  const anahtar = sirketAdi.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (anahtar.length < 4) return false;
  const satici = String(r.sellerName ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (satici.includes(anahtar)) return true;
  const d = String(domain ?? "").replace(/^www\./, "").toLowerCase();
  return !!d && konak(r.sellerUrl ?? "") === d;
}
