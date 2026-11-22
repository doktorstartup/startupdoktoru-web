-- Söz hikâyesi görseli TikTok'a fotoğraf taslağı olarak gider (lib/instagram-hikaye.ts sozTiktok).
-- tiktok_durum: null (gönderilmedi) | isleniyor | taslak | hata | atlandi
alter table public.ds_hikaye_kuyruk
  add column if not exists tiktok_durum text,
  add column if not exists tiktok_id text,
  add column if not exists tiktok_hata text;
