-- Onaylı davranış takibi: video ve ödeme formu olayları + 12 ay saklama.
-- Kişiye bağlı kayıt (session_id/email) yalnız çerez onayıyla gelir (src/lib/consent.ts).

ALTER TABLE public.ds_events DROP CONSTRAINT IF EXISTS ds_events_event_type_check;
ALTER TABLE public.ds_events ADD CONSTRAINT ds_events_event_type_check CHECK (event_type IN (
  'page_view', 'lead', 'purchase', 'popup_view', 'popup_submit',
  'video_start', 'video_50', 'video_complete', 'checkout_open'
));

ALTER TABLE public.ds_events ADD COLUMN IF NOT EXISTS video_id TEXT;

CREATE INDEX IF NOT EXISTS ds_events_email_idx ON public.ds_events (email) WHERE email IS NOT NULL;

-- Saklama: 12 aydan eski olaylar kimliksizleştirilir (sayımlar kalır, kişi bağı gider).
-- Süre gizlilik ve KVKK metninde yazılı; değişirse metni de güncelle.
CREATE OR REPLACE FUNCTION public.ds_events_kimliksizlestir()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE adet integer;
BEGIN
  UPDATE public.ds_events
     SET session_id = NULL, email = NULL, referrer = NULL
   WHERE created_at < now() - interval '12 months'
     AND (session_id IS NOT NULL OR email IS NOT NULL OR referrer IS NOT NULL);
  GET DIAGNOSTICS adet = ROW_COUNT;
  RETURN adet;
END $$;

REVOKE EXECUTE ON FUNCTION public.ds_events_kimliksizlestir() FROM PUBLIC, anon, authenticated;

CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('ds-events-kimliksizlestir', '15 3 1 * *', 'SELECT public.ds_events_kimliksizlestir()');
