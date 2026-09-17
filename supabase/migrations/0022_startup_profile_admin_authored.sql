-- INVEST — admin'in elle eklediği girişim profillerine izin (üye hesabı olmayan founder'lar).
-- user_id artık opsiyonel: admin-eklenen satırlar null user_id ile durur.
-- Not: user_id üzerindeki UNIQUE kısıtı korunur; Postgres birden çok NULL'a izin verir.
alter table inv_startup_profiles alter column user_id drop not null;
