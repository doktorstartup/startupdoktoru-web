import type { Metin } from "../../components/HukukiMetin";

// Gizlilik Politikası — sitenin GERÇEK veri akışlarına göre yazıldı (2026-10-28 envanteri).
// Yeni bir form, sağlayıcı ya da izleme eklenirse bu metni de güncelle.

const tr: Metin = {
  baslik: "Gizlilik Politikası",
  guncelleme: "Son güncelleme: 7 Kasım 2026",
  giris: [
    "Bu politika, startupdoktoru.com (\"Startup Doktoru\") sitesini kullandığında hangi bilgilerini topladığımızı, bunları ne için kullandığımızı ve kimlerle paylaştığımızı anlatır.",
    "Veri sorumlusu Eser Memişoğlu'dur. Sorularını ve taleplerini doktorstartup@gmail.com adresine yazabilirsin. 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamındaki ayrıntılı bilgilendirme için KVKK Aydınlatma Metni sayfasına bak.",
  ],
  bolumler: [
    {
      baslik: "1. Topladığımız bilgiler",
      metin: [
        "- Ücretsiz eğitim formu: ad, e-posta, telefon, şirket/proje adı ve girişim aşaması.\n- İndirim penceresi ve İngilizce baskı haber listesi: e-posta.\n- Üyelik ve giriş: ad, e-posta, telefon ve şifre (şifre yalnızca giriş altyapımızda şifrelenmiş olarak tutulur). Google ile girişte Google hesabının adı, e-postası ve profil bilgileri.\n- Satın alma: ad, e-posta, telefon (isteğe bağlı) ve sipariş bilgileri (ürün, tutar, ödeme referansı). Kart bilgilerin bize ulaşmaz; doğrudan ödeme kuruluşu Stripe tarafından işlenir.\n- E-kitap: satın aldığın e-kitabın her sayfasına adın ve e-postan kopya koruması olarak basılır.\n- Kitap yorumları: ad, meslek, puan ve yorum metni. Yorumun yalnızca izin verirsen ve onaylanırsa sitede yayınlanır.\n- Girişim profili: girişim adı, açıklama, sunum (deck) linki, web sitesi, sektör, aşama, ekip büyüklüğü, şehir, ürün aşaması ve değerleme.\n- Yapay zekâ mentoru: ad, e-posta, telefon, proje adı ve sohbette yazdığın mesajlar.\n- WhatsApp, Instagram ve web sohbeti: ad veya kullanıcı adı, telefon numarası ya da hesap bilgisi, yazdığın mesajlar ve görüşme geçmişi.\n- Site kullanımı: çerez onayı vermediysen yalnızca hangi sayfanın görüntülendiğini kimliksiz olarak sayarız. Onay verdiysen ziyaret ettiğin sayfalar, nereden geldiğin (yönlendiren site ve kampanya kodları), tarayıcında tutulan rastgele bir oturum kimliği, izlediğin videolar (başlatma, yarısına gelme, bitirme) ve ödeme formunu açtığın bilgisi kaydedilir. Üye girişi yaptığında, formu doldurduğunda ya da satın aldığında bu kayıtlar e-postanla ilişkilendirilir.",
      ],
    },
    {
      baslik: "2. Bilgilerini ne için kullanıyoruz",
      metin: [
        "- Satın aldığın ürünü ve eğitimleri sunmak, e-kitabı teslim etmek, hesabını yönetmek.\n- Sana eğitim içerikleri, hatırlatmalar ve teklifler içeren e-postalar göndermek (aşağıdaki \"E-postalar\" bölümüne bak).\n- Girişimini, onaylandıktan sonra eşleştiğin yatırımcılara göstermek ve yatırımcılardan gelen görüşme taleplerini sana iletmek.\n- Telefonunu, yatırımcıların ve ekibimizin seninle iletişime geçebilmesi için kullanmak. WhatsApp'tan yalnızca bize yazdığında ya da onay verdiysen mesaj göndeririz (aşağıdaki \"WhatsApp, Instagram ve web sohbeti\" bölümüne bak). Otomatik SMS göndermiyoruz.\n- Hangi sayfaların ve kampanyaların işe yaradığını ölçmek, siteyi geliştirmek.\n- Onay verdiysen, ilgilendiğin içeriklere göre sana uygun eğitim, hatırlatma ve teklifleri seçmek (profilleme). Bu değerlendirme senin hakkında hukuki ya da benzeri önemli bir sonuç doğuran otomatik bir karar içermez.\n- Yasal yükümlülüklerimizi yerine getirmek ve olası uyuşmazlıklarda haklarımızı korumak.",
      ],
    },
    {
      baslik: "3. E-postalar",
      metin: [
        "Form doldurduğunda, üye olduğunda ya da ödeme başlattığında sana karşılama, eğitim, hatırlatma ve teklif e-postalarından oluşan bir seri gönderebiliriz. Müşterimiz olduğunda satış hatırlatmaları durur.",
        "E-postalarımız Resend üzerinden gönderilir. Bir e-postanın açılıp açılmadığını ve içindeki linklere tıklanıp tıklanmadığını ölçmek için görünmez bir izleme pikseli ve yönlendirmeli linkler kullanıyoruz.",
        "Her pazarlama e-postasının altında \"Bu e-postaları almak istemiyorum\" linki bulunur; tek tıkla listeden çıkarsın. Çıktıktan sonra yalnızca sipariş, giriş linki gibi işlem e-postaları almaya devam edersin.",
      ],
    },
    {
      baslik: "4. Yapay zekâ mentoru",
      metin: [
        "Sohbette yazdığın mesajlar, yanıt üretilmesi için yapay zekâ hizmet sağlayıcılarına (Google Gemini, Moonshot AI, OpenAI) gönderilir. Sohbet içeriğini kendi veritabanımızda saklamıyoruz; ancak sağlayıcılar kendi politikalarına göre geçici olarak işleyebilir. Sohbete kimlik numarası, şifre veya gizli ticari bilgi yazma.",
        "Mentoru kullanmak için verdiğin ad, e-posta ve telefon, diğer formlarda olduğu gibi kayıt listemize eklenir ve sana e-posta serimiz gönderilebilir.",
      ],
    },
    {
      baslik: "5. WhatsApp, Instagram ve web sohbeti",
      metin: [
        "WhatsApp, Instagram veya web sohbetinden bize yazdığında mesajların, Creato AI mesajlaşma platformu üzerinden işlenir. Sorularına yapay zekâ destekli bir asistan yanıt verebilir. İnsanla görüşmek istediğini yazman yeterli, seni ekibimize aktarırız.",
        "WhatsApp ve Instagram mesajları Meta altyapısından geçer ve Meta'nın kendi politikalarına da tabidir. Yanıtların üretilmesi için mesajların Creato'nun çalıştığı yapay zekâ sağlayıcılarına iletilebilir. Sohbete kimlik numarası, şifre, kart bilgisi veya gizli ticari bilgi yazma.",
        "Onay verdiysen, başlayıp tamamlamadığın bir satın alma için sana WhatsApp'tan hatırlatma gönderebiliriz. Bu mesajları istemiyorsan mesaja yanıt vererek ya da doktorstartup@gmail.com adresine yazarak durdurabilirsin.",
      ],
    },
    {
      baslik: "6. Yatırımcılar",
      metin: [
        "Yatırımcı ağımızdaki kişilerin ad, unvan, şirket, e-posta, yatırım tezi, sektör ve portföy bilgilerini; şirket web siteleri, LinkedIn ve yatırımcı veritabanları gibi herkese açık kaynaklardan derliyoruz. Bu bilgileri, uygun girişimleri tanıtmak ve platformumuza davet etmek için kullanıyoruz.",
        "Yatırımcılara giden e-postaların açılma ve tıklanma bilgisi, platformda hangi girişimi görüntülediği ve verdiği yanıtlar kaydedilir. Bize gönderilen yanıt e-postaları da saklanır. E-postalardaki çıkış linkiyle ya da doktorstartup@gmail.com adresine yazarak listeden çıkabilir, kaydının silinmesini isteyebilirsin.",
      ],
    },
    {
      baslik: "7. Bilgilerini paylaştığımız hizmet sağlayıcılar",
      metin: [
        "Bilgilerini satmıyoruz. Siteyi çalıştırmak için şu hizmet sağlayıcılarla, yalnızca gereken ölçüde paylaşıyoruz:",
        "- Vercel: site barındırma (ABD).\n- Supabase: veritabanı, dosya depolama ve üyelik/giriş altyapısı.\n- Stripe: ödeme işlemleri.\n- Resend: e-posta gönderimi ve alımı.\n- Creato AI: WhatsApp, Instagram ve web sohbeti mesajlarının yönetimi ve yapay zekâ destekli yanıtlar.\n- Meta (WhatsApp, Instagram): mesajların iletilmesi.\n- Google: Google ile giriş ve Gemini yapay zekâ hizmeti.\n- OpenAI ve Moonshot AI: yapay zekâ mentoru.\n- Bunny.net: eğitim videoları.\n- YouTube ve Google Drive: gömülü video ve sunum önizlemeleri.",
        "Bu sağlayıcıların bir kısmı Türkiye dışında (özellikle ABD'de; Moonshot AI Çin'de) bulunur; bu nedenle bilgilerin yurt dışına aktarılır. Ayrıca yasal zorunluluk halinde yetkili kamu kurumlarıyla paylaşabiliriz. Onaylanan girişim profilleri, eşleşen yatırımcılara gösterilir.",
      ],
    },
    {
      baslik: "8. Çerezler ve tarayıcı depolama",
      metin: [
        "Sitede reklam veya üçüncü taraf analiz çerezi (Google Analytics, Meta Pixel vb.) kullanmıyoruz. Tarayıcının yerel depolama alanında (localStorage/sessionStorage) şunları tutuyoruz:",
        "- Zorunlu: giriş oturumu, çerez tercihin, açılır pencereyi gördüğün bilgisi, e-kitapta kaldığın sayfa ve benzeri tercih bilgileri. Bunlar site çalışsın diye gereklidir, onay istemez.\n- Analiz ve kişiselleştirme (yalnızca onayınla): rastgele oturum kimliği ve kampanya kaynağı (30 gün).",
        "Siteye ilk girişte \"Kabul et\" veya \"Reddet\" seçebilirsin. Kararını bu sayfanın en altındaki \"Çerez tercihleri\" bağlantısından istediğin zaman değiştirebilirsin; reddettiğinde oturum kimliği ve kampanya kaynağı tarayıcından silinir. Tüm bilgileri tarayıcının site verilerini temizleyerek de silebilirsin; bu durumda oturumun kapanır. Gömülü YouTube ve Bunny.net videoları oynatıldığında bu hizmetler kendi çerezlerini kullanabilir.",
      ],
    },
    {
      baslik: "9. Saklama süresi",
      metin: [
        "Bilgilerini, toplandıkları amaç sürdükçe saklarız. Sipariş ve fatura kayıtları yasal saklama süreleri boyunca tutulur. Sayfa, video ve ödeme formu kayıtların 12 ay sonra kimliksizleştirilir; yalnızca sayımlar kalır. E-posta listesinden çıktığında adresin yalnızca sana tekrar pazarlama e-postası gönderilmemesi için çıkış listesinde kalır. Silinmesini istediğin bilgileri, yasal saklama yükümlülüğü yoksa sileriz.",
      ],
    },
    {
      baslik: "10. Güvenlik",
      metin: [
        "Bilgilerin şifreli bağlantı (HTTPS) üzerinden taşınır ve erişimi sınırlandırılmış sistemlerde tutulur. Hiçbir sistem kusursuz değildir; bir güvenlik ihlali fark edersek KVKK'nın öngördüğü şekilde bildirimde bulunuruz.",
      ],
    },
    {
      baslik: "11. Hakların ve iletişim",
      metin: [
        "Bilgilerine erişme, düzeltilmesini veya silinmesini isteme ve itiraz etme hakların var. Ayrıntılar ve başvuru yolu KVKK Aydınlatma Metni'nde yer alır. Talebin için doktorstartup@gmail.com adresine yaz.",
        "Bu politikayı güncelleyebiliriz. Önemli değişiklikleri bu sayfada tarihle birlikte yayınlarız.",
      ],
    },
  ],
};

const en: Metin = {
  baslik: "Privacy Policy",
  guncelleme: "Last updated: 7 November 2026",
  giris: [
    "This policy explains what information we collect when you use startupdoktoru.com (\"Startup Doktoru\"), what we use it for and who we share it with.",
    "The data controller is Eser Memişoğlu. Send questions and requests to doktorstartup@gmail.com. For the detailed notice under Turkey's Personal Data Protection Law No. 6698 (KVKK), see the KVKK Information Notice page.",
  ],
  bolumler: [
    {
      baslik: "1. Information we collect",
      metin: [
        "- Free training form: name, email, phone, company/project name and startup stage.\n- Discount popup and English edition waitlist: email.\n- Sign-up and login: name, email, phone and password (the password is stored only in encrypted form by our login provider). With Google sign-in, your Google account name, email and profile details.\n- Purchases: name, email, phone (optional) and order details (product, amount, payment reference). Card details never reach us; they are processed directly by Stripe.\n- E-book: your name and email are printed on every page of the e-book you buy, as copy protection.\n- Book reviews: name, profession, rating and review text. A review is published only with your permission and after approval.\n- Startup profile: startup name, description, pitch deck link, website, sector, stage, team size, city, product stage and valuation.\n- AI mentor: name, email, phone, project name and the messages you type.\n- Site usage: if you have not given cookie consent, we only count page views anonymously. If you have, we record the pages you visit, where you came from (referring site and campaign codes), a random session ID stored in your browser, the videos you watch (started, halfway, finished) and when you open the checkout form. When you log in, submit a form or buy something, these records are linked to your email.",
      ],
    },
    {
      baslik: "2. How we use it",
      metin: [
        "- To provide the products and courses you buy, deliver the e-book and run your account.\n- To send you emails with course content, reminders and offers (see \"Emails\" below).\n- To show your startup, once approved, to investors you are matched with, and to pass on their meeting requests.\n- To let investors and our team contact you by phone. We only message you on WhatsApp when you write to us or have given your consent (see \"WhatsApp, Instagram and web chat\" below). We do not send automated SMS.\n- To measure which pages and campaigns work and improve the site.\n- With your consent, to choose courses, reminders and offers that suit the content you are interested in (profiling). This does not involve any automated decision with legal or similarly significant effects on you.\n- To meet our legal obligations and protect our rights in disputes.",
      ],
    },
    {
      baslik: "3. Emails",
      metin: [
        "When you submit a form, sign up or start a checkout, we may send you a series of welcome, course, reminder and offer emails. Sales reminders stop once you become a customer.",
        "Our emails are sent through Resend. We use an invisible tracking pixel and redirected links to measure whether an email was opened and which links were clicked.",
        "Every marketing email has an \"unsubscribe\" link at the bottom that removes you in one click. After that you only receive transactional emails such as order confirmations and login links.",
      ],
    },
    {
      baslik: "4. AI mentor",
      metin: [
        "Messages you type in the chat are sent to AI providers (Google Gemini, Moonshot AI, OpenAI) to generate replies. We do not store chat content in our database, but providers may process it temporarily under their own policies. Do not type ID numbers, passwords or confidential business information.",
        "The name, email and phone you give to use the mentor are added to our contact list like any other form, and you may receive our email series.",
      ],
    },
    {
      baslik: "5. WhatsApp, Instagram and web chat",
      metin: [
        "When you write to us on WhatsApp, Instagram or web chat, your messages are processed through the Creato AI messaging platform. An AI assistant may answer your questions. Just say you would like to talk to a person and we will pass you to our team.",
        "WhatsApp and Instagram messages travel through Meta's infrastructure and are also subject to Meta's own policies. To generate replies, your messages may be passed to the AI providers Creato works with. Do not type ID numbers, passwords, card details or confidential business information.",
        "If you have given your consent, we may send you a WhatsApp reminder about a purchase you started but did not finish. To stop these messages, reply to them or write to doktorstartup@gmail.com.",
      ],
    },
    {
      baslik: "6. Investors",
      metin: [
        "We compile the name, title, firm, email, investment thesis, sectors and portfolio of investors in our network from publicly available sources such as firm websites, LinkedIn and investor databases. We use this to introduce relevant startups and invite investors to our platform.",
        "We record whether our emails to investors are opened and clicked, which startups they view on the platform and how they respond. Replies sent to us are stored. You can opt out with the link in our emails or by writing to doktorstartup@gmail.com, and ask for your record to be deleted.",
      ],
    },
    {
      baslik: "7. Service providers we share data with",
      metin: [
        "We do not sell your information. We share it, only as needed, with the providers that run the site:",
        "- Vercel: hosting (USA).\n- Supabase: database, file storage and login.\n- Stripe: payments.\n- Resend: sending and receiving email.\n- Creato AI: managing WhatsApp, Instagram and web chat messages, and AI-assisted replies.\n- Meta (WhatsApp, Instagram): delivering messages.\n- Google: Google sign-in and the Gemini AI service.\n- OpenAI and Moonshot AI: the AI mentor.\n- Bunny.net: course videos.\n- YouTube and Google Drive: embedded videos and deck previews.",
        "Some of these providers are outside Turkey (mainly in the USA; Moonshot AI is in China), so your information is transferred abroad. We may also share information with authorities where the law requires. Approved startup profiles are shown to matched investors.",
      ],
    },
    {
      baslik: "8. Cookies and browser storage",
      metin: [
        "We use no advertising or third-party analytics cookies (Google Analytics, Meta Pixel, etc.). We keep the following in your browser's local storage (localStorage/sessionStorage):",
        "- Essential: your login session, your cookie choice, whether you have seen the popup, your place in the e-book and similar preferences. These are needed for the site to work and do not require consent.\n- Analytics and personalisation (only with your consent): a random session ID and campaign source (30 days).",
        "On your first visit you can choose \"Accept\" or \"Reject\". You can change your choice at any time with the \"Cookie preferences\" link at the very bottom of this page; rejecting removes the session ID and campaign source from your browser. You can also delete everything by clearing the site's data in your browser; this logs you out. Embedded YouTube and Bunny.net videos may set their own cookies when played.",
      ],
    },
    {
      baslik: "9. Retention",
      metin: [
        "We keep your information for as long as the purpose it was collected for continues. Order and invoice records are kept for the legally required periods. Your page, video and checkout records are de-identified after 12 months; only the counts remain. If you unsubscribe, your address stays on a suppression list only so that we never email you marketing again. We delete information on request unless the law requires us to keep it.",
      ],
    },
    {
      baslik: "10. Security",
      metin: [
        "Your information travels over encrypted connections (HTTPS) and is kept in access-restricted systems. No system is perfect; if we detect a breach we will report it as KVKK requires.",
      ],
    },
    {
      baslik: "11. Your rights and contact",
      metin: [
        "You have the right to access your information, ask for it to be corrected or deleted, and object. Details and how to apply are in the KVKK Information Notice. Write to doktorstartup@gmail.com.",
        "We may update this policy. Significant changes will be published on this page with a date.",
      ],
    },
  ],
};

export const GIZLILIK = { tr, en };
