-- TikTok otomatik paylaşım kuyruğuna eklenir: video hesabın gelen kutusuna TASLAK olarak yüklenir,
-- yayını TikTok uygulamasından hesap sahibi yapar (TikTok kuralı: her gönderi kullanıcı onayıyla çıkar).
-- Yeni platform durumu "taslak": taslak telefona ulaştı; kuyruk için iş bitti, dosya silinebilir.
--
-- tiktok_access / tiktok_access_bitis    erişim anahtarı (kısa ömürlü) ve son geçerlilik anı
-- tiktok_refresh / tiktok_refresh_bitis  yenileme anahtarı; her yenilemede DEĞİŞİR, yenisi yazılır. null = bağlı değil
-- tiktok_state                           yetki akışının tek kullanımlık doğrulama değeri
alter table public.ds_paylasim_ayar
  add column if not exists tiktok_access text,
  add column if not exists tiktok_access_bitis timestamptz,
  add column if not exists tiktok_refresh text,
  add column if not exists tiktok_refresh_bitis timestamptz,
  add column if not exists tiktok_state text;

-- 0043'teki işlevin aynısı; tek fark: TikTok da yalnız bağlıysa kuyruğa girer.
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
      from unnest(array['shorts', 'instagram']
        || case when exists (select 1 from public.ds_paylasim_ayar where linkedin_token is not null) then array['linkedin'] else array[]::text[] end
        || case when exists (select 1 from public.ds_paylasim_ayar where tiktok_refresh is not null) then array['tiktok'] else array[]::text[] end) p
    )
  where id = p_id;
  return an;
end $$;


-- 0036'daki işlevin aynısı; tek fark: "taslak" da bitmiş ve temiz sayılır.
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

  bitti := not exists (select 1 from jsonb_each(y) e where e.value ->> 'durum' not in ('yayinda', 'taslak', 'atlandi', 'hata', 'kilitli'));
  temiz := not exists (select 1 from jsonb_each(y) e where e.value ->> 'durum' not in ('yayinda', 'taslak', 'atlandi'));
  update public.ds_paylasim set
    yayin_bitti_at = case when bitti then coalesce(yayin_bitti_at, now()) end,
    durum = case when temiz then 'paylasildi' else durum end
  where id = p_id;
  return temiz;
end $$;

revoke execute on function public.paylasim_kuyruga_al(uuid) from public, anon, authenticated;
revoke execute on function public.paylasim_yama(uuid, text, jsonb, text) from public, anon, authenticated;
grant execute on function public.paylasim_kuyruga_al(uuid) to service_role;
grant execute on function public.paylasim_yama(uuid, text, jsonb, text) to service_role;
