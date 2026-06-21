-- ============================================================================
-- 0007 — Eğitim ürünleri ve fiyatlandırma
-- Model: her eğitim $70; e-kitap alana %50 (EBOOK50 kuponu) → $35;
-- 3 eğitim paketi $99 (all_access_bundle). E-kitap $6 girişte kalır.
-- ============================================================================

-- Yatırımcı sunumu eğitimi $49 → $70
UPDATE public.ds_products SET price = 70.00 WHERE id = 'investor_training';

-- Yeni eğitimler + paket
INSERT INTO public.ds_products (id, title, description, price, currency, type)
VALUES
  ('startup_giris', 'Startup Giriş Rehberi', 'Bir startupta neler olmalı: doğru inovasyon, over-engineering, marka konumlandırma, MVP, ekip kurma, rakip analizi ve en sık yapılan hatalar.', 70.00, 'USD', 'course'),
  ('degerleme', 'Startup Değerleme & Yatırımcı Pazarlığı', 'Berkus yöntemi, puan kartı yöntemi, risk faktörleri, DCF (indirgenmiş nakit akışı) ve yatırımcılarla pazarlık.', 70.00, 'USD', 'course'),
  ('all_access_bundle', 'Tüm Eğitimler Paketi', '3 eğitimin tamamına tek seferde, en avantajlı fiyatla erişim.', 99.00, 'USD', 'course')
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, title = EXCLUDED.title, description = EXCLUDED.description;

-- E-kitap alana eğitimlerde %50 indirim kuponu (thank-you akışında otomatik uygulanır)
INSERT INTO public.ds_discount_codes (code, percent_off, product_id, active)
VALUES ('EBOOK50', 50, NULL, true)
ON CONFLICT (code) DO UPDATE SET percent_off = 50, active = true;
