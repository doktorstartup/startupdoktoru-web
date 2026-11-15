-- LinkedIn: şirket etiketleme + günde bir blog yazısı paylaşımı (kişisel profil).

-- 1) Etiket listesi. Gönderi metninde `metinde` geçen ilk yer LinkedIn şirket etiketine çevrilir.
--    `ad` şirketin LinkedIn'deki adıyla BİREBİR aynı olmalı (büyük/küçük harf dahil); tutmazsa LinkedIn düz metin gösterir.
--    Sayfa numarası API'den aranamıyor (izin yok): satırlar elle eklenir.
create table if not exists public.ds_linkedin_etiket (
  metinde text primary key,
  ad text not null,
  urn text not null check (urn ~ '^urn:li:organization:[0-9]+$'),
  created_at timestamptz not null default now()
);
alter table public.ds_linkedin_etiket enable row level security;
revoke all on public.ds_linkedin_etiket from public, anon, authenticated;
grant select, insert, update, delete on public.ds_linkedin_etiket to service_role;

-- 2) Blog paylaşımı. linkedin_at paylaşımdan ÖNCE yazılır: aynı yazı iki kez gitmez.
alter table public.ds_blog_posts
  add column if not exists linkedin_at timestamptz,
  add column if not exists linkedin_link text;

-- Sıradaki yazıyı ayırır: son 20 saatte yayına çıkan Türkçe yazıların en erkeni (akşam hattında en yüksek puanlı
-- yazı en erken saate oturur). Son 12 saatte paylaşım yapıldıysa boş döner: günde en çok bir yazı.
create or replace function public.linkedin_blog_al()
returns setof public.ds_blog_posts language sql set search_path = public as $$
  update public.ds_blog_posts set linkedin_at = now()
   where id = (
     select id from public.ds_blog_posts
      where lang = 'tr' and durum = 'yayinda' and linkedin_at is null
        and created_at > now() - interval '20 hours'
        and not exists (select 1 from public.ds_blog_posts where linkedin_at > now() - interval '12 hours')
      order by created_at
      limit 1
      for update skip locked
   )
  returning *;
$$;

-- pg_cron'dan çağrılır (09:00 TR). Otomatik paylaşım kapalıysa ya da LinkedIn bağlı değilse siteyi çağırmaz.
create or replace function public.linkedin_blog_tetikle()
returns void language plpgsql security definer set search_path = public as $$
declare anahtar text;
begin
  if not exists (select 1 from public.ds_paylasim_ayar where aktif and linkedin_token is not null) then return; end if;
  select decrypted_secret into anahtar from vault.decrypted_secrets where name = 'paylasim_cron_secret';
  if anahtar is null then
    raise warning 'paylasim_cron_secret Vault''ta yok';
    return;
  end if;
  perform net.http_get(
    url := 'https://startupdoktoru.com/api/cron/linkedin-blog',
    headers := jsonb_build_object('Authorization', 'Bearer ' || anahtar),
    timeout_milliseconds := 65000
  );
end $$;

revoke execute on function public.linkedin_blog_al() from public, anon, authenticated;
revoke execute on function public.linkedin_blog_tetikle() from public, anon, authenticated;
grant execute on function public.linkedin_blog_al() to service_role;

select cron.schedule('linkedin-blog', '0 6 * * *', 'select public.linkedin_blog_tetikle()');
