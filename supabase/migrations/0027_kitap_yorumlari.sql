-- Kitap yorumları — okuyucu portalında, 1. bölümü bitiren okura sorulur.
-- Kişi başına tek yorum (e-posta), sonradan güncelleyebilir. Admin onaylamadan
-- ve kişi yayın izni vermeden sitede gösterilmez (KVKK: açık izin).
create table if not exists public.ds_kitap_yorumlari (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  ad text,
  meslek text,
  puan smallint not null check (puan between 1 and 5),
  yorum text not null,
  yayin_izni boolean not null default false,
  durum text not null default 'bekliyor' check (durum in ('bekliyor', 'onayli', 'reddedildi')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Yalnız service-role erişir (API üzerinden); istemciye politika yok.
alter table public.ds_kitap_yorumlari enable row level security;
