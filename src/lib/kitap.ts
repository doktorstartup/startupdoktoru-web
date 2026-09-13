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
  // YAYIN ANAHTARI. Bölüm "dijital sürümü hemen oku" sözü verdiği için,
  // kitap.pdf Storage'a yüklenmeden true yapma: alıcı kitabı değil slaytları görür.
  yayinda: boolean;
  baslik: string;
  altBaslik: string;
  kapak: string; // public/ altındaki yol
  durum: "cikti" | "yakinda";
  fiyat: string; // ör. "₺349" — boşsa fiyat gösterilmez
  ozet: string;
  sorular: string[]; // arka kapaktaki sorular — boşsa liste gizlenir
  saticilar: Satici[]; // boşsa satın alma satırı gizlenir
};

// ── Kitap bilgisi ─────────────────────────────────────────────────────────
// Kapak baskı PDF'inden web için üretildi (8.4 MB → 87 KB, 1000x1445 WebP).
export const KITAP: Kitap | null = {
  // kitap.pdf Storage'a yüklendiğinde ve fiyat/satıcılar girildiğinde true yap.
  yayinda: false,
  baslik: "Hedef Milyon Dolar",
  altBaslik: "Kimse Melek Değil, Siz de Cennette Değilsiniz",
  kapak: "/kitap-kapak.webp",
  durum: "yakinda",
  fiyat: "",
  ozet:
    "Gündüz televizyonda milyonlara teknolojiyi anlattım. Akşam, yazılım borçlarımı ödemek için garson önlüğü taktım. Bir girişim kurmak romantik bir hayal değil, rasyonel bir hayatta kalma mücadelesidir. Bu kitap 10 yılı aşkın ekosistem tecrübesini samimi itiraflarla 13 adımlık bir reçeteye damıtıyor: fikrinizin inovasyon dozundan yatırımcı masasındaki pazarlığa, oradan hesabınıza ilk büyük paranın yattığı güne kadar.",
  sorular: [
    "Milyon dolarlık fikriniz gerçekten pazar bulacak mı, yoksa doğru işi yanlış zamanda yapıp paranızı mı tüketeceksiniz?",
    "Müşterinin zihninde \"her işi yapan jenerik ajans\" olmak yerine Red Bull gibi bir konumlandırma nasıl kurulur?",
    "Yatırımcı karşısında \"bence şirketim şu kadar eder\" demeden, değerlemenizi sağlam rakamlarla nasıl savunursunuz?",
    "Sözleşmelerin gizli ve acımasız tuzakları, imzadan sonra değil imzadan önce nasıl okunur?",
  ],
  saticilar: [],
};

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
