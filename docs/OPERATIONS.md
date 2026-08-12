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
| `CRON_SECRET` (opsiyonel) | Cron endpoint'ini korur |
| `ADMIN_NOTIFY_EMAIL` (opsiyonel) | Kayıt/satış bildirimleri buraya (varsayılan `esermemisoglu@gmail.com`) |
| `NEXT_PUBLIC_SITE_URL` | `https://startupdoktoru.com` |

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
- **weekly** kampanyalar (13 Haftalık Seri): her **Pazar (TR)** bir adım; `last_sent_at` çift-gönderim korur.
- Kişi **CUSTOMER** olursa seri durur (spam yok). Kampanyalar bağımsız → bir kişi aynı hafta birden çok kampanyadan mail alabilir.
- **Cron** `/api/cron/followup`: her gün `processDue`; TR'de Pazar ise `processWeekly`. `vercel.json` cron `0 7 * * *` (07:00 UTC = 10:00 TR). Daha kararlı/sık tetik için cron-job.org yedek.
- Aktif kampanyalar: Karşılama · Sepeti Bırakanlar · Genel Takip · Yatırımcı İlgi Serisi · 13 Haftalık Startup Serisi · Topluluk Daveti (WhatsApp: chat.whatsapp.com/F9E2QPGYU2S5IMVOmfSlGb).

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
