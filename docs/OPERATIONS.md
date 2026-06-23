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
| `SUPABASE_DB_URL` | Migration'ları `pg` ile doğrudan uygulamak için (sadece lokal) |
| `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` / `STRIPE_WEBHOOK_SECRET` | Ödeme |
| `OPENAI_API_KEY` | AI Mentor |
| `ADMIN_PASSWORD` | Tüm `/admin` ve admin API'leri korur (sunucu doğrular) |
| `RESEND_API_KEY` / `RESEND_FROM` / `RESEND_REPLY_TO` | E-posta. From: `eser@startupdoktoru.com`, Reply-To: `doktorstartup@gmail.com` |
| `CRON_SECRET` (opsiyonel) | Cron endpoint'ini korur |
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

## 6. İçerik & Medya
- Eğitim videoları **Bunny.net** (kütüphane 475548) — canlıda oynaması için **referrer izin listesine `startupdoktoru.com` eklenmeli.** Tanıtımlar YouTube olabilir (`previewYouTube`).
- E-kitap **özel Supabase Storage bucket `ebooks`** → `/api/ebook` erişim kontrollü imzalı URL ile sunar (public DEĞİL).

## 7. Bilinen Tuzaklar (tekrar yaşamamak için)
- **DNS Vercel'de.** İsimtescil DNS paneli yetkili değil; e-posta/DNS kaydı Vercel DNS'e.
- **Google consent'te `*.supabase.co`** kozmetik; tam marka için Supabase Custom Domain (ücretli).
- **Mobil drawer** header'ın DIŞINDA olmalı (header'daki `backdrop-blur` `fixed`'i bozar).
- **"Unable to exchange external code"** = Supabase'de Google Client Secret yanlış.
- **Stripe Link maili** (`notifications@link.com`) bizden değil — Stripe kayıtlı kart özelliği.

## 8. Yayın Sonrası Yapılacaklar / Opsiyoneller
- [ ] Bunny referrer'a `startupdoktoru.com` + `www` ekle (videolar).
- [ ] `CRON_SECRET` ekle (cron güvenliği) + istersen cron-job.org yedeği.
- [ ] Stripe live mode + production webhook doğrula.
- [ ] (İstenirse) Supabase Custom Domain (tam markalı auth).
