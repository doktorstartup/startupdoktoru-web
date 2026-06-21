-- ============================================================================
-- 0006 — Sade fiyatlandırma: e-kitap herkese $6
-- Karar: kupon kapısı kaldırıldı. E-kitap her durumda $6 tahsil edilir;
-- arayüzde sadece çapa olarak ~~$12~~ $6 gösterilir. Kupon devre dışı.
-- (0005'teki $12 + %50 kupon mantığını geri alır.)
-- ============================================================================

UPDATE public.ds_products SET price = 6.00 WHERE id = 'ebook_13_steps';

-- Karşılama kuponu devre dışı (checkout'tan kupon alanı kaldırıldı).
UPDATE public.ds_discount_codes SET active = false WHERE code = 'HOSGELDIN50';
