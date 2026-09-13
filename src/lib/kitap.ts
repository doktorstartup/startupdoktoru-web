// Basılı kitap — ana sayfadaki tanıtım bölümünü besler.
//
// KITAP null iken bölüm OTOMATİK gizlenir; canlıya sahte içerik gitmez.
// Kitap yalnız TÜRKÇE tarafta gösterilir (kitap Türkçe, Türkiye'deki
// kitapçılarda) — bu yüzden metinler sözlükte değil, burada.
//
// Satış şu an sitede değil: pazaryeri bağlantılarıyla yapılıyor. Siteden
// doğrudan satış ayrı bir iş (adres alanları, kargo, sipariş yönetimi,
// mesafeli satış sözleşmesi ve cayma hakkı gerekir).

export type Satici = {
  ad: string; // ör. "D&R"
  url: string;
};

export type Kitap = {
  baslik: string;
  altBaslik: string;
  kapak: string; // public/ altındaki yol, ör. "/kitap-kapak.jpg"
  durum: "cikti" | "yakinda";
  fiyat: string; // ör. "₺349" — boşsa fiyat gösterilmez
  ozet: string;
  saticilar: Satici[]; // boşsa satın alma satırı gizlenir
};

// ── Kitap bilgisi ─────────────────────────────────────────────────────────
// Doldurunca bölüm kendiliğinden yayına girer. Kapak görselini public/ altına koy.
//
// Örnek:
//   export const KITAP: Kitap | null = {
//     baslik: "Kervan Yolda Düzülmez",
//     altBaslik: "Bir girişimcinin saha defteri",
//     kapak: "/kitap-kapak.jpg",
//     durum: "cikti",
//     fiyat: "₺349",
//     ozet: "On yılda kurduğum üç şirketin gerçekten yaşanmış hikâyeleri...",
//     saticilar: [
//       { ad: "D&R", url: "https://..." },
//       { ad: "Kitapyurdu", url: "https://..." },
//     ],
//   };
export const KITAP: Kitap | null = null;

// ── Bölüm metinleri (Türkçe) ──────────────────────────────────────────────
// E-kitap artık BU kitabın dijital sürümü. İkisi aynı içerik, iki format —
// karışıklık bu yüzden yapısal olarak yok. "Genişletilmiş basım" ya da
// "biri rehber diğeri hikâye" dili KULLANILMIYOR; o dil "hangisini alayım"
// sorusunu doğuruyordu. Eğitim slaytları ayrı bir materyal ve satılmıyor:
// eğitim alanlara portalda hediye veriliyor.
export const KITAP_METIN = {
  eyebrowCikti: "Yeni Kitap",
  eyebrowYakinda: "Çok Yakında",
  durumCikti: "Çıktı — kitapçınızdan istemeyi unutmayın.",
  durumYakinda: "Çok yakında kitapçılarda.",
  satinAl: "Nereden alınır:",

  formatBaslik: "İki format, aynı kitap",
  formatLead:
    "İçerik birebir aynı. Tek fark, kitabı elinde tutmak mı yoksa şimdi okumaya başlamak mı istediğin.",

  basiliEtiket: "Basılı",
  basiliOzellikler: [
    "Kitapçılarda ve online pazaryerlerinde",
    "Rafta durur, imzalanır, hediye edilir",
    "Kargoyla gelir",
  ],
  basiliCtaCikti: "Satış noktaları yukarıda",
  basiliCtaYakinda: "Çok yakında",

  dijitalEtiket: "Dijital sürüm",
  dijitalBaslik: "Hemen okumaya başla",
  dijitalOzet:
    "Aynı kitabın dijital sürümü. Ödemeden hemen sonra, site içindeki okuyucudan açılır.",
  dijitalOzellikler: [
    "Anında erişim — kargo beklemezsin",
    "Site içinde, her cihazdan okunur",
    "Video eğitimlerde %50 indirim kazandırır",
  ],
  dijitalCta: "Dijital Sürümü Al",
};
