-- Paylaşım takibi — kameraya konuşulan kısa videolar (Instagram / Shorts / LinkedIn).
-- Yalnız admin kullanır. Video dosyaları Drive'da, burada linkleri durur.
-- platformlar: {"instagram": {"metin","link","paylasildi_at"}, "shorts": {...}, "linkedin": {...}}
create table if not exists public.ds_paylasim (
  id uuid default gen_random_uuid() primary key,
  baslik text not null,
  durum text not null default 'fikir'
    check (durum in ('fikir', 'senaryo', 'cekildi', 'kurguda', 'hazir', 'paylasildi')),
  notlar text,
  efektler text[] not null default '{}',
  ham_link text,
  kurgu_link text,
  hedef_tarih date,
  platformlar jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Yalnız service-role erişir (API üzerinden); istemciye politika yok.
alter table public.ds_paylasim enable row level security;
