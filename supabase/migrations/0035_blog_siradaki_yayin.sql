-- Hattın yeni taslağı için kuyruktaki ilk boş sabah (07:30 TR = 04:30 UTC).
CREATE OR REPLACE FUNCTION public.blog_siradaki_yayin_tarihi()
RETURNS TIMESTAMP WITH TIME ZONE LANGUAGE sql STABLE SET search_path = public AS $$
  WITH bugun AS (
    SELECT (date_trunc('day', now() AT TIME ZONE 'UTC') + interval '4 hours 30 minutes') AT TIME ZONE 'UTC' AS saat
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
