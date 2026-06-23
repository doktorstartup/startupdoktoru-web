-- Kampanyalara 'cadence' (gönderim ritmi): 'delay' (gecikmeli, varsayılan) | 'weekly' (her Pazar bir adım).
ALTER TABLE public.ds_campaigns ADD COLUMN IF NOT EXISTS cadence TEXT NOT NULL DEFAULT 'delay';
-- Haftalık seride aynı hafta çift gönderimi engellemek için son gönderim zamanı.
ALTER TABLE public.ds_campaign_enrollments ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMP WITH TIME ZONE;
-- 13 haftalık seriyi haftalık (Pazar) moda al.
UPDATE public.ds_campaigns SET cadence='weekly' WHERE name='13 Haftalık Startup Serisi';
