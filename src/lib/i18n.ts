// Site iki dilli. Türkçe varsayılan ve ÖNEKSİZ kalır (/ebook) — mevcut adresler
// ve arama motoru sıralaması bozulmasın diye. İngilizce /en altındadır (/en/ebook).
// Öneksiz istekleri middleware içeride /tr'ye rewrite eder; adres çubuğu değişmez.

export const LOCALES = ["tr", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "tr";

export function isLocale(v: string): v is Locale {
  return (LOCALES as readonly string[]).includes(v);
}

// Dile göre bağlantı üretir: localePath("tr", "/ebook") → "/ebook",
// localePath("en", "/ebook") → "/en/ebook".
export function localePath(lang: Locale, path: string): string {
  const p = path === "/" ? "" : path;
  if (lang === DEFAULT_LOCALE) return p || "/";
  return `/en${p}`;
}
