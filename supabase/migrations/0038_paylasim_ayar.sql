-- Otomatik paylaşım aç/kapa: Paylaşım sekmesindeki düğme (eskiden PAYLASIM_AKTIF env'i). Varsayılan KAPALI.
-- Tek satırlık tablo; yalnız service_role (admin API) okur/yazar.
create table if not exists public.ds_paylasim_ayar (
  id boolean primary key default true check (id),
  aktif boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.ds_paylasim_ayar enable row level security;
revoke all on public.ds_paylasim_ayar from public, anon, authenticated;
grant select, insert, update on public.ds_paylasim_ayar to service_role;
insert into public.ds_paylasim_ayar (id) values (true) on conflict (id) do nothing;

-- Kapalıyken siteyi hiç çağırmaz.
create or replace function public.paylasim_tetikle()
returns void language plpgsql security definer set search_path = public as $$
declare anahtar text;
begin
  if not coalesce((select aktif from public.ds_paylasim_ayar), false) then return; end if;
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

revoke execute on function public.paylasim_tetikle() from public, anon, authenticated;
