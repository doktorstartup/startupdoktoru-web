-- Günlük söz hikâyesi kuyruğu (Eser kararı, 2026-11-21): maskotlu çizim hikâyeler her sabah 07:00 TR'de Instagram'a.
-- Görseller yerelde üretilir (scripts/hikaye), Storage'a (paylasim-video/hikaye/) yüklenir, buraya sıraya girer.
-- Yayını /api/cron/hikaye yapar (0048'deki 15 dakikalık görev); Paylaşım düğmesi kapalıysa atılmaz.
create table if not exists public.ds_hikaye_kuyruk (
  id uuid default gen_random_uuid() primary key,
  soz text not null,
  gorsel_yol text not null,            -- Storage yolu (paylasim-video kovası)
  yayin_at timestamptz not null,
  durum text not null default 'bekliyor' check (durum in ('bekliyor', 'isleniyor', 'yayinda', 'hata', 'atlandi', 'iptal')),
  container text,
  container_at timestamptz,
  ig_id text,                          -- yayınlanan hikâyenin medya id'si (ds_ig_hikaye.id)
  hata text,
  deneme int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists ds_hikaye_kuyruk_vade on public.ds_hikaye_kuyruk (yayin_at) where durum in ('bekliyor', 'isleniyor');
alter table public.ds_hikaye_kuyruk enable row level security;
revoke all on public.ds_hikaye_kuyruk from public, anon, authenticated;
grant select, insert, update, delete on public.ds_hikaye_kuyruk to service_role;
