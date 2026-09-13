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
// E-kitapla kitabın KARIŞMAMASI bu bölümün tek işi. İkisi aynı şeyin küçük ve
// büyük hâli değil; farklı işler yapıyorlar. "Genişletilmiş basım" dili bilerek
// kullanılmıyor — o dil "madem büyüğü var, küçüğünü niye alayım" sorusunu doğurur.
export const KITAP_METIN = {
  eyebrowCikti: "Yeni Kitap",
  eyebrowYakinda: "Çok Yakında",
  durumCikti: "Çıktı — kitapçınızdan istemeyi unutmayın.",
  durumYakinda: "Çok yakında kitapçılarda.",
  satinAl: "Nereden alınır:",

  karsilastirmaBaslik: "Hangisi bana göre?",
  karsilastirmaLead:
    "İkisi aynı kitabın küçüğü ve büyüğü değil. Farklı işler yapıyorlar — çoğu kişi ikisini birden okuyor.",

  ebookEtiket: "Hızlı rehber",
  ebookBaslik: "E-Kitap",
  ebookOzet:
    "Eğitimlerde anlattığım slaytlardan damıtılmış hap bilgiler. Ne yapman gerektiğini adım adım söyler; masanın üstünde duran kontrol listesi gibi.",
  ebookOzellikler: ["Dijital — anında indirirsin", "13 bölüm, uygulama odaklı", "Takıldıkça dönüp bakılır"],
  ebookCta: "E-Kitabı İncele",

  kitapEtiket: "Yaşanmış hikâyeler",
  kitapOzellikler: ["Basılı — kargoyla gelir", "Baştan sona okunur", "Sahadan gerçek hikâyeler"],
};
