-- INVEST — reddedilen girişim profiline gönderilen geri bildirim (eksik raporu + admin notu) saklanır.
alter table inv_startup_profiles add column if not exists review_feedback text;
