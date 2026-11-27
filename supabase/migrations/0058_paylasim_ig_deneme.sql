-- Deneme Reels (Instagram trial reels): video önce yalnız takipçi olmayanlara gösterilir; iyi giderse
-- Instagram kendiliğinden takipçilere de açar (trial_params graduation_strategy SS_PERFORMANCE).
-- Projede "ig_deneme": true → teslim.mjs yazar; lib/paylasim-platform.ts container'a ekler. Hikâyeye paylaşılmaz.
alter table public.ds_paylasim add column if not exists ig_deneme boolean not null default false;
