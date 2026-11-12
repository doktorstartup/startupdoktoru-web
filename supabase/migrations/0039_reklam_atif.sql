-- 0039 — Reklam atfı + Meta reklam harcaması (reklam yönetimi 1. aşama: ölçüm)
-- Reklam bağlantıları: utm_source=meta&utm_medium=paid&utm_campaign={{campaign.id}}&utm_term={{adset.id}}&utm_content={{ad.id}}
-- utm_content = Meta reklam kimliği → harcama (ds_reklam_gunluk.ad_id) ile site sonucu birleşir.

-- Olaylar: reklam/kreatif düzeyi + Meta tıklama kimliği (ileride Conversions API için)
ALTER TABLE public.ds_events ADD COLUMN IF NOT EXISTS utm_content TEXT;
ALTER TABLE public.ds_events ADD COLUMN IF NOT EXISTS utm_term TEXT;
ALTER TABLE public.ds_events ADD COLUMN IF NOT EXISTS fbclid TEXT;
CREATE INDEX IF NOT EXISTS ds_events_utm_content_idx ON public.ds_events (utm_content) WHERE utm_content IS NOT NULL;

-- Siparişler: kaynak artık sunucuda (Stripe webhook) yazılır, teşekkür sayfasına bağlı değil
ALTER TABLE public.ds_orders ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE public.ds_orders ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE public.ds_orders ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE public.ds_orders ADD COLUMN IF NOT EXISTS utm_content TEXT;
ALTER TABLE public.ds_orders ADD COLUMN IF NOT EXISTS utm_term TEXT;

-- 12 aylık kimliksizleştirme fbclid'i de silsin (kişiye bağlanabilir tıklama kimliği)
CREATE OR REPLACE FUNCTION public.ds_events_kimliksizlestir()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE adet integer;
BEGIN
  UPDATE public.ds_events
     SET session_id = NULL, email = NULL, referrer = NULL, fbclid = NULL
   WHERE created_at < now() - interval '12 months'
     AND (session_id IS NOT NULL OR email IS NOT NULL OR referrer IS NOT NULL OR fbclid IS NOT NULL);
  GET DIAGNOSTICS adet = ROW_COUNT;
  RETURN adet;
END $$;
REVOKE EXECUTE ON FUNCTION public.ds_events_kimliksizlestir() FROM PUBLIC, anon, authenticated;

-- Meta reklam harcaması: reklam × gün. Günlük senkron son 7 günü yeniden yazar (Meta geriye dönük düzeltir).
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
