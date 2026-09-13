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
  nav: {
    problem: "Problem",
    solution: "Çözümümüz",
    ebook: "E-Kitap",
    training: "Eğitimler",
    about: "Hakkında",
  },

  header: {
    homeAria: "Startup Doktoru ana sayfa",
    aiMentor: "AI Mentor",
    myPanel: "Panelim",
    login: "Giriş",
    memberLogin: "Üye Girişi",
    buyEbook: "E-Kitap Al",
    openMenu: "Menüyü aç",
    closeMenu: "Menüyü kapat",
    logout: "Çıkış Yap",
    switchLanguage: "Dili değiştir",
  },

  footer: {
    rights: "© 2026 Startup Doktoru. Tüm Hakları Saklıdır. \u201CKervan yolda değil, stratejiyle düzülür.\u201D",
    trainings: "Eğitimler",
    freeTraining: "Ücretsiz Eğitim",
    blog: "Blog",
    privacy: "Gizlilik Politikası",
    distanceSales: "Mesafeli Satış Sözleşmesi",
    terms: "Kullanım Şartları",
  },
  home: {
    hero: {
      badge: "10 Yıllık Startup ve Yatırım Tecrübesi",
      titleLead: "Hedef:",
      titleHighlight: "Milyon Dolar",
      subtitle:
        "10 yıllık bilgi birikimiyle, nasıl milyon dolarlık bir girişim kurulur — adım adım anlatıyorum.",
      ctaFree: "Ücretsiz Eğitime Katıl",
      riskReducer: "Kredi kartı gerekmez · 2 dakikada erişim",
      ebookLink: "ya da e-kitabı incele ·",
      stats: [
        { value: "100+", label: "Girişimci Mentorluk" },
        { value: "3", label: "Girişim Kurulumu" },
        { value: "10+ Yıl", label: "Saha Tecrübesi" },
      ],
    },

    problem: {
      eyebrow: "Temel Sorunlar",
      title: "Girişimciler Neden Başarısız Oluyor?",
      lead: "Aylarca süren emeklerin heba olmasının ardındaki 4 ölümcül operasyonel gerçek:",
      items: [
        {
          title: "Yanlış Metrik Odaklılık",
          desc: "Gerçek ciro ve kullanıcı yerine sadece 'beğeni' ve sahte büyüme rakamlarını takip etmek.",
        },
        {
          title: "Yetersiz Yatırımcı Sunumu",
          desc: "Yatırımcının zihnindeki kritik 5 soruyu es geçerek 50 slaytlık sıkıcı sunumlar hazırlamak.",
        },
        {
          title: "Over-Engineering",
          desc: "Pazarın doğrulamadığı özellikler için aylarca kod yazıp pazara çıkışı ertelemek.",
        },
        {
          title: "Sistemsiz Büyüme",
          desc: "KPI, görev yönetimi ve doğru delegasyon kurmadan işin kendisini kaosa sürüklemek.",
        },
      ],
    },

    ladder: {
      eyebrow: "Güven Temelli Yolculuk",
      title: "Startup Değer Merdiveni",
      lead: "Platformumuzda doğrudan yüksek bütçeli satışlar yapmayız. Sizinle güven bağımızı adım adım büyütürüz:",
      popular: "En Popüler",
      discountBadge: "%50 indirim",
      steps: [
        {
          step: "Adım 01",
          title: "Ücretsiz Eğitim",
          desc: "Yatırımcıların karşısında yapılan en kritik hataları gösterip anında değer üretir.",
          price: "Ücretsiz",
          oldPrice: "",
          btnText: "Kayıt Ol",
        },
        {
          step: "Adım 02",
          title: "E-Kitap",
          desc: "13 kritik adımda milyon dolarlık bir startup kurmanın pratik el kitabını edinirsiniz.",
          price: "6 USD",
          oldPrice: "12 $",
          btnText: "Hemen 6 $'a Al",
        },
        {
          step: "Adım 03",
          title: "Video Eğitimler",
          desc: "Yatırımcı sunumu, startup giriş rehberi ve değerleme eğitimleri. E-kitap alana her biri %50 indirimli.",
          price: "70 $ / paket 99 $",
          oldPrice: "",
          btnText: "Eğitimleri Gör",
        },
      ],
    },

    ebookSection: {
      eyebrow: "Dijital Dönüşüm El Kitabı",
      title: "13 Adımda Milyon Dolarlık Startup",
      body: "Bu kitap, son 10 yılda edindiğimiz inovasyon, yatırımcılık ve büyüme tecrübelerinin damıtılmış bir özetidir. Adım adım şirketinizin omurgasını nasıl kuracağınızı örneklerle öğretir.",
      chapters: [
        "01. İnovasyon & Faydalı Fikir",
        "02. Over-Engineering (Mühendis Hastalığı)",
        "03. MVP ile Pazara Çıkış",
        "04. Problem Doğrulama & Ürün-Pazar Uyumu",
        "05. Marka Konumlandırma & Rakip Analizi",
        "06. Ekip Kurma (CEO, COO, CFO)",
        "07. Nakit Akışı Yönetimi",
        "08. Şirket Değerleme (Berkus, Scorecard, DCF)",
        "09. Melek Yatırımcı & Pazarlık",
        "10. Yatırımcı Sunumu (Pitch)",
      ],
      cta: "E-Kitabı İndir (6 $)",
      cardTag: "Sistem Kitabı",
      cardTitleTop: "13 Adımda",
      cardTitleMid: "Milyon Dolarlık",
      cardTitleBottom: "Startup",
      cardNote: "plansız kervan kurmaya son veren büyüme yol haritası.",
    },

    trainingSection: {
      eyebrow: "Video Eğitim · En Çok Aranan",
      title: "Yatırımcı Sunumu Nasıl Yapılır?",
      bodyBefore: "Teoriyle değil, ",
      bodyStrong: "gerçekten yatırım almış bir sunum üzerinden",
      bodyAfter: " ilerliyoruz. Slaytları tek tek açıp yatırımcıyı ikna eden püf noktalarını gösteriyorum. 1 dakikalık önizleme ücretsiz.",
      videoTitle: "Yatırımcı Sunumu Eğitimi — Önizleme",
      videoLabel: "1 dakikalık önizlemeyi izle",
      posterBadge: "Ücretsiz Önizleme",
      posterTitle: "Yatırımcı Sunumu Nasıl Yapılır?",
      posterSubtitle: "Yatırım almış gerçek bir sunum üzerinden",
      modules: [
        "Problem & Çözüm Anlatımı",
        "Pazar Büyüklüğü & Rakip Analizi",
        "Ekip Kurma & Yatırımcıya Güven",
        "İş Modeli & Gelir Mantığı",
        "Yatırım Almış Gerçek Sunum İncelemesi",
      ],
      cta: "Önizlemeyi İzle & Eğitime Eriş",
      note: "Tanıtım ücretsiz · Tam eğitim 70 $ (e-kitap alana 35 $)",
    },

    about: {
      eyebrow: "Startup Doktoru Hakkında",
      name: "Eser Memişoğlu",
      p1: "Son 10 yıldır startup, teknoloji, inovasyon ve yatırım ilişkileri alanlarında aktif rol oynamaktayım. Bugüne kadar 3 farklı teknoloji şirketinin kuruculuğunu üstlendim, onlarca girişimciye ve scale-up markaya sistem kurulumu konusunda yol arkadaşlığı yaptım.",
      p2: "İşlerin plansız ve 'kervan yolda düzülür' diyerek yürütülmesine karşıyım. Startup Doktoru platformu ile edindiğim en kritik dersleri ürünleştirerek, iş modelinizi yatırım alabilecek ve kârlı bir şekilde ölçeklenebilecek otonom bir sisteme dönüştürmeyi hedefliyorum.",
      stats: [
        { value: "10+", label: "Yıl Tecrübe" },
        { value: "3", label: "Girişim Kurulumu" },
        { value: "100+", label: "Girişimci Mentorluk" },
      ],
      portraitAlt: "Eser Memişoğlu — Kurucu & Girişim Danışmanı",
      role: "Kurucu & Girişim Danışmanı",
      roleNote: "İnovasyon, Finansman, Yatırımcı İlişkileri ve Growth Sistemleri üzerine çalışmalarına devam ediyor.",
      quote: "Kervan yolda değil, stratejiyle düzülür.",
      quoteCaption: "Eser Memişoğlu'nun ilkesi",
    },

    faqSection: {
      eyebrow: "Merak Edilenler",
      title: "Sıkça Sorulan Sorular",
      items: [
        {
          q: "Startup Doktoru tam olarak nedir?",
          a: "Startup Doktoru, girişimcilerin fikir aşamasından yatırım aşamasına kadar olan yolculuğunu sistematik hale getiren bir eğitim, mentörlük ve büyüme platformudur. Amacımız sadece teorik bilgi değil, uygulanabilir iş modelleri ve büyüme hunileri kurmanızı sağlamaktır.",
        },
        {
          q: "E-Kitabı satın aldıktan sonra nasıl erişeceğim?",
          a: "E-Kitap satın alma işlemi tamamlandığında, anında dijital PDF indirme bağlantınız ekranda belirecektir. Ayrıca kayıt olduğunuz e-posta adresinize de otomatik olarak öğrenci portalı erişim linkiniz iletilecektir.",
        },
        {
          q: "Yatırımcı Sunumu Eğitimi bana ne kazandırır?",
          a: "Bu eğitim, yatırımcıların bir sunumda (pitch deck) aradığı 5 temel odağı (Metrikler, Ekip, Problem-Çözüm, Pazar Büyüklüğü ve Finansal Yol Haritası) detaylandırır. Eğitimi tamamladığınızda yatırımcıları ikna edebilecek seviyede profesyonel bir sunum hazırlamış olursunuz.",
        },
        {
          q: "Birebir danışmanlık hizmetini nasıl alabilirim?",
          a: "Danışmanlık modelimiz 'Değer Merdiveni' prensibine dayanır. Ücretsiz eğitim veya e-kitabımızı edindikten sonra panelimizden veya iletişim formundan doğrudan Startup Check-Up ve Growth Danışmanlığı talebi gönderebilirsiniz.",
        },
      ],
    },

    finalCta: {
      badge: "Otomatik Büyüme Makinesi",
      title: "Girişiminizi yatırım alınabilir, kârlı bir sisteme dönüştürmeye hazır mısınız?",
      body: "Teoride kalmayın. Startup Doktoru'nun pratik el kitapları, video eğitim modülleri ve otomatik büyüme stratejileri ile bugün işinizi bir üst kademeye taşıyın.",
      primary: "Ücretsiz Eğitime Başla",
      secondary: "E-Kitabı Edin (6 $)",
    },

    stickyBar: {
      title: "13 Adımda Milyon Dolarlık Startup",
      meta: "E-Kitap ·",
      cta: "Hemen Al · 6 $",
    },
  },
  prices: {
    ebookOld: "12 $",
    ebookNew: "6 $",
  },

  testimonials: {
    eyebrow: "Öğrenci Sonuçları",
    title: "Eğitimi Alanlar Ne Diyor?",
    lead: "Gerçek girişimcilerden, kendi ağızlarından.",
    watch: "İzle",
    videoTitleSuffix: "memnuniyet",
  },

  vcNetwork: {
    eyebrow: "Güvenilir Kaynak",
  },

  discountPopup: {
    normalPrice: "Normal fiyat",
    todayForYou: "Bugün sana",
    discountBadge: "%50 İndirim · Hemen Yakala",
    close: "Kapat",
    title: "Gitmeden önce dur!",
    bodyStrong: "13 Adımda Milyon Dolarlık Startup",
    bodyRest: " e-kitabını ilk siparişe özel yarı fiyatına al.",
    emailPlaceholder: "e-posta adresin",
    cta: "Hemen 6 $'a Al",
    noSpam: "Spam yok. İstediğin zaman çıkabilirsin.",
    doneTitle: "İndirimin hazır 🎉",
    doneBody: "E-kitabı şimdi yarı fiyatına, hemen indirebilirsin.",
    doneCta: "Hemen 6 $'a Sahip Ol",
  },
};

export type Dict = typeof tr;
