-- INVEST follow-up otomasyonu: ilgilenen yatırımcıya "haftanın girişimi" + giriş linki (günlük cron).
-- followup_sent_at: tekrar göndermeyi önler (dedup). featured: cron'un göndereceği "haftanın girişimi".
alter table inv_investors add column if not exists followup_sent_at timestamptz;
alter table inv_startup_profiles add column if not exists featured boolean not null default false;
