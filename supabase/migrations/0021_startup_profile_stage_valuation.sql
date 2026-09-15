-- INVEST — girişim profili onboarding: ürün durumu + değerleme alanları.
-- product_stage: Fikir / MVP / İlk müşteriler / MRR / Growth (UI'da doğrulanır, DB esnek text).
-- valuation: değerleme yapıldıysa rakam (yoksa null).
alter table inv_startup_profiles add column if not exists product_stage text;
alter table inv_startup_profiles add column if not exists valuation text;
