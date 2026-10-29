import type { Metin } from "../../components/HukukiMetin";

// KVKK Aydınlatma Metni (6698 sayılı Kanun md. 10) — Gizlilik Politikası ile tutarlı tut.

const tr: Metin = {
  baslik: "KVKK Aydınlatma Metni",
  guncelleme: "Son güncelleme: 28 Ekim 2026",
  giris: [
    "Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu (\"KVKK\") 10. maddesi uyarınca, startupdoktoru.com üzerinden ve yatırımcı ağımız kapsamında işlenen kişisel verilerin hangi amaçla, hangi hukuki sebeple işlendiği, kimlere aktarıldığı ve haklarının neler olduğu konusunda seni bilgilendirmek için hazırlanmıştır.",
  ],
  bolumler: [
    {
      baslik: "1. Veri sorumlusu",
      metin: ["Veri sorumlusu: Eser Memişoğlu (Startup Doktoru)\nWeb sitesi: startupdoktoru.com\nE-posta: doktorstartup@gmail.com"],
    },
    {
      baslik: "2. İşlenen kişisel veriler",
      metin: [
        "- Kimlik: ad, soyad.\n- İletişim: e-posta adresi, telefon numarası.\n- Müşteri işlem: sipariş bilgileri, satın alınan ürünler, ödeme referansı, kitap yorumları, form yanıtları.\n- Mesleki ve girişim bilgileri: şirket/proje adı, girişim aşaması, girişim profili (açıklama, sunum linki, sektör, ekip, şehir, değerleme); yatırımcılar için unvan, şirket, yatırım tezi, sektör, portföy ve kamuya açık profil linkleri.\n- Pazarlama: e-posta açılma/tıklama bilgileri, kampanya kaynağı, ilgilenilen ürünler, abonelikten çıkış kaydı.\n- İşlem güvenliği: giriş kayıtları, oturum kimliği, ziyaret edilen sayfalar.\n- Yapay zekâ mentoruna yazılan mesajlar (kalıcı olarak saklanmaz).",
        "Kart bilgileri tarafımızca işlenmez; ödeme kuruluşu Stripe tarafından alınır. Özel nitelikli kişisel veri (sağlık, din, biyometrik vb.) talep etmiyoruz; lütfen formlara ve sohbete bu tür bilgi yazma.",
      ],
    },
    {
      baslik: "3. İşleme amaçları",
      metin: [
        "- Satın alınan ürün ve eğitimlerin sunulması, e-kitabın teslimi ve kopya koruması, üyelik hesabının yönetimi.\n- Sipariş, ödeme ve faturalandırma süreçlerinin yürütülmesi.\n- Eğitim içerikleri, bilgilendirme ve kampanya e-postalarının gönderilmesi.\n- Girişimlerin yatırımcılarla eşleştirilmesi, girişim profillerinin yatırımcılara sunulması, görüşme taleplerinin iletilmesi.\n- Yatırımcılara uygun girişimlerin tanıtılması ve platforma davet edilmesi.\n- Yapay zekâ mentoru hizmetinin sunulması.\n- Site kullanımının ve kampanya performansının ölçülmesi, hizmetlerin geliştirilmesi.\n- Bilgi güvenliğinin sağlanması, hukuki yükümlülüklerin yerine getirilmesi, olası uyuşmazlıklarda hakların korunması.",
      ],
    },
    {
      baslik: "4. Toplama yöntemi ve hukuki sebepler",
      metin: [
        "Kişisel veriler; site formları, üyelik ve Google ile giriş, ödeme sayfası, girişim profili formu, yapay zekâ mentoru, e-posta yazışmaları ve tarayıcı depolama alanı aracılığıyla elektronik ortamda, otomatik veya kısmen otomatik yollarla toplanır. Yatırımcılara ait veriler; şirket web siteleri, LinkedIn ve yatırımcı veritabanları gibi kamuya açık kaynaklardan derlenir.",
        "Bu veriler KVKK md. 5 kapsamında şu hukuki sebeplere dayanılarak işlenir:",
        "- Bir sözleşmenin kurulması veya ifası (md. 5/2-c): satın alma, e-kitap teslimi, üyelik, girişim–yatırımcı eşleştirme.\n- Hukuki yükümlülüğün yerine getirilmesi (md. 5/2-ç): fatura ve ticari kayıtların saklanması.\n- Bir hakkın tesisi, kullanılması veya korunması (md. 5/2-e): uyuşmazlık halinde kayıtların kullanılması.\n- İlgili kişinin kendisi tarafından alenileştirilmiş olması (md. 5/2-d): yatırımcıların kamuya açık mesleki bilgileri.\n- Meşru menfaat (md. 5/2-f): site kullanımının ölçülmesi, hizmetlerin geliştirilmesi, bilgi güvenliği, yatırımcılara mesleki nitelikte tanıtım yapılması.\n- Açık rıza (md. 5/1): diğer hukuki sebeplerin bulunmadığı işlemeler ile yurt dışına aktarımın açık rızaya dayandığı haller.",
        "Ticari elektronik iletiler (kampanya e-postaları), 6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun kapsamında onayına dayanılarak gönderilir; tacir ve esnaf alıcılara yönelik iletilerde önceden onay aranmayabilir. Her iletide ücretsiz ve tek tıkla ret imkânı bulunur.",
      ],
    },
    {
      baslik: "5. Kişisel verilerin aktarılması",
      metin: [
        "Kişisel verilerin, yukarıdaki amaçlarla sınırlı olarak şu alıcılara aktarılabilir:",
        "- Hizmet sağlayıcılar: barındırma (Vercel), veritabanı ve giriş altyapısı (Supabase), ödeme (Stripe), e-posta (Resend), yapay zekâ (Google Gemini, OpenAI, Moonshot AI), video ve önizleme (Bunny.net, YouTube, Google Drive).\n- Yatırımcılar: onaylanan girişim profilleri ve iletişim talepleri, eşleşen yatırımcılara.\n- Girişimler: yatırımcının görüşme talebi, ilgili girişime.\n- Yetkili kamu kurum ve kuruluşları: hukuken yetkili olmaları ve talep etmeleri halinde.",
        "Hizmet sağlayıcıların önemli bir kısmının sunucuları yurt dışında (başta ABD; Moonshot AI için Çin) bulunduğundan, kişisel verilerin KVKK md. 9'da öngörülen şartlara uygun olarak yurt dışına aktarılır.",
      ],
    },
    {
      baslik: "6. Saklama süresi",
      metin: [
        "Kişisel veriler, işleme amacının gerektirdiği süre boyunca ve ilgili mevzuatta öngörülen saklama süreleri (ör. ticari kayıtlar için 10 yıl) kadar saklanır; süre sonunda silinir, yok edilir veya anonim hale getirilir. Ticari iletiyi reddeden kişinin e-posta adresi, yeniden ileti gönderilmemesi amacıyla çıkış listesinde tutulur.",
      ],
    },
    {
      baslik: "7. KVKK md. 11 kapsamındaki hakların",
      metin: [
        "- Kişisel verilerinin işlenip işlenmediğini öğrenme,\n- İşlenmişse buna ilişkin bilgi talep etme,\n- İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,\n- Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,\n- Eksik veya yanlış işlenmişse düzeltilmesini isteme,\n- KVKK md. 7'deki şartlar çerçevesinde silinmesini veya yok edilmesini isteme,\n- Düzeltme, silme ve yok etme işlemlerinin, verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme,\n- İşlenen verilerin münhasıran otomatik sistemlerle analiz edilmesi suretiyle aleyhine bir sonucun ortaya çıkmasına itiraz etme,\n- Kanuna aykırı işleme nedeniyle zarara uğraman halinde zararın giderilmesini talep etme.",
      ],
    },
    {
      baslik: "8. Başvuru yöntemi",
      metin: [
        "Haklarına ilişkin taleplerini, Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ'e uygun olarak; sistemimizde kayıtlı e-posta adresinden doktorstartup@gmail.com adresine e-posta göndererek, güvenli elektronik veya mobil imza ile ya da yazılı olarak iletebilirsin. Başvurunda adını, soyadını, iletişim bilgini ve talebini açıkça belirt.",
        "Başvurun, talebin niteliğine göre en geç 30 gün içinde ücretsiz olarak sonuçlandırılır. İşlemin ayrıca bir maliyet gerektirmesi halinde Kişisel Verileri Koruma Kurulu'nca belirlenen ücret alınabilir.",
      ],
    },
  ],
};

const en: Metin = {
  baslik: "KVKK Information Notice",
  guncelleme: "Last updated: 28 October 2026",
  giris: [
    "This notice is provided under Article 10 of Turkey's Personal Data Protection Law No. 6698 (\"KVKK\"). It explains why and on what legal basis personal data is processed through startupdoktoru.com and our investor network, who it is shared with, and what your rights are.",
  ],
  bolumler: [
    {
      baslik: "1. Data controller",
      metin: ["Data controller: Eser Memişoğlu (Startup Doktoru)\nWebsite: startupdoktoru.com\nEmail: doktorstartup@gmail.com"],
    },
    {
      baslik: "2. Personal data processed",
      metin: [
        "- Identity: first and last name.\n- Contact: email address, phone number.\n- Customer transactions: order details, products purchased, payment reference, book reviews, form answers.\n- Professional and startup information: company/project name, startup stage, startup profile (description, deck link, sector, team, city, valuation); for investors, title, firm, investment thesis, sectors, portfolio and public profile links.\n- Marketing: email open/click data, campaign source, products of interest, unsubscribe records.\n- Security: login records, session ID, pages visited.\n- Messages typed to the AI mentor (not stored permanently).",
        "We do not process card details; they are collected by the payment provider Stripe. We do not ask for special categories of data (health, religion, biometrics, etc.); please do not enter such information in forms or the chat.",
      ],
    },
    {
      baslik: "3. Purposes",
      metin: [
        "- Providing purchased products and courses, delivering and copy-protecting the e-book, managing accounts.\n- Handling orders, payments and invoicing.\n- Sending course content, information and campaign emails.\n- Matching startups with investors, presenting startup profiles to investors and passing on meeting requests.\n- Introducing relevant startups to investors and inviting them to the platform.\n- Providing the AI mentor.\n- Measuring site usage and campaign performance, improving our services.\n- Information security, meeting legal obligations and protecting our rights in disputes.",
      ],
    },
    {
      baslik: "4. Collection method and legal bases",
      metin: [
        "Personal data is collected electronically, by automated or partly automated means, through site forms, sign-up and Google sign-in, the checkout page, the startup profile form, the AI mentor, email correspondence and browser storage. Investor data is compiled from publicly available sources such as firm websites, LinkedIn and investor databases.",
        "The data is processed on the following legal bases under KVKK Article 5:",
        "- Formation or performance of a contract (Art. 5/2-c): purchases, e-book delivery, accounts, startup–investor matching.\n- Compliance with a legal obligation (Art. 5/2-ç): keeping invoices and commercial records.\n- Establishing, exercising or defending a right (Art. 5/2-e): using records in disputes.\n- Data made public by the data subject (Art. 5/2-d): investors' publicly available professional information.\n- Legitimate interest (Art. 5/2-f): measuring site usage, improving services, information security, professional introductions to investors.\n- Explicit consent (Art. 5/1): processing with no other legal basis, and transfers abroad that rely on explicit consent.",
        "Commercial electronic messages (campaign emails) are sent on the basis of your approval under Law No. 6563 on Electronic Commerce; prior approval may not be required for messages to merchants and tradespeople. Every message offers a free, one-click opt-out.",
      ],
    },
    {
      baslik: "5. Transfers",
      metin: [
        "Your personal data may be transferred, limited to the purposes above, to:",
        "- Service providers: hosting (Vercel), database and login (Supabase), payments (Stripe), email (Resend), AI (Google Gemini, OpenAI, Moonshot AI), video and previews (Bunny.net, YouTube, Google Drive).\n- Investors: approved startup profiles and contact requests, to matched investors.\n- Startups: an investor's meeting request, to the startup concerned.\n- Competent public authorities: where legally authorised and requested.",
        "Because many of these providers' servers are abroad (mainly the USA; China for Moonshot AI), your personal data is transferred abroad in accordance with the conditions of KVKK Article 9.",
      ],
    },
    {
      baslik: "6. Retention",
      metin: [
        "Personal data is kept for as long as the purpose requires and for the retention periods set by law (e.g. 10 years for commercial records), after which it is deleted, destroyed or anonymised. The email address of someone who opts out of commercial messages is kept on a suppression list so that no further messages are sent.",
      ],
    },
    {
      baslik: "7. Your rights under KVKK Article 11",
      metin: [
        "- To learn whether your personal data is processed,\n- To request information if it has been processed,\n- To learn the purpose of processing and whether it is used accordingly,\n- To know the third parties in Turkey or abroad it is transferred to,\n- To request correction if it is incomplete or inaccurate,\n- To request deletion or destruction under the conditions of KVKK Article 7,\n- To request that correction, deletion and destruction be notified to third parties it was transferred to,\n- To object to an outcome against you arising exclusively from automated analysis,\n- To claim compensation for damage caused by unlawful processing.",
      ],
    },
    {
      baslik: "8. How to apply",
      metin: [
        "In line with the Communiqué on the Procedures and Principles of Application to the Data Controller, you can send your request by email to doktorstartup@gmail.com from the email address registered in our system, with a secure electronic or mobile signature, or in writing. Include your name, contact details and a clear description of your request.",
        "Requests are concluded free of charge within 30 days at the latest. If the action involves an additional cost, the fee set by the Personal Data Protection Board may be charged.",
      ],
    },
  ],
};

export const KVKK = { tr, en };
