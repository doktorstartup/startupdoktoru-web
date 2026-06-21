-- ============================================================================
-- 0003 — DS_EVENTS: Ziyaretçi / funnel olay takibi
-- Funnel: page_view (ds_events) → lead (ds_leads) → purchase (ds_orders)
-- Ziyaretçi/sayfa görüntüleme katmanını ekler; lead ve satış zaten kendi
-- tablolarında. purchase/lead olayları funnel'ı tek tabloda da görmek için.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ds_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'lead', 'purchase', 'popup_view', 'popup_submit')),
  session_id TEXT,
  path TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  email TEXT,
  product_id TEXT,
  amount NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS ds_events_type_created_idx ON public.ds_events (event_type, created_at);
CREATE INDEX IF NOT EXISTS ds_events_session_idx ON public.ds_events (session_id);

-- RLS: herkes olay ekleyebilir (anon tracking), sadece admin okur — ds_leads deseniyle aynı.
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
