-- Sosyal istatistik senkronu — platformdan SALT OKUNAN video metrikleri.
-- Günlük cron (/api/cron/sosyal) doldurur; paylaşım/yayınlama yok.
-- paylasim_id: ds_paylasim kaydına bağ (platformlar.<k>.link içindeki video kimliğiyle eşleşir).
-- metrikler: {"views","dakika","ort_sure_sn","ort_yuzde","begeni","yorum","paylasim","abone"}
-- tutma: [[oran (0..1), izleyici oranı], ...] — YouTube audienceWatchRatio, ~100 nokta.
create table if not exists public.ds_sosyal_video (
  id uuid default gen_random_uuid() primary key,
  platform text not null check (platform in ('youtube', 'instagram')),
  video_id text not null,
  paylasim_id uuid references public.ds_paylasim(id) on delete set null,
  baslik text,
  yayin_at timestamptz,
  sure_sn int,
  metrikler jsonb not null default '{}'::jsonb,
  tutma jsonb,
  guncellendi_at timestamptz not null default now(),
  unique (platform, video_id)
);
-- Yalnız service-role erişir (API üzerinden); istemciye politika yok.
alter table public.ds_sosyal_video enable row level security;
