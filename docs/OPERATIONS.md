# Startup Doktoru — Operasyon & Kurulum Rehberi

Canlı: **https://startupdoktoru.com** · Repo: `github.com/doktorstartup/startupdoktoru-web` · Stack: Next.js 16 (App Router) · Tailwind v4 · Supabase · Stripe · Resend · Bunny.net

---

## 1. Deploy
- `main` branch'ine **push → Vercel otomatik deploy.** Branch açmaya gerek yok.
- Lokal: `npm run dev` (port **3001**). `.env.local` gitignore'da (commit edilmez).
- **Env değişirse Vercel'de Redeploy şart** (Deployments → ⋯ → Redeploy). `git push` de yeni deploy tetikler ve güncel env'i alır.

## 2. Ortam Değişkenleri (Vercel + .env.local)
| Anahtar | Açıklama |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase (ref: `mvygvbobwebmceatasmb`) |
| `SUPABASE_DB_URL` | (Eski) doğrudan `pg` bağlantısı — **direkt host artık DNS'te yok**, lokal script'ler için supabase-js REST kullan (bkz. §7) |
| `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` / `STRIPE_WEBHOOK_SECRET` | Ödeme |
| `OPENAI_API_KEY` | AI Mentor |
| `ADMIN_PASSWORD` | Tüm `/admin` ve admin API'leri korur (sunucu doğrular) |
| `RESEND_API_KEY` / `RESEND_FROM` / `RESEND_REPLY_TO` | E-posta. From: `eser@startupdoktoru.com`, Reply-To: `doktorstartup@gmail.com` |
| `CRON_SECRET` | Cron uçlarını korur — **tanımlı (2026-10-31)**, şifresiz istek 401; Vercel cron kendisi gönderir |
| `ADMIN_NOTIFY_EMAIL` (opsiyonel) | Kayıt/satış bildirimleri buraya (varsayılan `esermemisoglu@gmail.com`) |
| `NEXT_PUBLIC_SITE_URL` | `https://startupdoktoru.com` |
| `YOUTUBE_CLIENT_ID` / `YOUTUBE_CLIENT_SECRET` / `YOUTUBE_REFRESH_TOKEN` | Sosyal istatistik — YouTube salt okuma (bkz. §6.1) |
| `IG_ACCESS_TOKEN` / `IG_USER_ID` | Sosyal istatistik — Instagram (süresiz system-user anahtarı, **Secret**; paylaşım izni de var) |
| `PAYLASIM_AKTIF` | `1` ise otomatik paylaşım yayın yapar; yoksa cron hiçbir şey yapmaz (acil durdurma, bkz. §6.2) |

## 3. Kimlik Doğrulama (Supabase Auth)
- **Email+şifre** (Confirm email AÇIK) + **Google OAuth**.
- Google: redirect URI Supabase callback'i; uygulamada `redirectTo` = `/portal/course` (NOT `/portal` — stub kodu düşürür).
- Auth mailleri **Resend SMTP** üzerinden: `smtp.resend.com:465`, user `resend`, pass = Resend API key. (Supabase → Authentication → Emails → SMTP.)
- Erişim (owned) ödenmiş `ds_orders`'tan e-posta eşleşmesiyle gelir; portal her açılışta `/api/access` ile yeniden doğrular.

## 4. Admin Panel (`/admin`, `ADMIN_PASSWORD` ile)
- **Genel Analiz**: ziyaretçi → lead → müşteri, sayfa kırılımı, sepeti bırakanlar.
- **Lead CRM**: ds_leads düzenle/sil/CSV.
- **Erişim Yönetimi**: isim/e-posta ara → çoklu kişiye manuel erişim aç/kaldır (ödeme almadan).
- **Blog Yönetimi**: yazı CRUD + okunma.
- **Otomasyonlar**: drip kampanya/adım ekle-düzenle (aşağı bak).
- **Bülten**: tüm lead'lere tek seferlik toplu mail (önce kendine test).

## 5. E-posta Otomasyonu (Drip Kampanya Motoru)
Tablolar: `ds_campaigns` (cadence: `delay`|`weekly`), `ds_campaign_steps`, `ds_campaign_enrollments`.
- **Tetik:** `lead` (kayıt/popup/AI/ücretsiz eğitim) · `abandoned` (ödemeye gelip bırakma) · `interest` (eğitim tanıtımı izleme).
- **delay** kampanyalar: enroll'da gecikme-0 anında; sonrası cron'la zamanı gelince.
- **weekly** kampanyalar (16 Haftalık Seri): her **Pazar (TR)** bir adım; `last_sent_at` çift-gönderim korur. Seri uzatılabilir — adım eklemek yeter, kod değişmez (bitmemiş kayıtlar yeni adımları sırayla alır).
- Kişi **CUSTOMER** olursa seri durur (spam yok). Kampanyalar bağımsız → bir kişi aynı hafta birden çok kampanyadan mail alabilir.
- **Cron** `/api/cron/followup`: her gün `processDue`; TR'de Pazar ise `processWeekly`. `vercel.json` cron `0 7 * * *` (07:00 UTC = 10:00 TR). Daha kararlı/sık tetik için cron-job.org yedek.
- Aktif kampanyalar: Karşılama · Sepeti Bırakanlar (3 adım) · Genel Takip · İlgi Serileri (Yatırımcı Sunumu / Startup Giriş / Değerleme — `trigger_value` ile ürüne özel) · 16 Haftalık Startup Serisi · Topluluk Daveti (WhatsApp: chat.whatsapp.com/F9E2QPGYU2S5IMVOmfSlGb) · E-kitap → Eğitim Upsell.
- **İçerik dili (tüm kampanyalar):** düz metin, buton/emoji yok, tek link — Gmail'in Promotions sekmesine düşmemek için. Kalıp: yanılgıyı düzelten giriş → hap bilgi → o hafta yapılacak somut iş.

### Mail İzleme & Cevap Takibi (`/admin/mail`)
Tüm giden mailler (drip, bülten, yatırımcı) **`ds_email_messages`** defterine loglanır; açılma/tıklama/teslim/bounce **Resend webhook** ile işlenir. Gelen cevaplar **`ds_inbound_emails`**'e düşer ve `from_email` ile yatırımcıya eşleşir.
- **Gönderim yolu:** `sendLogged()` (`src/lib/mailer.ts`) → `sendEmail` + defter kaydı. Resend'in döndürdüğü `message_id` = `provider_id`; webhook eşleşme anahtarı.
- **Giden webhook:** `/api/webhooks/resend` — olaylar `email.delivered/opened/clicked/bounced/complained`. İmza `RESEND_WEBHOOK_SECRET` (Svix) ile doğrulanır.
- **Gelen webhook:** `/api/webhooks/resend-inbound` — Resend Inbound. İmza `RESEND_INBOUND_SECRET` (yoksa `RESEND_WEBHOOK_SECRET`).
- **Yatırımcı gönderimi:** `/api/admin/invest/send` — KVKK: yalnız `address_purpose='outreach_published'` + e-postası olan yatırımcılara; parti başına ≤200 (deliverability). reply-to = `RESEND_INBOUND_ADDRESS`.
- **Uyarı:** "Açıldı" sinyali (Apple Mail Privacy vb.) güvenilmez → "Tıklandı"ya bak. 30k soğuk listede warm-up + throttle + net opt-out şart, yoksa domain itibarı yanar.

### Engelleme Listesi & Abonelikten Çıkma (opt-out)
Tablo **`ds_email_suppressions`** — bu adreslere **hiçbir pazarlama maili** gitmez (drip, bülten, yatırımcı). İşlem mailleri (`context='transactional'`) etkilenmez.
- **Tek kapı:** `sendLogged()` gönderimden önce listeyi kontrol eder; engelliyse mail gitmez, deftere `status='suppressed'` yazılır (panelde görünür).
- **Otomatik ekleme:** kalıcı bounce + spam şikâyeti → `/api/webhooks/resend` ekler. Geçici (transient/soft) bounce engellemez.
- **Kullanıcı çıkışı:** her pazarlama mailinin altındaki bağlantı + `List-Unsubscribe` / `List-Unsubscribe-Post` başlıkları (Gmail "tek tık"). Uç: `/api/unsubscribe` (HMAC imzalı; başkasının adresi çıkarılamaz).
- **Elle yönetim:** `/admin/mail` → **Engellenenler** sekmesi (ekle / listeden çıkar). Şikâyet edeni geri açma — itibar riski.
- **Migration:** `supabase/migrations/0016_email_suppression.sql`.

**Kurulum (Resend paneli + DNS — canlıda bir kez yapılır):**
1. **Tracking aç:** Resend → Domains → domain → Open/Click tracking ON.
2. **Giden webhook:** Resend → Webhooks → Add → URL `https://startupdoktoru.com/api/webhooks/resend`, olaylar: delivered/opened/clicked/bounced/complained. Signing secret → `RESEND_WEBHOOK_SECRET`.
3. **Inbound (cevap yakalama):** Resend → Inbound → alt-alan ekle (ör. `reply.startupdoktoru.com`) → verdiği **MX kaydını en düşük öncelikle Vercel DNS'e** ekle. Inbound webhook URL `https://startupdoktoru.com/api/webhooks/resend-inbound`, secret → `RESEND_INBOUND_SECRET`.
4. **Reply adresi:** `RESEND_INBOUND_ADDRESS=yatirim@reply.startupdoktoru.com` (bu adrese gelen cevaplar Inbound'a düşer). Env değişince Vercel Redeploy.
5. **Migration:** `supabase/migrations/0015_email_tracking.sql` çalıştır (Supabase SQL editor).

## 6. İçerik & Medya
- Eğitim videoları **Bunny.net** (kütüphane 475548) — canlıda oynaması için **referrer izin listesine `startupdoktoru.com` eklenmeli.** Tanıtımlar YouTube olabilir (`previewYouTube`).
- E-kitap **özel Supabase Storage bucket `ebooks`** → `/api/ebook` erişim kontrollü imzalı URL ile sunar (public DEĞİL).
- **Sosyal kanıt** `src/lib/socialproof.ts`: öğrenci memnuniyet videoları (YouTube unlisted) + VC/güvenilir-kaynak görselleri (`public/`). Diziler boşken bölüm gizli. Testimonials bölümü **değer merdiveninin önünde** (önce ikna).

### Admin bildirimleri (kayıt/satış)
- `notifyAdmin()` (`src/lib/email.ts`) → `ADMIN_NOTIFY_EMAIL` (varsayılan `esermemisoglu@gmail.com`).
- **Yeni kayıt**: `/api/welcome` içinde, kişi başına bir kez (`ds_leads.tags` içine `admin_notified` eklenerek dedup).
- **Yeni satış**: Stripe webhook `payment_intent.succeeded` → `isNewOrder` (ürün, tutar, müşteri, kupon).

### 6.1 Sosyal İstatistik Senkronu (Paylaşım sekmesi altı)
YouTube + Instagram video metrikleri **salt okunur**, tablo **`ds_sosyal_video`** (migration 0032). Cron `/api/cron/sosyal` her gün `0 4 * * *` (07:00 TR); panelde "Şimdi senkronla" = `POST /api/admin/sosyal`. Kod: `src/lib/youtube.ts`, `src/lib/instagram.ts`, `src/lib/sosyal.ts` (iki platform `allSettled` — biri düşerse diğeri yazılır).
- **YouTube:** Google Cloud projesi `startupdoktoru-sosyal-513020` (**Startupdoktoru Google hesabı**), OAuth uygulaması *In production* (doğrulamasız, ≤100 kullanıcı yeterli). Yetki: `node scripts/sosyal/youtube-yetki.mjs` → refresh token `.env.local`'a yazılır, Vercel'e elle kopyalanır. Kapsam `youtube.readonly` + `yt-analytics.readonly` + `youtube.upload` (senkron yalnız okur, yükleme §6.2). Tutma eğrisi (`audienceWatchRatio`) Shorts dahil gelir.
- **Instagram:** Meta uygulaması **"Startup Doktoru İstatistik"** (Arvasyon Yazılım portföyü, Unpublished/geliştirme modu yeterli), *Instagram API → Unified login* yapılandırması, **system-user anahtarı süresiz**. Host `graph.facebook.com/v23.0/{IG_USER_ID}`. İzinler: `instagram_basic`, `instagram_manage_insights`, `instagram_content_publish` (ileride otomatik paylaşım için) + Meta'nın zorunlu tuttuğu `instagram_manage_messages`. Saniye saniye tutma eğrisi **yok**; reels başına views/reach/saved/shares/ortalama izlenme süresi.
- **Eşleşme:** Paylaşım kartındaki Shorts/Instagram linkinden video kimliği çıkarılır → `paylasim_id`. Link girilmezse eşleşme 0 kalır.
- **Süre:** birleşik senkron ~25 sn (60 sn sınırı). Tuzaklar: YouTube tutma isteğinde `startDate=2005` → Google istek başına 10-35 sn bekletir (yayın günü kullan); Instagram içgörü istekleri 5'erli paralelde 60 sn'yi aşıyordu (15'erli).

### 6.2 Otomatik Paylaşım Kuyruğu (YouTube Shorts + Instagram Reels)
Her gün tek video, iki platforma, **19:00 TR**. Onay beklenmez; yayına 24 saatten fazla varken Paylaşım sekmesinden iptal edilir. LinkedIn elle.
- **Veri:** `ds_paylasim` (migration 0036): `yayin_at`, `yayin_bitti_at`, `iptal_at`, `video_yol`, `ai_icerik`, `yayin` (platform başına durum/hata/id). Saatin tek yeri: `paylasim_kuyruga_al` içindeki `saat` sabiti.
- **Giriş:** `scripts/video/teslim.mjs` dosyayı public Storage bucket'ı `paylasim-video`'ya yükler, `paylasim_kuyruga_al` en az 24 saat sonraki ilk boş günü verir (iptal hakkı kalsın diye). İptalde gün boşalır, sonrakiler kaymaz; ilk yeni video oraya girer.
- **Tetik:** pg_cron `paylasim-kuyrugu` 5 dakikada bir `paylasim_tetikle()`; yalnız vadesi gelen video varken `pg_net` ile `/api/cron/paylasim`'i çağırır (Vercel Hobby günde 1 ve ±59 dk). `CRON_SECRET` Vault'ta `paylasim_cron_secret` adıyla durur. `PAYLASIM_AKTIF=1` değilse uç hiçbir şey yapmaz.
- **Aşamalar (her tik platform başına bir adım):** YouTube: oturum aç + kaydet → gönder (süre dolarsa `Range`'den sürer) → sonraki tik `public` doğrula. Instagram: container aç → `IN_PROGRESS` bekle → yayınla.
- **Çift paylaşım yok:** kilit `paylasim_kilit_al` ile (180 sn); YouTube oturum adresi bayt gönderilmeden yazılır, tekrar denemede yenisi açılmaz; Instagram önce `status_code` sorar, `PUBLISHED` ise yayınlamaz. Elle işaretlenmiş platform `atlandi` olur.
- **Hata:** 5 denemede `hata` + anında mail; biri diğerini engellemez. `kilitli` = YouTube video private kaldı, kod yeniden yüklemez. YouTube oturumu düştüyse video yüklenmiş olabilir: kanala bak, sonra Yeniden dene. Başlamamış video planından 6 saat geç kaldıysa yayınlanmaz, kuyruktan çıkar (sistem kapalıyken birikenler art arda gitmesin). 24 saatten az kala acil durdurma: Vercel'den `PAYLASIM_AKTIF` kaldır + Redeploy.
- **Temizlik:** iki platform da bitince dosya Storage'dan silinir (yerel kopya Masaüstünde kalır).
- **Bekçi:** stok < 3 gün, hata ve 1 saatten fazla geciken yayın günlük özette uyarı olur.
- **Limitler:** Instagram 100 yayın/24 saat, 400 container/24 saat; YouTube `videos.insert` günde 100 çağrı, ayrı kota kovası. Test: `npm run test:paylasim`.

## 7. Bilinen Tuzaklar (tekrar yaşamamak için)
- **DNS Vercel'de.** İsimtescil DNS paneli yetkili değil; e-posta/DNS kaydı Vercel DNS'e.
- **Google consent'te `*.supabase.co`** kozmetik; tam marka için Supabase Custom Domain (ücretli).
- **Mobil drawer** header'ın DIŞINDA olmalı (header'daki `backdrop-blur` `fixed`'i bozar).
- **"Unable to exchange external code"** = Supabase'de Google Client Secret yanlış.
- **Stripe Link maili** (`notifications@link.com`) bizden değil — Stripe kayıtlı kart özelliği.
- **Direkt DB bağlantısı (`db.<ref>.supabase.co`) artık DNS'te yok** (Supabase kaldırdı). Lokal DB script'leri için **supabase-js REST** (service role) kullan ya da **pooler** host'u (`aws-0-<region>.pooler.supabase.com:6543`, user `postgres.<ref>`). Uygulama zaten REST kullandığı için canlı etkilenmez.

## 8. Yayın Sonrası Yapılacaklar / Opsiyoneller
- [ ] Bunny referrer'a `startupdoktoru.com` + `www` ekle (videolar).
- [ ] `CRON_SECRET` ekle (cron güvenliği) + istersen cron-job.org yedeği.
- [ ] Stripe live mode + production webhook doğrula.
- [ ] (İstenirse) Supabase Custom Domain (tam markalı auth).
