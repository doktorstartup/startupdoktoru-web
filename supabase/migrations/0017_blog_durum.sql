-- Blog yazılarına yayın durumu: taslak / yayinda.
--
-- Haber ve fikir hatları (scripts/haber/yayinla.mjs, yazi.mjs) yazıyı TASLAK
-- olarak basar; yayına alma kararı admin panelinden verilir. Sütun eklenmeden
-- önce var olan yazılar zaten canlıydı, onlar 'yayinda' olarak işaretlenir.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ds_blog_posts' AND column_name = 'durum'
  ) THEN
    ALTER TABLE public.ds_blog_posts ADD COLUMN durum TEXT NOT NULL DEFAULT 'taslak';
    ALTER TABLE public.ds_blog_posts ADD CONSTRAINT ds_blog_posts_durum_check
      CHECK (durum IN ('taslak', 'yayinda'));
    UPDATE public.ds_blog_posts SET durum = 'yayinda';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ds_blog_posts_durum_idx
  ON public.ds_blog_posts (durum, created_at DESC);

-- Anon anahtar herkese açık (NEXT_PUBLIC_*). Uygulama blog'u service-role ile
-- okuyor ama doğrudan sorguyla taslak sızmasın diye politika daraltılıyor.
DROP POLICY IF EXISTS "Allow public read access to ds_blog posts" ON public.ds_blog_posts;
CREATE POLICY "Allow public read access to ds_blog posts" ON public.ds_blog_posts
  FOR SELECT USING (durum = 'yayinda');
