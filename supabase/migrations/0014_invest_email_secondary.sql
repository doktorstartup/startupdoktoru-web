-- INVEST — inv_investors: yedek e-posta alanı (şablondaki "e-posta (yedek)" karşılığı).
-- Hunt/scraper veya toplu import ikinci bir yayınlanmış iletişim adresi bulduğunda buraya yazar.
-- KVKK: email ile aynı kural — yalnız outreach için yayınlanmış adres; address_purpose'a uyulur.
alter table inv_investors add column if not exists email_secondary text;
