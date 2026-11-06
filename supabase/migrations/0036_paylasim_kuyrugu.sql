-- Otomatik paylaşım kuyruğu: hazır videolar her gün tek video olarak YouTube Shorts + Instagram Reels'e gider.
-- Vercel cron'u değil pg_cron: Hobby planı günde bir ve ±59 dk; Instagram işleme beklemesi için 5 dk'lık tik gerek.
--
-- yayin_at       planlanan an; null = kuyrukta değil. Saat tek yerde: paylasim_kuyruga_al içindeki sabit.
-- yayin_bitti_at tüm platformlar son durumda; tik bu satıra bir daha dokunmaz.
-- video_yol      paylasim-video bucket'ındaki yol (<id>/video.mp4, kapak yanında kapak.jpg).
-- yayin          {"shorts": {...}, "instagram": {...}} platform başına durum, hata, yayın id'si.
--                durum: bekliyor → isleniyor → yayinda | hata | kilitli | atlandi
-- Çift paylaşım koruması kodda değil veride: kilit tek UPDATE ile alınır; YouTube oturumu ve Instagram
-- container'ı yayından önce yazılır, tekrar denemede yenisi açılmaz.
alter table public.ds_paylasim
  add column if not exists yayin_at timestamptz,
  add column if not exists yayin_bitti_at timestamptz,
  add column if not exists iptal_at timestamptz,
  add column if not exists video_yol text,
  add column if not exists ai_icerik boolean not null default false,
  add column if not exists yayin jsonb not null default '{}'::jsonb;

-- Günde en çok bir video.
create unique index if not exists ds_paylasim_yayin_gunu_uq
  on public.ds_paylasim (((yayin_at at time zone 'Europe/Istanbul')::date)) where yayin_at is not null;

-- Video dosyası: Meta videoyu herkese açık URL'den çeker. Yol tahmin edilemez (satır uuid'si), liste politikası yok.
-- Ücretsiz plan dosya sınırı 50 MB.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('paylasim-video', 'paylasim-video', true, 52428800, array['video/mp4', 'image/jpeg'])
on conflict (id) do nothing;

-- Kuyruktaki ilk boş güne yerleştirir. İptal hakkı korunsun diye en az 24 saat sonrası seçilir.
create or replace function public.paylasim_kuyruga_al(p_id uuid)
returns timestamptz language plpgsql set search_path = public as $$
declare
  saat constant time := '19:00'; -- paylaşım saati (TR)
  v public.ds_paylasim;
  gun date := (now() at time zone 'Europe/Istanbul')::date;
  an timestamptz;
begin
  perform pg_advisory_xact_lock(hashtext('paylasim_kuyrugu'));
  select * into v from public.ds_paylasim where id = p_id for update;
  if not found then raise exception 'Video bulunamadı.'; end if;
  if v.yayin_at is not null then return v.yayin_at; end if;
  if v.video_yol is null or v.durum <> 'hazir' then raise exception 'Video yüklenmemiş veya aşaması Hazır değil.'; end if;

  loop
    an := (gun + saat) at time zone 'Europe/Istanbul';
    exit when an > now() + interval '24 hours' and not exists (
      select 1 from public.ds_paylasim p where (p.yayin_at at time zone 'Europe/Istanbul')::date = gun
    );
    gun := gun + 1;
  end loop;

  -- Elle paylaşılmış platforma tekrar gönderilmez.
  update public.ds_paylasim set
    yayin_at = an, yayin_bitti_at = null, iptal_at = null, updated_at = now(),
    yayin = (
      select jsonb_object_agg(p, jsonb_build_object('durum',
        case when v.platformlar -> p ->> 'paylasildi_at' is null then 'bekliyor' else 'atlandi' end))
      from unnest(array['shorts', 'instagram']) p
    )
  where id = p_id;
  return an;
end $$;

-- Yayına 24 saatten fazla varsa kuyruktan çıkarır; gün boşalır, sonraki video oraya girer.
create or replace function public.paylasim_iptal(p_id uuid)
returns boolean language plpgsql set search_path = public as $$
begin
  update public.ds_paylasim
     set yayin_at = null, iptal_at = now(), yayin = '{}'::jsonb, updated_at = now()
   where id = p_id and yayin_at > now() + interval '24 hours';
  return found;
end $$;

-- Tek kazanan: kilit süresi dolmadan ikinci tik platforma dokunamaz. Platform durumunu döndürür.
create or replace function public.paylasim_kilit_al(p_id uuid, p_platform text, p_sure_sn int)
returns jsonb language sql set search_path = public as $$
  update public.ds_paylasim
     set yayin = jsonb_set(yayin, array[p_platform, 'kilit'], to_jsonb(now()))
   where id = p_id
     and yayin_at <= now()
     and yayin -> p_platform ->> 'durum' in ('bekliyor', 'isleniyor')
     and coalesce((yayin -> p_platform ->> 'kilit')::timestamptz, '-infinity') < now() - make_interval(secs => p_sure_sn)
  returning yayin -> p_platform;
$$;

-- Platform durumunu atomik birleştirir, satırın bitip bitmediğini hesaplar.
-- p_link verilirse platformlar kaydına da işlenir (istatistik senkronu buradan eşleşir).
-- Dönüş: tüm platformlar başarıyla bitti mi (dosya silinebilir).
create or replace function public.paylasim_yama(p_id uuid, p_platform text, p_yama jsonb, p_link text default null)
returns boolean language plpgsql set search_path = public as $$
declare
  y jsonb;
  bitti boolean;
  temiz boolean;
begin
  update public.ds_paylasim set
    yayin = jsonb_set(yayin, array[p_platform], coalesce(yayin -> p_platform, '{}'::jsonb) || p_yama),
    platformlar = case when p_link is null then platformlar else jsonb_set(platformlar, array[p_platform],
      coalesce(platformlar -> p_platform, '{}'::jsonb) || jsonb_build_object('link', p_link, 'paylasildi_at', now())) end,
    updated_at = now()
  where id = p_id
  returning yayin into y;
  if not found then return false; end if;

  bitti := not exists (select 1 from jsonb_each(y) e where e.value ->> 'durum' not in ('yayinda', 'atlandi', 'hata', 'kilitli'));
  temiz := not exists (select 1 from jsonb_each(y) e where e.value ->> 'durum' not in ('yayinda', 'atlandi'));
  update public.ds_paylasim set
    yayin_bitti_at = case when bitti then coalesce(yayin_bitti_at, now()) end,
    durum = case when temiz then 'paylasildi' else durum end
  where id = p_id;
  return temiz;
end $$;

-- pg_cron'dan çağrılır: yalnız iş varsa siteyi uyandırır. Anahtar Vault'ta (repo public):
--   select vault.create_secret('<PAYLASIM_CRON_SECRET>', 'paylasim_cron_secret');
create or replace function public.paylasim_tetikle()
returns void language plpgsql security definer set search_path = public as $$
declare anahtar text;
begin
  if not exists (select 1 from public.ds_paylasim where yayin_at <= now() and yayin_bitti_at is null) then return; end if;
  select decrypted_secret into anahtar from vault.decrypted_secrets where name = 'paylasim_cron_secret';
  if anahtar is null then
    raise warning 'paylasim_cron_secret Vault''ta yok';
    return;
  end if;
  perform net.http_get(
    url := 'https://startupdoktoru.com/api/cron/paylasim',
    headers := jsonb_build_object('Authorization', 'Bearer ' || anahtar),
    timeout_milliseconds := 65000
  );
end $$;

revoke execute on function public.paylasim_kuyruga_al(uuid) from public, anon, authenticated;
revoke execute on function public.paylasim_iptal(uuid) from public, anon, authenticated;
revoke execute on function public.paylasim_kilit_al(uuid, text, int) from public, anon, authenticated;
revoke execute on function public.paylasim_yama(uuid, text, jsonb, text) from public, anon, authenticated;
revoke execute on function public.paylasim_tetikle() from public, anon, authenticated;
grant execute on function public.paylasim_kuyruga_al(uuid) to service_role;
grant execute on function public.paylasim_iptal(uuid) to service_role;
grant execute on function public.paylasim_kilit_al(uuid, text, int) to service_role;
grant execute on function public.paylasim_yama(uuid, text, jsonb, text) to service_role;

create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.schedule('paylasim-kuyrugu', '*/5 * * * *', 'select public.paylasim_tetikle()');
