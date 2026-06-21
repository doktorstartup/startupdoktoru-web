-- ============================================================================
-- 0005 — E-kitap liste fiyatı $12 + %50 hoş geldin kuponu (HOSGELDIN50)
-- İş kuralı: e-kitap liste fiyatı $12'dir; %50 kupon (e-posta funnel'ından)
-- girilince $6'ya iner. Kuponsuz tahsilat $12. (0002'deki $6 fiyatını günceller.)
-- ============================================================================

UPDATE public.ds_products SET price = 12.00 WHERE id = 'ebook_13_steps';

-- Eski %10 karşılama kodunu kaldır, %50 kuponu ekle.
DELETE FROM public.ds_discount_codes WHERE code = 'HOSGELDIN10';

INSERT INTO public.ds_discount_codes (code, percent_off, product_id, active)
VALUES ('HOSGELDIN50', 50, NULL, true)
ON CONFLICT (code) DO UPDATE SET percent_off = 50, active = true;
