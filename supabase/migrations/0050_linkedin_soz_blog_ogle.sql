-- LinkedIn düzeni (Eser kararı, 2026-11-21):
-- 1) Söz hikâyesi görselleri LinkedIn'de de paylaşılır, kendi yazısıyla, sabah 08:30 TR (blog paylaşımının eski saati).
-- 2) Blog / yatırım haberi paylaşımı 08:30 → 12:00 TR (09:00 UTC).

-- linkedin_metin null ise o söz LinkedIn'e gitmez. linkedin_durum: null (bekliyor) / gonderiliyor / yayinda / hata / atlandi.
-- "gonderiliyor" istekten ÖNCE yazılır: cevap kaybolursa ikinci kez gönderilmez (profil elle kontrol edilir).
alter table public.ds_hikaye_kuyruk
  add column if not exists linkedin_metin text,
  add column if not exists linkedin_at timestamptz,
  add column if not exists linkedin_durum text check (linkedin_durum in ('gonderiliyor', 'yayinda', 'hata', 'atlandi')),
  add column if not exists linkedin_link text,
  add column if not exists linkedin_hata text;

-- Blog seçimi 0044'teki gibi; tek fark pencere 20 → 24 saat (12:00'de dünkü 16:00 sonrası yazılar da girsin).
create or replace function public.linkedin_blog_al()
returns setof public.ds_blog_posts language sql set search_path = public as $$
  update public.ds_blog_posts set linkedin_at = now()
   where id = (
     select id from public.ds_blog_posts
      where lang = 'tr' and durum = 'yayinda' and linkedin_at is null
        and created_at > now() - interval '24 hours'
        and not exists (select 1 from public.ds_blog_posts where linkedin_at > now() - interval '12 hours')
      order by created_at
      limit 1
      for update skip locked
   )
  returning *;
$$;

select cron.schedule('linkedin-blog', '0 9 * * *', 'select public.linkedin_blog_tetikle()');
