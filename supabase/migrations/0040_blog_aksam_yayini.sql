-- Blog yayını akşama taşındı (2026-11-13, Eser kararı): yayınlar gün sonu haberlerine göre.
--   18:30 TR (15:30 UTC) → /api/cron/haber-aksam: o günün haberlerini toplar, en iyi 3'ü yazar, taslak + 19:00 tarihi
--   19:00 TR (16:00 UTC) → blog_kuyrugu_yayinla(): tarihi gelen taslaklar yayına çıkar
-- Türkiye UTC+3 sabit (yaz saati yok), UTC saatleri kaymaz.

-- 1) Yayın kuyruğu 07:30 → 19:00 TR. Aynı adla schedule mevcut işi günceller.
SELECT cron.schedule('blog-yayin-kuyrugu', '0 16 * * *', 'SELECT public.blog_kuyrugu_yayinla()');

-- 2) Elle hazırlanan yazılar da kuyruktaki ilk boş AKŞAMA (19:00 TR = 16:00 UTC) yerleşir.
CREATE OR REPLACE FUNCTION public.blog_siradaki_yayin_tarihi()
RETURNS TIMESTAMP WITH TIME ZONE LANGUAGE sql STABLE SET search_path = public AS $$
  WITH bugun AS (
    SELECT (date_trunc('day', now() AT TIME ZONE 'UTC') + interval '16 hours') AT TIME ZONE 'UTC' AS saat
  ), ilk AS (
    SELECT CASE WHEN saat > now() THEN saat ELSE saat + interval '1 day' END AS saat FROM bugun
  )
  SELECT min(g)
    FROM ilk, generate_series(ilk.saat, ilk.saat + interval '365 days', interval '1 day') g
   WHERE NOT EXISTS (
     SELECT 1 FROM public.ds_blog_posts p WHERE p.durum = 'taslak' AND p.yayin_tarihi = g
   );
$$;

REVOKE EXECUTE ON FUNCTION public.blog_siradaki_yayin_tarihi() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.blog_siradaki_yayin_tarihi() TO service_role;

-- 3) Akşam haber hattını dakikasında tetikle. Vercel cron'u Hobby'de saati tutturmuyor,
--    GitHub Actions zamanlaması da 6-7 saat gecikiyor (ölçüldü 2026-11-09..12).
--    Anahtar: paylaşım ucuyla aynı Vault sırrı (repo public, sır SQL'e yazılmaz).
CREATE OR REPLACE FUNCTION public.haber_aksam_tetikle()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE anahtar text;
BEGIN
  SELECT decrypted_secret INTO anahtar FROM vault.decrypted_secrets WHERE name = 'paylasim_cron_secret';
  IF anahtar IS NULL THEN
    RAISE WARNING 'paylasim_cron_secret Vault''ta yok';
    RETURN;
  END IF;
  PERFORM net.http_get(
    url := 'https://startupdoktoru.com/api/cron/haber-aksam',
    headers := jsonb_build_object('Authorization', 'Bearer ' || anahtar),
    timeout_milliseconds := 65000
  );
END $$;

REVOKE EXECUTE ON FUNCTION public.haber_aksam_tetikle() FROM PUBLIC, anon, authenticated;
SELECT cron.schedule('haber-aksam', '30 15 * * *', 'SELECT public.haber_aksam_tetikle()');
