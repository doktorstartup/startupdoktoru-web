-- Akşam yazıları aynı anda değil 30 dakika arayla çıksın (2026-11-13, Eser kararı):
-- akşam hattı her yazıya ayrı saat verir (19:00, 19:30, 20:00 TR). Yayınlayıcı yarım saatte
-- bir çalışır; yalnız tarihi gelmiş taslakları çıkarır, iş yoksa tek bir boş UPDATE'tir.
SELECT cron.schedule('blog-yayin-kuyrugu', '0,30 * * * *', 'SELECT public.blog_kuyrugu_yayinla()');
