-- INVEST — (1) Startup Doktoru'ndan eğitim almış girişim işareti (admin elle işaretler; yatırımcı kartında rozet).
-- (2) İlgi analizi: yatırımcı deck / website linkine kaç kez tıkladı (eşleşme satırı başına → kim tıkladı da belli).
alter table inv_startup_profiles add column if not exists sd_trained boolean not null default false;

alter table inv_matches add column if not exists deck_clicks int not null default 0;
alter table inv_matches add column if not exists website_clicks int not null default 0;
alter table inv_matches add column if not exists deck_clicked_at timestamptz;     -- son tıklama
alter table inv_matches add column if not exists website_clicked_at timestamptz;  -- son tıklama
