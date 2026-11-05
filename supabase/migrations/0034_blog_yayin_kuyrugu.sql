-- Blog yayın kuyruğu: yayin_tarihi dolu taslaklar her sabah 07:30 TR'de yayına çıkar.
-- Vercel cron'u değil pg_cron: Vercel saati dakikasında tutturmuyor (07:00 TR işi 07:46'da çalıştı).
ALTER TABLE public.ds_blog_posts ADD COLUMN IF NOT EXISTS yayin_tarihi TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS ds_blog_posts_yayin_kuyrugu_idx
  ON public.ds_blog_posts (yayin_tarihi) WHERE durum = 'taslak' AND yayin_tarihi IS NOT NULL;

CREATE OR REPLACE FUNCTION public.blog_kuyrugu_yayinla()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE adet integer;
BEGIN
  -- created_at yayın tarihi olarak gösteriliyor; yazı listenin başına geçsin diye güncellenir.
  UPDATE public.ds_blog_posts
     SET durum = 'yayinda', created_at = now(), yayin_tarihi = NULL
   WHERE durum = 'taslak' AND yayin_tarihi <= now();
  GET DIAGNOSTICS adet = ROW_COUNT;
  RETURN adet;
END $$;

-- public şemadaki fonksiyonlar RPC ile açık olur; dışarıdan çağrılamasın.
REVOKE EXECUTE ON FUNCTION public.blog_kuyrugu_yayinla() FROM PUBLIC, anon, authenticated;

CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('blog-yayin-kuyrugu', '30 4 * * *', 'SELECT public.blog_kuyrugu_yayinla()');
