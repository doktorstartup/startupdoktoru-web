-- ============================================================================
-- 0004 — DS_DISCOUNT_CODES: İndirim kodu altyapısı
-- E-posta yakalama pop-up'ı ile dağıtılan kodlar; checkout'ta sunucu tarafında
-- doğrulanır ve fiyatı düşürür. Client'tan gelen tutara asla güvenilmez.
-- ============================================================================

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

-- Public SELECT: checkout doğrulaması zaten sunucuda service-role ile yapılıyor;
-- yine de istemci ön doğrulaması yapabilsin diye okuma açık.
CREATE POLICY "Allow public read access to ds_discount_codes" ON public.ds_discount_codes
  FOR SELECT USING (true);

CREATE POLICY "Allow admin to manage ds_discount_codes" ON public.ds_discount_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.ds_users
      WHERE ds_users.id = auth.uid() AND ds_users.role = 'admin'
    )
  );

-- Karşılama kodu: e-posta yakalama pop-up'ı bunu verir (%10).
INSERT INTO public.ds_discount_codes (code, percent_off, product_id, active)
VALUES ('HOSGELDIN10', 10, NULL, true)
ON CONFLICT (code) DO NOTHING;
