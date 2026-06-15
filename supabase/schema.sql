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

CREATE POLICY "Allow public read access to ds_users" ON public.ds_users
  FOR SELECT USING (true);

CREATE POLICY "Allow individuals to update their own ds_user profile" ON public.ds_users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow system insertions on ds_user creation" ON public.ds_users
  FOR INSERT WITH CHECK (true);

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
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  seo_title TEXT,
  seo_description TEXT,
  cover_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for ds_blog_posts
ALTER TABLE public.ds_blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to ds_blog posts" ON public.ds_blog_posts
  FOR SELECT USING (true);

CREATE POLICY "Allow admin to manage ds_blog posts" ON public.ds_blog_posts
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
  ('investor_training', 'Yatırımcı Sunumu Hazırlama Eğitimi', 'Yatırımcıların karşısına çıkmadan önce bilmeniz gereken tüm detaylar ve sunum hazırlama rehberi.', 49.00, 'USD', 'course')
ON CONFLICT (id) DO NOTHING;
