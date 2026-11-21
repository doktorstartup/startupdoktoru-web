-- Akşam haber hattının her çalışmasının kalıcı kaydı (2026-11-21, Eser onayı).
-- 19-20 Kasım'da hat "başarılı" döndüğü hâlde yazı çıkmadı; pg_net cevapları 6 saatte silindiği için nedeni görülemedi.
-- Satır çalışma BAŞINDA açılır (ok null), sonunda doldurulur: ok null kalırsa çalışma yarıda kesilmiştir (zaman aşımı).
create table if not exists public.ds_haber_aksam_log (
  id bigserial primary key,
  basladi_at timestamptz not null default now(),
  bitti_at timestamptz,
  ok boolean,
  yazilan int,
  sonuc jsonb
);
alter table public.ds_haber_aksam_log enable row level security;
revoke all on public.ds_haber_aksam_log from public, anon, authenticated;
