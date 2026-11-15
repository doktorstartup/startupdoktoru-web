-- LinkedIn (kişisel profil) otomatik paylaşım kuyruğuna eklenir.
-- Anahtar 60 günlük ve LinkedIn bu izinle (w_member_social) otomatik yenileme vermez: Paylaşım sekmesinden
-- yeniden bağlanır. Bu yüzden anahtar env'de değil ayar satırında durur (yalnız service_role okur).
--
-- linkedin_token  erişim anahtarı; null = bağlı değil (kuyruk LinkedIn'i hiç eklemez)
-- linkedin_kisi   urn:li:person:<kisi>
-- linkedin_bitis  anahtarın son geçerlilik anı
-- linkedin_state  yetki akışının tek kullanımlık doğrulama değeri
alter table public.ds_paylasim_ayar
  add column if not exists linkedin_token text,
  add column if not exists linkedin_kisi text,
  add column if not exists linkedin_bitis timestamptz,
  add column if not exists linkedin_state text;

-- 0036'daki işlevin aynısı; tek fark platform listesi: LinkedIn yalnız bağlıysa kuyruğa girer.
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
      from unnest(array['shorts', 'instagram'] || case
        when exists (select 1 from public.ds_paylasim_ayar where linkedin_token is not null) then array['linkedin']
        else array[]::text[] end) p
    )
  where id = p_id;
  return an;
end $$;

revoke execute on function public.paylasim_kuyruga_al(uuid) from public, anon, authenticated;
grant execute on function public.paylasim_kuyruga_al(uuid) to service_role;
