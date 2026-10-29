import type { Metin } from "../../components/HukukiMetin";

// Gizlilik Politikası — sitenin GERÇEK veri akışlarına göre yazıldı (2026-10-28 envanteri).
// Yeni bir form, sağlayıcı ya da izleme eklenirse bu metni de güncelle.

const tr: Metin = {
  baslik: "Gizlilik Politikası",
  guncelleme: "Son güncelleme: 28 Ekim 2026",
  giris: [
    "Bu politika, startupdoktoru.com (\"Startup Doktoru\") sitesini kullandığında hangi bilgilerini topladığımızı, bunları ne için kullandığımızı ve kimlerle paylaştığımızı anlatır.",
    "Veri sorumlusu Eser Memişoğlu'dur. Sorularını ve taleplerini doktorstartup@gmail.com adresine yazabilirsin. 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamındaki ayrıntılı bilgilendirme için KVKK Aydınlatma Metni sayfasına bak.",
  ],
  bolumler: [
    {
      baslik: "1. Topladığımız bilgiler",
      metin: [
        "- Ücretsiz eğitim formu: ad, e-posta, telefon, şirket/proje adı ve girişim aşaması.\n- İndirim penceresi ve İngilizce baskı haber listesi: e-posta.\n- Üyelik ve giriş: ad, e-posta, telefon ve şifre (şifre yalnızca giriş altyapımızda şifrelenmiş olarak tutulur). Google ile girişte Google hesabının adı, e-postası ve profil bilgileri.\n- Satın alma: ad, e-posta, telefon (isteğe bağlı) ve sipariş bilgileri (ürün, tutar, ödeme referansı). Kart bilgilerin bize ulaşmaz; doğrudan ödeme kuruluşu Stripe tarafından işlenir.\n- E-kitap: satın aldığın e-kitabın her sayfasına adın ve e-postan kopya koruması olarak basılır.\n- Kitap yorumları: ad, meslek, puan ve yorum metni. Yorumun yalnızca izin verirsen ve onaylanırsa sitede yayınlanır.\n- Girişim profili: girişim adı, açıklama, sunum (deck) linki, web sitesi, sektör, aşama, ekip büyüklüğü, şehir, ürün aşaması ve değerleme.\n- Yapay zekâ mentoru: ad, e-posta, telefon, proje adı ve sohbette yazdığın mesajlar.\n- Site kullanımı: ziyaret ettiğin sayfalar, nereden geldiğin (yönlendiren site ve kampanya kodları) ve tarayıcında tutulan rastgele bir oturum kimliği. Formu doldurduğunda ya da satın aldığında bu olaylar e-postanla ilişkilendirilir.",
      ],
    },
    {
      baslik: "2. Bilgilerini ne için kullanıyoruz",
      metin: [
        "- Satın aldığın ürünü ve eğitimleri sunmak, e-kitabı teslim etmek, hesabını yönetmek.\n- Sana eğitim içerikleri, hatırlatmalar ve teklifler içeren e-postalar göndermek (aşağıdaki \"E-postalar\" bölümüne bak).\n- Girişimini, onaylandıktan sonra eşleştiğin yatırımcılara göstermek ve yatırımcılardan gelen görüşme taleplerini sana iletmek.\n- Telefonunu, yatırımcıların ve ekibimizin seninle iletişime geçebilmesi için kullanmak. Otomatik SMS veya WhatsApp mesajı göndermiyoruz.\n- Hangi sayfaların ve kampanyaların işe yaradığını ölçmek, siteyi geliştirmek.\n- Yasal yükümlülüklerimizi yerine getirmek ve olası uyuşmazlıklarda haklarımızı korumak.",
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
      baslik: "5. Yatırımcılar",
      metin: [
        "Yatırımcı ağımızdaki kişilerin ad, unvan, şirket, e-posta, yatırım tezi, sektör ve portföy bilgilerini; şirket web siteleri, LinkedIn ve yatırımcı veritabanları gibi herkese açık kaynaklardan derliyoruz. Bu bilgileri, uygun girişimleri tanıtmak ve platformumuza davet etmek için kullanıyoruz.",
        "Yatırımcılara giden e-postaların açılma ve tıklanma bilgisi, platformda hangi girişimi görüntülediği ve verdiği yanıtlar kaydedilir. Bize gönderilen yanıt e-postaları da saklanır. E-postalardaki çıkış linkiyle ya da doktorstartup@gmail.com adresine yazarak listeden çıkabilir, kaydının silinmesini isteyebilirsin.",
      ],
    },
    {
      baslik: "6. Bilgilerini paylaştığımız hizmet sağlayıcılar",
      metin: [
        "Bilgilerini satmıyoruz. Siteyi çalıştırmak için şu hizmet sağlayıcılarla, yalnızca gereken ölçüde paylaşıyoruz:",
        "- Vercel: site barındırma (ABD).\n- Supabase: veritabanı, dosya depolama ve üyelik/giriş altyapısı.\n- Stripe: ödeme işlemleri.\n- Resend: e-posta gönderimi ve alımı.\n- Google: Google ile giriş ve Gemini yapay zekâ hizmeti.\n- OpenAI ve Moonshot AI: yapay zekâ mentoru.\n- Bunny.net: eğitim videoları.\n- YouTube ve Google Drive: gömülü video ve sunum önizlemeleri.",
        "Bu sağlayıcıların bir kısmı Türkiye dışında (özellikle ABD'de; Moonshot AI Çin'de) bulunur; bu nedenle bilgilerin yurt dışına aktarılır. Ayrıca yasal zorunluluk halinde yetkili kamu kurumlarıyla paylaşabiliriz. Onaylanan girişim profilleri, eşleşen yatırımcılara gösterilir.",
      ],
    },
    {
      baslik: "7. Çerezler ve tarayıcı depolama",
      metin: [
        "Sitede reklam veya üçüncü taraf analiz çerezi (Google Analytics, Meta Pixel vb.) kullanmıyoruz. Bunun yerine tarayıcının yerel depolama alanında (localStorage/sessionStorage) şunları tutuyoruz: rastgele oturum kimliği, kampanya kaynağı (30 gün), giriş oturumu, açılır pencereyi gördüğün bilgisi, e-kitapta kaldığın sayfa ve benzeri tercih bilgileri.",
        "Bu bilgileri tarayıcının site verilerini temizleyerek silebilirsin; bu durumda oturumun kapanır. Gömülü YouTube ve Bunny.net videoları oynatıldığında bu hizmetler kendi çerezlerini kullanabilir.",
      ],
    },
    {
      baslik: "8. Saklama süresi",
      metin: [
        "Bilgilerini, toplandıkları amaç sürdükçe saklarız. Sipariş ve fatura kayıtları yasal saklama süreleri boyunca tutulur. E-posta listesinden çıktığında adresin yalnızca sana tekrar pazarlama e-postası gönderilmemesi için çıkış listesinde kalır. Silinmesini istediğin bilgileri, yasal saklama yükümlülüğü yoksa sileriz.",
      ],
    },
    {
      baslik: "9. Güvenlik",
      metin: [
        "Bilgilerin şifreli bağlantı (HTTPS) üzerinden taşınır ve erişimi sınırlandırılmış sistemlerde tutulur. Hiçbir sistem kusursuz değildir; bir güvenlik ihlali fark edersek KVKK'nın öngördüğü şekilde bildirimde bulunuruz.",
      ],
    },
    {
      baslik: "10. Hakların ve iletişim",
      metin: [
        "Bilgilerine erişme, düzeltilmesini veya silinmesini isteme ve itiraz etme hakların var. Ayrıntılar ve başvuru yolu KVKK Aydınlatma Metni'nde yer alır. Talebin için doktorstartup@gmail.com adresine yaz.",
        "Bu politikayı güncelleyebiliriz. Önemli değişiklikleri bu sayfada tarihle birlikte yayınlarız.",
      ],
    },
  ],
};

const en: Metin = {
  baslik: "Privacy Policy",
  guncelleme: "Last updated: 28 October 2026",
  giris: [
    "This policy explains what information we collect when you use startupdoktoru.com (\"Startup Doktoru\"), what we use it for and who we share it with.",
    "The data controller is Eser Memişoğlu. Send questions and requests to doktorstartup@gmail.com. For the detailed notice under Turkey's Personal Data Protection Law No. 6698 (KVKK), see the KVKK Information Notice page.",
  ],
  bolumler: [
    {
      baslik: "1. Information we collect",
      metin: [
        "- Free training form: name, email, phone, company/project name and startup stage.\n- Discount popup and English edition waitlist: email.\n- Sign-up and login: name, email, phone and password (the password is stored only in encrypted form by our login provider). With Google sign-in, your Google account name, email and profile details.\n- Purchases: name, email, phone (optional) and order details (product, amount, payment reference). Card details never reach us; they are processed directly by Stripe.\n- E-book: your name and email are printed on every page of the e-book you buy, as copy protection.\n- Book reviews: name, profession, rating and review text. A review is published only with your permission and after approval.\n- Startup profile: startup name, description, pitch deck link, website, sector, stage, team size, city, product stage and valuation.\n- AI mentor: name, email, phone, project name and the messages you type.\n- Site usage: pages you visit, where you came from (referring site and campaign codes) and a random session ID stored in your browser. When you submit a form or buy something, these events are linked to your email.",
      ],
    },
    {
      baslik: "2. How we use it",
      metin: [
        "- To provide the products and courses you buy, deliver the e-book and run your account.\n- To send you emails with course content, reminders and offers (see \"Emails\" below).\n- To show your startup, once approved, to investors you are matched with, and to pass on their meeting requests.\n- To let investors and our team contact you by phone. We do not send automated SMS or WhatsApp messages.\n- To measure which pages and campaigns work and improve the site.\n- To meet our legal obligations and protect our rights in disputes.",
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
      baslik: "5. Investors",
      metin: [
        "We compile the name, title, firm, email, investment thesis, sectors and portfolio of investors in our network from publicly available sources such as firm websites, LinkedIn and investor databases. We use this to introduce relevant startups and invite investors to our platform.",
        "We record whether our emails to investors are opened and clicked, which startups they view on the platform and how they respond. Replies sent to us are stored. You can opt out with the link in our emails or by writing to doktorstartup@gmail.com, and ask for your record to be deleted.",
      ],
    },
    {
      baslik: "6. Service providers we share data with",
      metin: [
        "We do not sell your information. We share it, only as needed, with the providers that run the site:",
        "- Vercel: hosting (USA).\n- Supabase: database, file storage and login.\n- Stripe: payments.\n- Resend: sending and receiving email.\n- Google: Google sign-in and the Gemini AI service.\n- OpenAI and Moonshot AI: the AI mentor.\n- Bunny.net: course videos.\n- YouTube and Google Drive: embedded videos and deck previews.",
        "Some of these providers are outside Turkey (mainly in the USA; Moonshot AI is in China), so your information is transferred abroad. We may also share information with authorities where the law requires. Approved startup profiles are shown to matched investors.",
      ],
    },
    {
      baslik: "7. Cookies and browser storage",
      metin: [
        "We use no advertising or third-party analytics cookies (Google Analytics, Meta Pixel, etc.). Instead we keep the following in your browser's local storage (localStorage/sessionStorage): a random session ID, campaign source (30 days), your login session, whether you have seen the popup, your place in the e-book and similar preferences.",
        "You can delete these by clearing the site's data in your browser; this logs you out. Embedded YouTube and Bunny.net videos may set their own cookies when played.",
      ],
    },
    {
      baslik: "8. Retention",
      metin: [
        "We keep your information for as long as the purpose it was collected for continues. Order and invoice records are kept for the legally required periods. If you unsubscribe, your address stays on a suppression list only so that we never email you marketing again. We delete information on request unless the law requires us to keep it.",
      ],
    },
    {
      baslik: "9. Security",
      metin: [
        "Your information travels over encrypted connections (HTTPS) and is kept in access-restricted systems. No system is perfect; if we detect a breach we will report it as KVKK requires.",
      ],
    },
    {
      baslik: "10. Your rights and contact",
      metin: [
        "You have the right to access your information, ask for it to be corrected or deleted, and object. Details and how to apply are in the KVKK Information Notice. Write to doktorstartup@gmail.com.",
        "We may update this policy. Significant changes will be published on this page with a date.",
      ],
    },
  ],
};

export const GIZLILIK = { tr, en };
