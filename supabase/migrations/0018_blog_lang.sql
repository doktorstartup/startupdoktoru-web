-- Blog yazılarına dil: tr / en.
--
-- Site iki dilli oldu. /blog Türkçe, /en/blog İngilizce yazıları listeler.
-- Sütun eklenmeden önceki yazıların hepsi Türkçe yazıldı, 'tr' varsayılanı doğru.
--
-- slug artık dil başına benzersiz: bir yazının Türkçesi ve İngilizcesi aynı
-- adresi paylaşır (/blog/x ve /en/blog/x), böylece dil değiştirici yazının
-- karşılığına doğrudan gidebilir.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ds_blog_posts' AND column_name = 'lang'
  ) THEN
    ALTER TABLE public.ds_blog_posts ADD COLUMN lang TEXT NOT NULL DEFAULT 'tr';
    ALTER TABLE public.ds_blog_posts ADD CONSTRAINT ds_blog_posts_lang_check
      CHECK (lang IN ('tr', 'en'));
  END IF;
END $$;

ALTER TABLE public.ds_blog_posts DROP CONSTRAINT IF EXISTS ds_blog_posts_slug_key;
CREATE UNIQUE INDEX IF NOT EXISTS ds_blog_posts_slug_lang_key
  ON public.ds_blog_posts (slug, lang);

CREATE INDEX IF NOT EXISTS ds_blog_posts_lang_durum_idx
  ON public.ds_blog_posts (lang, durum, created_at DESC);
