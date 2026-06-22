-- Davranış-tabanlı drip e-posta kampanya motoru.
-- Kampanya: tetikleyici + adımlar. Adım: gecikme (dk) + konu + içerik.
-- Kayıt (enrollment): tetik gerçekleşince kişi kampanyaya bir kez kaydolur.

CREATE TABLE IF NOT EXISTS public.ds_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('lead', 'abandoned', 'interest')),
  trigger_value TEXT,            -- interest için eğitim/ürün id'si (ör. investor_training)
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ds_campaign_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.ds_campaigns(id) ON DELETE CASCADE,
  step_order INT NOT NULL DEFAULT 1,
  delay_minutes INT NOT NULL DEFAULT 0,   -- kayıttan itibaren toplam gecikme (dakika)
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ds_campaign_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.ds_campaigns(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  sent_steps INT DEFAULT 0,
  done BOOLEAN DEFAULT false,
  UNIQUE (campaign_id, email)
);

ALTER TABLE public.ds_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ds_campaign_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ds_campaign_enrollments ENABLE ROW LEVEL SECURITY;
-- Politika yok: yalnızca service-role (admin/API).

CREATE INDEX IF NOT EXISTS idx_campaign_steps_campaign ON public.ds_campaign_steps(campaign_id, step_order);
CREATE INDEX IF NOT EXISTS idx_enrollments_pending ON public.ds_campaign_enrollments(done) WHERE done = false;
