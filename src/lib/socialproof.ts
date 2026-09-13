// Sosyal kanıt içerikleri — öğrenci memnuniyet videoları ve VC/güvenilir-kaynak görselleri.
// Diziler boşken ilgili bölüm OTOMATİK gizlenir (canlıya sahte içerik gitmez).
// Gerçek içerik geldikçe aşağıyı doldur; görselleri public/ altına koy.

export type Testimonial = {
  name: string; // öğrenci adı
  role?: string; // ör. "Kurucu, FinX"
  quote?: string; // kısa alıntı (video altında görünür)
  quoteEn?: string; // aynı alıntının İngilizcesi (/en tarafında gösterilir)
  youTubeId?: string; // YouTube video ID (varsa)
  bunnyId?: string; // Bunny.net GUID (varsa) — ikisinden biri yeterli
};

export type VcProof = {
  image: string; // public/ altındaki yol, ör. "/vc/fon-ortagi.jpg"
  caption: string; // kısa, DOĞRU açıklama — ör. "X Ventures ekibiyle, İstanbul"
};

// ── Öğrenci memnuniyet videoları ──
// Sıralama = sayfadaki sıra (yatay videolar başta, dikeyler sonda).
export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Muhammet Kayapınar",
    role: "Violiv",
    quote: "Aklımdaki bütün merak edilen sorular cevaplandı. Aydınlanma yaşadım ve artık hazırım.",
    quoteEn: "Every question on my mind got answered. It was a real lightbulb moment — I'm ready now.",
    youTubeId: "lBZWArxe-7U",
  },
  {
    name: "Yunus Burak Özcan",
    role: "Gristek",
    quote: "Az daha yanlış bir anlaşmayla 100 milyon dolarlık şirketi kaybedecektik. Hayatımızı kurtardı.",
    quoteEn: "We came within an inch of losing a $100M company to the wrong deal terms. It saved us.",
    youTubeId: "fJVjQfpMDcc",
  },
  {
    name: "Melih",
    role: "Dhetay",
    quote: "Yatırımcıya hangi imtiyazları vermeliyiz, hangileri ölümcül sonuçlar doğurur, şirket nasıl değerlenir — hepsi çok değerli bilgilerdi.",
    quoteEn: "Which rights to grant an investor, which ones turn fatal, how a company is valued — all of it was invaluable.",
    youTubeId: "2LLnJsbiEWA",
  },
  {
    name: "Serdar",
    role: "360 Interactive",
    quote: "Aslında tamamız gibi geliyordu ama Eser hoca ile konuşunca bütün eksiklerimizi gördük — şimdi tamamlıyoruz.",
    quoteEn: "We thought we were basically ready, but talking to Eser showed us every gap — now we're closing them.",
    youTubeId: "d41wNvz8Vbw",
  },
  {
    name: "Gökhan Güleç",
    role: "StreetCo",
    quote: "Yatırımcının karşısında nasıl güçlü durulur ve pazarlık masasındaki bütün oyunlar öğrenilir — hepsini öğrendim.",
    quoteEn: "How to hold your ground in front of an investor, and every game played at the negotiating table — I learned all of it.",
    youTubeId: "f7acJhyevgg",
  },
  {
    name: "Serhat",
    quote: "Aklınıza gelen her fikir sizi zengin etmez. Bunun matematiğini görünce projemin tüm eksiklerini gördüm; yeni projemde çok daha iyisini yapacağım.",
    quoteEn: "Not every idea that occurs to you will make you rich. Once I saw the math, I saw every gap in my project; the next one will be far better.",
    youTubeId: "0fMZWdOOscw",
  },
  {
    name: "Alaettin Keykubat",
    quote: "Eğitim fiyatı yüksek gibi gelmişti. Ama şimdi anlıyorum ki bu kadar bilgiye az bile — 10 yıllık bu tecrübe paha biçilemez.",
    quoteEn: "The price felt high at first. Now I see it's barely anything for this much knowledge — ten years of experience is priceless.",
    youTubeId: "X0E75HaC6zs",
  },
];

// ── VC'lerle / güvenilir kaynaklarla kareler ──
// Örnek:
//   { image: "/vc/fon-ortagi.jpg", caption: "Tanıtım sunumu — fon ortaklarıyla" },
export const VC_PROOF: VcProof[] = [];

// Bölüm üst metinleri (istediğin gibi düzenle) — her dil için ayrı.
export const VC_HEADLINE = "Güçlü Bir Yatırımcı Ağının İçindeyiz";
export const VC_SUBTEXT =
  "Paylaştığımız bilgiler sahadan ve birinci ağızdan: yatırımcılar, fonlar ve gerçek girişimlerle kurduğumuz ilişkilerden geliyor.";
export const VC_HEADLINE_EN = "We Sit Inside a Strong Investor Network";
export const VC_SUBTEXT_EN =
  "What we share comes from the field, firsthand: from the relationships we have built with investors, funds and real startups.";
