-- ============================================================================
-- STARTUP DOKTORU - CONFLICT-FREE DATABASE SCHEMA
-- All tables are prefixed with 'ds_' to guarantee zero conflict with Satis Kolay
-- ============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DR. STARTUP USERS TABLE (Isolated custom profile)
CREATE TABLE IF NOT EXISTS public.ds_users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'visitor' CHECK (role IN ('visitor', 'lead', 'customer', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for ds_users
ALTER TABLE public.ds_users ENABLE ROW LEVEL SECURITY;

-- Yalnız kendi satırı okunur; yazma yalnız service-role (bkz. 0033_ds_users_rls.sql).
CREATE POLICY "Users read own ds_user row" ON public.ds_users
  FOR SELECT USING (auth.uid() = id);

-- 2. DR. STARTUP LEADS CRM TABLE
CREATE TABLE IF NOT EXISTS public.ds_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.ds_users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  startup_stage TEXT,
  source TEXT DEFAULT 'direct',
  status TEXT DEFAULT 'NEW' CHECK (status IN ('NEW', 'HOT', 'WARM', 'COLD', 'CUSTOMER', 'LOST')),
  score INT DEFAULT 0,
  stage TEXT DEFAULT 'NEW_LEAD' CHECK (stage IN ('NEW_LEAD', 'FREE_TRAINING', 'EBOOK_CUSTOMER', 'COURSE_CUSTOMER', 'WORKSHOP_CANDIDATE', 'CONSULTING_CANDIDATE')),
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for ds_leads
ALTER TABLE public.ds_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public to insert ds_leads" ON public.ds_leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated admins to read/write ds_leads" ON public.ds_leads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.ds_users 
      WHERE ds_users.id = auth.uid() AND ds_users.role = 'admin'
    )
  );

-- 3. DR. STARTUP PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.ds_products (
  id TEXT PRIMARY KEY, -- e.g., 'ebook_13_steps', 'investor_training'
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  type TEXT NOT NULL CHECK (type IN ('ebook', 'course', 'offline')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for ds_products
ALTER TABLE public.ds_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to ds_products" ON public.ds_products
  FOR SELECT USING (true);

CREATE POLICY "Allow admin to manage ds_products" ON public.ds_products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.ds_users 
      WHERE ds_users.id = auth.uid() AND ds_users.role = 'admin'
    )
  );

-- 4. DR. STARTUP ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.ds_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.ds_users(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES public.ds_products(id) ON DELETE CASCADE,
  email TEXT,
  customer_name TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled', 'refunded')),
  payment_method TEXT DEFAULT 'stripe' CHECK (payment_method IN ('stripe', 'iyzico', 'manual')),
  payment_ref TEXT UNIQUE, -- Stripe payment_intent id; webhook tekrarına karşı idempotency
  utm_source TEXT,   -- 0039: reklam atfı (webhook, PaymentIntent metadata'sından)
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for ds_orders
ALTER TABLE public.ds_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow individuals to read their own ds_orders" ON public.ds_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow admin to manage all ds_orders" ON public.ds_orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.ds_users 
      WHERE ds_users.id = auth.uid() AND ds_users.role = 'admin'
    )
  );

-- 5. DR. STARTUP COURSE PROGRESS TRACKING (LMS)
CREATE TABLE IF NOT EXISTS public.ds_course_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.ds_users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, lesson_id)
);

-- Enable RLS for ds_course_progress
ALTER TABLE public.ds_course_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to manage their own ds_progress" ON public.ds_course_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Allow admin to view ds_progress" ON public.ds_course_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ds_users 
      WHERE ds_users.id = auth.uid() AND ds_users.role = 'admin'
    )
  );

-- 6. DR. STARTUP BLOG POSTS TABLE
CREATE TABLE IF NOT EXISTS public.ds_blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT NOT NULL,
  seo_title TEXT,
  seo_description TEXT,
  cover_image TEXT,
  -- Yayın durumu. Yeni yazı taslak doğar; yayına alma admin panelinden yapılır.
  durum TEXT NOT NULL DEFAULT 'taslak' CHECK (durum IN ('taslak', 'yayinda')),
  -- Yazının dili. Aynı slug her dilde bir kez bulunabilir: /blog/x ve /en/blog/x.
  lang TEXT NOT NULL DEFAULT 'tr' CHECK (lang IN ('tr', 'en')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- Dolu taslak bu tarihten sonraki ilk 07:30 TR'de yayına çıkar (migration 0034, pg_cron).
  yayin_tarihi TIMESTAMP WITH TIME ZONE
);

CREATE UNIQUE INDEX IF NOT EXISTS ds_blog_posts_slug_lang_key ON public.ds_blog_posts (slug, lang);
CREATE INDEX IF NOT EXISTS ds_blog_posts_durum_idx ON public.ds_blog_posts (durum, created_at DESC);
CREATE INDEX IF NOT EXISTS ds_blog_posts_lang_durum_idx ON public.ds_blog_posts (lang, durum, created_at DESC);

-- Enable RLS for ds_blog_posts
ALTER TABLE public.ds_blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to ds_blog posts" ON public.ds_blog_posts
  FOR SELECT USING (durum = 'yayinda');

CREATE POLICY "Allow admin to manage ds_blog posts" ON public.ds_blog_posts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.ds_users 
      WHERE ds_users.id = auth.uid() AND ds_users.role = 'admin'
    )
  );

-- 7. DR. STARTUP EVENTS TABLE (Ziyaretçi / funnel olay takibi)
CREATE TABLE IF NOT EXISTS public.ds_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL CONSTRAINT ds_events_event_type_check CHECK (event_type IN (
    'page_view', 'lead', 'purchase', 'popup_view', 'popup_submit',
    'video_start', 'video_50', 'video_complete', 'checkout_open'
  )),
  session_id TEXT,
  path TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT, -- 0039: reklam kimliği ({{ad.id}})
  utm_term TEXT,    -- 0039: reklam seti ({{adset.id}})
  fbclid TEXT,      -- 0039: Meta tıklama kimliği
  email TEXT,
  product_id TEXT,
  amount NUMERIC,
  video_id TEXT, -- 0037: video olayları
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS ds_events_type_created_idx ON public.ds_events (event_type, created_at);
CREATE INDEX IF NOT EXISTS ds_events_session_idx ON public.ds_events (session_id);

ALTER TABLE public.ds_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public to insert ds_events" ON public.ds_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow admin to read ds_events" ON public.ds_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ds_users
      WHERE ds_users.id = auth.uid() AND ds_users.role = 'admin'
    )
  );

-- 8. DR. STARTUP DISCOUNT CODES TABLE (İndirim kodu altyapısı)
CREATE TABLE IF NOT EXISTS public.ds_discount_codes (
  code TEXT PRIMARY KEY,
  percent_off INT NOT NULL CHECK (percent_off > 0 AND percent_off <= 100),
  product_id TEXT REFERENCES public.ds_products(id) ON DELETE CASCADE, -- NULL = tüm ürünlerde geçerli
  active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  max_uses INT,
  used_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.ds_discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to ds_discount_codes" ON public.ds_discount_codes
  FOR SELECT USING (true);

CREATE POLICY "Allow admin to manage ds_discount_codes" ON public.ds_discount_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.ds_users
      WHERE ds_users.id = auth.uid() AND ds_users.role = 'admin'
    )
  );

-- ============================================================================
-- INITIAL SEED DATA
-- ============================================================================

INSERT INTO public.ds_products (id, title, description, price, currency, type)
VALUES 
  ('ebook_13_steps', '13 Adımda Milyon Dolarlık Startup E-Book', 'Milyon dolarlık iş kurmak isteyen girişimcilerin el kitabı.', 6.00, 'USD', 'ebook'),
  ('investor_training', 'Yatırımcı Sunumu Hazırlama Eğitimi', 'Yatırımcıların karşısına çıkmadan önce bilmeniz gereken tüm detaylar ve sunum hazırlama rehberi.', 70.00, 'USD', 'course'),
  ('startup_giris', 'Startup Giriş Rehberi', 'Bir startupta neler olmalı: doğru inovasyon, over-engineering, marka konumlandırma, MVP, ekip kurma, rakip analizi ve en sık yapılan hatalar.', 70.00, 'USD', 'course'),
  ('degerleme', 'Startup Değerleme & Yatırımcı Pazarlığı', 'Berkus yöntemi, puan kartı yöntemi, risk faktörleri, DCF (indirgenmiş nakit akışı) ve yatırımcılarla pazarlık.', 70.00, 'USD', 'course'),
  ('all_access_bundle', 'Tüm Eğitimler Paketi', '3 eğitimin tamamına tek seferde, en avantajlı fiyatla erişim.', 99.00, 'USD', 'course')
ON CONFLICT (id) DO NOTHING;

-- İndirim kodları:
--  HOSGELDIN50: pasif (e-kitap herkese $6, sade çapa fiyatlandırma).
--  EBOOK50: e-kitap alana eğitimlerde %50 (thank-you akışında otomatik uygulanır → $35).
INSERT INTO public.ds_discount_codes (code, percent_off, product_id, active)
VALUES
  ('HOSGELDIN50', 50, NULL, false),
  ('EBOOK50', 50, NULL, true)
ON CONFLICT (code) DO NOTHING;

-- 12. İNGİLİZCE BASKI İLGİ LİSTESİ
-- Kitap Türkçe; /en tarafında satış yerine talep ölçülüyor. Baskı çıkarsa
-- haber vermek için ayrı liste (ds_leads'in kaynak atfını bozmamak için ayrı).
CREATE TABLE IF NOT EXISTS public.ds_ebook_en_interest (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS ds_ebook_en_interest_created_idx ON public.ds_ebook_en_interest (created_at DESC);

-- Politika yok: listeye yalnız service-role erişir.
ALTER TABLE public.ds_ebook_en_interest ENABLE ROW LEVEL SECURITY;

-- 13. LLM SAĞLAYICI SAĞLIĞI
-- Zincir (gemini → kimi → openai) hangi sağlayıcıda takıldı, kota bitti mi.
-- Bekçi buradan okuyup uyarır; kota bitince anlık mail gider.
CREATE TABLE IF NOT EXISTS public.ds_llm_saglik (
  saglayici TEXT PRIMARY KEY,
  son_basari TIMESTAMP WITH TIME ZONE,
  son_hata TEXT,
  son_hata_kod INTEGER,
  son_hata_at TIMESTAMP WITH TIME ZONE,
  kota_bitti BOOLEAN NOT NULL DEFAULT false,
  son_bildirim TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.ds_llm_saglik ENABLE ROW LEVEL SECURITY;

-- Kitap yorumları (okuyucu portalı) — bkz. migrations/0027_kitap_yorumlari.sql
create table if not exists public.ds_kitap_yorumlari (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  ad text,
  meslek text,
  puan smallint not null check (puan between 1 and 5),
  yorum text not null,
  yayin_izni boolean not null default false,
  durum text not null default 'bekliyor' check (durum in ('bekliyor', 'onayli', 'reddedildi')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Yalnız service-role erişir (API üzerinden); istemciye politika yok.
alter table public.ds_kitap_yorumlari enable row level security;

-- Paylaşım takibi (kısa videolar) — bkz. migrations/0031_paylasim.sql
create table if not exists public.ds_paylasim (
  id uuid default gen_random_uuid() primary key,
  baslik text not null,
  durum text not null default 'fikir'
    check (durum in ('fikir', 'senaryo', 'cekildi', 'kurguda', 'hazir', 'paylasildi')),
  notlar text,
  efektler text[] not null default '{}',
  ham_link text,
  kurgu_link text,
  hedef_tarih date,
  platformlar jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Otomatik paylaşım kuyruğu; fonksiyonlar, bucket ve pg_cron işi: migrations/0036_paylasim_kuyrugu.sql
  yayin_at timestamptz,
  yayin_bitti_at timestamptz,
  iptal_at timestamptz,
  video_yol text,
  ai_icerik boolean not null default false,
  yayin jsonb not null default '{}'::jsonb
);
-- Yalnız service-role erişir (API üzerinden); istemciye politika yok.
alter table public.ds_paylasim enable row level security;
create unique index if not exists ds_paylasim_yayin_gunu_uq
  on public.ds_paylasim (((yayin_at at time zone 'Europe/Istanbul')::date)) where yayin_at is not null;

-- Otomatik paylaşım aç/kapa (tek satır, varsayılan kapalı) — bkz. migrations/0038_paylasim_ayar.sql
create table if not exists public.ds_paylasim_ayar (
  id boolean primary key default true check (id),
  aktif boolean not null default false,
  updated_at timestamptz not null default now()
);
-- Yalnız service-role erişir (API üzerinden); istemciye politika yok.
alter table public.ds_paylasim_ayar enable row level security;
revoke all on public.ds_paylasim_ayar from public, anon, authenticated;
insert into public.ds_paylasim_ayar (id) values (true) on conflict (id) do nothing;

-- Sosyal istatistik (salt okuma, günlük senkron) — bkz. migrations/0032_sosyal_istatistik.sql
create table if not exists public.ds_sosyal_video (
  id uuid default gen_random_uuid() primary key,
  platform text not null check (platform in ('youtube', 'instagram')),
  video_id text not null,
  paylasim_id uuid references public.ds_paylasim(id) on delete set null,
  baslik text,
  yayin_at timestamptz,
  sure_sn int,
  metrikler jsonb not null default '{}'::jsonb,
  tutma jsonb,
  guncellendi_at timestamptz not null default now(),
  unique (platform, video_id)
);
-- Yalnız service-role erişir (API üzerinden); istemciye politika yok.
alter table public.ds_sosyal_video enable row level security;

-- Meta reklam harcaması (günlük senkron, reklam × gün) — bkz. migrations/0039_reklam_atif.sql
CREATE TABLE IF NOT EXISTS public.ds_reklam_gunluk (
  tarih DATE NOT NULL,
  ad_id TEXT NOT NULL,
  ad_ad TEXT,
  adset_id TEXT,
  adset_ad TEXT,
  kampanya_id TEXT,
  kampanya_ad TEXT,
  harcama NUMERIC NOT NULL DEFAULT 0,
  para_birimi TEXT,
  gosterim INT NOT NULL DEFAULT 0,
  erisim INT NOT NULL DEFAULT 0,
  siklik NUMERIC,
  link_tiklama INT NOT NULL DEFAULT 0,
  video_3sn INT NOT NULL DEFAULT 0,   -- hook oranı = video_3sn / gosterim
  thruplay INT NOT NULL DEFAULT 0,
  meta_lead INT NOT NULL DEFAULT 0,   -- Meta'nın kendi saydığı (Pixel/CAPI yokken 0 kalır)
  meta_satis INT NOT NULL DEFAULT 0,
  ham JSONB,
  guncellendi_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tarih, ad_id)
);
CREATE INDEX IF NOT EXISTS ds_reklam_gunluk_ad_idx ON public.ds_reklam_gunluk (ad_id);

-- Yalnız sunucu (service role) okur/yazar
ALTER TABLE public.ds_reklam_gunluk ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ds_reklam_gunluk FROM public, anon, authenticated;
