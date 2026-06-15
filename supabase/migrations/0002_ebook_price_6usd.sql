-- E-kitap fiyatını $6'ya güncelle (kampanya: normal $12, %50 indirim → $6).
-- Tahsil edilen tutarın gerçek kaynağı ds_products.price'tır (checkout API buradan okur).
UPDATE public.ds_products SET price = 6.00 WHERE id = 'ebook_13_steps';
