-- Instagram kaydırmalı post kuyruğu (Eser kararı, 2026-11-22): video konusunu destekleyen bilgi postları.
-- Görseller yerelde üretilir (scripts/carousel), Storage'a (paylasim-video/carousel/<id>/) JPEG olarak yüklenir, buraya sıraya girer.
-- Video kuyruğundan (ds_paylasim, günde bir video 19:00) ayrıdır: o günün video yerini almaz.
-- Yayını /api/cron/hikaye yapar (0048'deki 15 dakikalık görev); Paylaşım düğmesi kapalıysa atılmaz.
create table if not exists public.ds_carousel_kuyruk (
  id uuid default gen_random_uuid() primary key,
  baslik text not null,
  metin text not null,                 -- Instagram açıklaması
  gorsel_yollar text[] not null check (cardinality(gorsel_yollar) between 2 and 10), -- sırayla, Storage yolu
  yayin_at timestamptz not null,
  durum text not null default 'bekliyor' check (durum in ('bekliyor', 'isleniyor', 'yayinda', 'hata', 'atlandi', 'iptal')),
  container text,                      -- ana (CAROUSEL) container
  container_at timestamptz,
  ig_id text,
  link text,
  hata text,
  deneme int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists ds_carousel_kuyruk_vade on public.ds_carousel_kuyruk (yayin_at) where durum in ('bekliyor', 'isleniyor');
alter table public.ds_carousel_kuyruk enable row level security;
revoke all on public.ds_carousel_kuyruk from public, anon, authenticated;
grant select, insert, update, delete on public.ds_carousel_kuyruk to service_role;
