-- Instagram hikâyesi (Eser kararı, 2026-11-21):
-- 1) Reels yayından 48 saat sonra aynı video hikâye olarak paylaşılır (ilk 48 saat Reels izlenmesi/hook takibi için).
--    Video dosyası hikâye çıkana kadar Storage'da tutulur; hikâye çıkınca silinir.
-- 2) Hikâyelerin istatistiği 24 saat dolmadan kaydedilir (Instagram süresi biten hikâyeyi API'den vermez).

-- hikaye: {"durum": "isleniyor"|"yayinda"|"hata", "container", "container_at", "id", "hata", "deneme"}; null = henüz başlamadı
alter table public.ds_paylasim add column if not exists hikaye jsonb;

-- Hesaptaki her hikâye (elle atılanlar dahil). Rakamlar her okumada güncellenir; son okuma 24 saat dolmadan yapılır.
create table if not exists public.ds_ig_hikaye (
  id text primary key,                 -- Instagram medya id'si
  yayin_at timestamptz not null,
  tur text,                            -- IMAGE / VIDEO
  link text,
  paylasim_id uuid references public.ds_paylasim(id) on delete set null, -- Reels'ten otomatik çıktıysa
  goruntuleme int,
  erisim int,
  yanit int,
  paylasim int,
  etkilesim int,
  takip int,
  profil_ziyaret int,
  ileri int,                           -- tap_forward: sonraki hikâyeye geçti
  geri int,                            -- tap_back: tekrar baktı
  cikis int,                           -- tap_exit: hikâyeleri kapattı
  sonraki_hesap int,                   -- swipe_forward: başka hesaba geçti
  ham jsonb,                           -- son okunan cevap / hata
  son_okuma timestamptz not null default now()
);
alter table public.ds_ig_hikaye enable row level security;
revoke all on public.ds_ig_hikaye from public, anon, authenticated;
grant select, insert, update, delete on public.ds_ig_hikaye to service_role;

-- 15 dakikada bir: hikâye istatistiği + vadesi gelen Reels hikâyesi. Yayın kısmı Paylaşım düğmesi kapalıysa çalışmaz (uç kontrol eder).
create or replace function public.hikaye_tetikle()
returns void language plpgsql security definer set search_path = public as $$
declare anahtar text;
begin
  select decrypted_secret into anahtar from vault.decrypted_secrets where name = 'paylasim_cron_secret';
  if anahtar is null then
    raise warning 'paylasim_cron_secret Vault''ta yok';
    return;
  end if;
  perform net.http_get(
    url := 'https://startupdoktoru.com/api/cron/hikaye',
    headers := jsonb_build_object('Authorization', 'Bearer ' || anahtar),
    timeout_milliseconds := 65000
  );
end $$;
revoke execute on function public.hikaye_tetikle() from public, anon, authenticated;

select cron.unschedule('instagram-hikaye') where exists (select 1 from cron.job where jobname = 'instagram-hikaye');
select cron.schedule('instagram-hikaye', '*/15 * * * *', 'select public.hikaye_tetikle()');
