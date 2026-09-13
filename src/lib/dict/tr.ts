// Türkçe metin sözlüğü — kaynak dil. Yeni metin önce buraya, sonra en.ts'e eklenir;
// en.ts bu dosyanın tipine bağlı olduğu için eksik çeviri derlemede hata verir.

export const tr = {
  meta: {
    // Ana sayfanın başlığı. "yatırımcı sunumu nasıl yapılır" sorgusu /investor-training
    // sayfasına bırakıldı; sayfalar aynı sorguda birbiriyle yarışmasın.
    title: "Startup Doktoru — Ücretsiz Startup Eğitimi ve Yatırım Rehberi",
    description:
      "Yatırım almış gerçek bir sunum üzerinden startup eğitimi. 12 dakikalık ücretsiz eğitimle başlayın; e-kitap ve video eğitimlerle devam edin. 10 yıllık saha tecrübesi.",
    ogLocale: "tr_TR",
  },

  // Her sayfanın kendi başlık/açıklaması — arama motorunda ayrı sonuç olarak çıkar.
  pageMeta: {
    ebook: {
      title: "Startup E-Kitabı: MVP'den Değerlemeye 13 Bölüm | Startup Doktoru",
      description:
        "İnovasyon, MVP, ürün-pazar uyumu, ekip kurma, nakit akışı, şirket değerleme ve yatırımcı pazarlığı — 13 bölümlük startup e-kitabı, 6 dolar.",
    },
    egitimler: {
      title: "Startup Video Eğitimleri — 3 Eğitim, Tek Paket | Startup Doktoru",
      description:
        "Yatırımcı sunumu hazırlama, startup giriş rehberi ve şirket değerleme eğitimleri. Tek tek 70 dolar, üçü birden 99 dolarlık tek pakette.",
    },
    freeTraining: {
      title: "Ücretsiz Startup Eğitimi — 12 Dakikalık Video | Startup Doktoru",
      description:
        "12 dakikada startup kurmanın temelleri: doğru inovasyon, MVP ve yatırımcının aradığı ilk sinyaller. Ücretsiz video eğitimi, kayıt olmanız yeterli.",
    },
    investorTraining: {
      title: "Yatırımcı Sunumu Nasıl Yapılır? Video Eğitim | Startup Doktoru",
      description:
        "Yatırım almış gerçek bir pitch deck üzerinden slayt slayt yatırımcı sunumu hazırlama eğitimi. 5 modül, 134 dakika. Yatırımcıların anında 'hayır' dediği 12 kritik hata.",
    },
    degerleme: {
      title: "Startup Değerleme Nasıl Yapılır? Berkus & DCF | Startup Doktoru",
      description:
        "Berkus, puan kartı, risk faktörleri ve DCF yöntemleriyle şirket değerleme; yatırımcıyla pazarlıkta masaya güçlü oturmanın yolları. Video eğitim.",
    },
    startupGiris: {
      title: "Startup Nasıl Kurulur? Giriş Rehberi Eğitimi | Startup Doktoru",
      description:
        "Doğru inovasyon, over-engineering'den kurtulma, marka konumlandırma, MVP geliştirme, ekip kurma ve rakip analizi — startup kurulumunun tamamı tek eğitimde.",
    },
    blog: {
      title: "Startup Blogu — Girişimcilik ve Yatırım | Startup Doktoru",
      description:
        "Girişimcilik, yatırım, şirket değerleme ve büyüme üzerine uygulanabilir yazılar. Startup dünyasından haberler ve saha notları.",
    },
  },
};

export type Dict = typeof tr;
