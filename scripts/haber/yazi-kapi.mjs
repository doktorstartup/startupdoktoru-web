// Fikir yazısı kapıları — SAF fonksiyonlar, hiçbir bağımlılığı yok.
//
// yazi.mjs'ten AYRILDI: o dosya @supabase/supabase-js import ediyor ve CI'da
// hiçbir node_modules kurulmuyor. Regresyon testi yazi.mjs'i import edince
// koşu düşüyordu. Kural: testin dokunduğu her şey bağımlılıksız olmalı.

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
  uyarilar.push(...dogrulaHitap(yazi));
  return uyarilar;
}

// ── Hitap kapısı ──────────────────────────────────────────────────────────
// Yazılar Eser'in brief'inden doğuyor ve yazarken "senin sorduğun soru",
// "senin bahsettiğin model" gibi ifadeler metne kaçabiliyor. Okuyucu o brief'i
// vermedi; bu cümleler ona yanlış bir ilişki kuruyor.
//
// İkinci tekil hitabın KENDİSİ kalmalı — Startup Doktoru'nun üslubu o. Yasak
// olan yalnız "bu yazıyı sen istedin" anlamı taşıyan kalıplar.
const BRIEF_KALIPLARI = [
  /\bsenin\s+(?:sorduğun|bahsettiğin|verdiğin|dediğin|ilettiğin|gönderdiğin|paylaştığın|anlattığın)\b/i,
  /\b(?:sorduğun|bahsettiğin|ilettiğin|gönderdiğin|paylaştığın)\s+(?:soru|konu|fikir|model|yazı|link|bağlantı|makale)\b/i,
  /\bdediğin gibi\b/i,
  /\bsenin\s+(?:fikrin|önerin|talebin|isteğin)\b/i,
  /\btalebin üzerine\b/i,
  /\bbana\s+(?:verdiğin|ilettiğin|gönderdiğin|yazdığın|attığın)\b/i,
];

export function dogrulaHitap(yazi) {
  const parcalar = [
    ...(yazi.bolumler ?? []).flatMap((b) => [b.metin, b.altyazi, ...(b.maddeler ?? [])]),
    ...(yazi.sorular ?? []).flatMap((s) => [s.soru, s.cevap]),
    yazi.cta, yazi.cta_baslik, yazi.kapak_metin, yazi.seo_description,
  ].filter((x) => typeof x === "string");

  const bulunan = [];
  for (const m of parcalar) {
    for (const re of BRIEF_KALIPLARI) {
      const e = re.exec(m);
      if (e) { bulunan.push(`okuyucuya brief atfı: "${e[0]}" — ${m.slice(0, 60)}…`); break; }
    }
  }
  return bulunan;
}
