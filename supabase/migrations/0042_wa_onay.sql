-- WhatsApp ileti onayı (2026-11-14): hoş geldin ve sepet hatırlatma şablonları yalnız
-- wa_onay = true olan kişilere gider. Onay formdaki kutuyla verilir; kod onayı yalnız
-- açar, hiçbir yerde kendiliğinden kapatmaz (geri çekme ayrı işlemdir).
ALTER TABLE public.ds_leads
  ADD COLUMN IF NOT EXISTS wa_onay BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS wa_onay_at TIMESTAMP WITH TIME ZONE;
