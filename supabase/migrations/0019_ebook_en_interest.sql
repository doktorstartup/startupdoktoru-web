-- İngilizce baskı ilgi listesi.
--
-- Kitap Türkçe. /en tarafında Türkçe bir PDF satmak yerine önce TALEBİ ÖLÇÜYORUZ:
-- ziyaretçi e-postasını bırakır, baskı çıkarsa haber veririz. Yeterli talep
-- görülürse kitap düzgün çevrilir (makine taslağı + anadili İngilizce editör).
--
-- Neden ds_leads değil: mevcut bir lead'in source'unu ezmek kaynak atfını bozar,
-- eklemek de çift kayıt üretir. Ayrı liste hem sayımı temiz tutar hem de baskı
-- çıkınca "tam olarak bu kişilere" mail atmayı kolaylaştırır.

CREATE TABLE IF NOT EXISTS public.ds_ebook_en_interest (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS ds_ebook_en_interest_created_idx
  ON public.ds_ebook_en_interest (created_at DESC);

-- RLS açık ve hiç politika yok: listeye yalnız service-role (sunucu) erişir,
-- anon anahtarla ne okunur ne yazılır. E-posta listesi herkese açık olmamalı.
ALTER TABLE public.ds_ebook_en_interest ENABLE ROW LEVEL SECURITY;
