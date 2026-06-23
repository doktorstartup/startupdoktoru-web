-- E-kitap → Eğitim upsell kampanya tetiği için trigger_type'a 'ebook_upsell' eklendi.
-- Bu tür kampanyalar, kişi e-kitap müşterisi olsa bile çalışır; yalnızca bir EĞİTİM
-- satın alınca durur (uygulama tarafında campaigns.ts → ownsTraining).

ALTER TABLE ds_campaigns DROP CONSTRAINT IF EXISTS ds_campaigns_trigger_type_check;
ALTER TABLE ds_campaigns ADD CONSTRAINT ds_campaigns_trigger_type_check
  CHECK (trigger_type IN ('lead', 'abandoned', 'interest', 'ebook_upsell'));

-- Kampanya ve adımları uygulama tarafında (seed script) eklenir:
--   ds_campaigns: "E-kitap → Eğitim Upsell" (trigger_type='ebook_upsell', cadence='delay')
--   3 adım: +1 gün, +3 gün, +6 gün — link {{site}}/egitimler?ind=ebook (tek eğitimlerde %50).
