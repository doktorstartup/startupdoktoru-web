-- Bir e-posta = tek lead (2026-11-21).
-- Ücretsiz eğitim formu, üyelik, Google girişi ve /api/welcome birbirini kontrol etmeden
-- ds_leads'e satır açıyordu: 96 satırın 22'si aynı kişinin kopyasıydı. Önce kopyalar en
-- eski satırda birleştirilir (etiketler birleşir, en yüksek skor, boş alanlar doldurulur),
-- sonra lower(trim(email)) üstüne benzersiz index konur. İkinci insert artık hata verip düşer;
-- çağıranların hepsi hatayı yutuyor, mevcut kayıt korunur. ds_leads'e FK yok.
BEGIN;

CREATE TEMP TABLE lead_grup ON COMMIT DROP AS
SELECT lower(trim(email)) AS e,
       (array_agg(id ORDER BY created_at, id))[1] AS tut,
       max(score) AS skor,
       (array_agg(phone ORDER BY created_at) FILTER (WHERE coalesce(phone, '') <> ''))[1] AS phone,
       (array_agg(company ORDER BY created_at) FILTER (WHERE coalesce(company, '') <> ''))[1] AS company,
       (array_agg(startup_stage ORDER BY created_at) FILTER (WHERE startup_stage IS NOT NULL))[1] AS startup_stage,
       (array_agg(user_id ORDER BY created_at) FILTER (WHERE user_id IS NOT NULL))[1] AS user_id,
       bool_or(coalesce(wa_onay, false)) AS wa_onay,
       min(wa_onay_at) AS wa_onay_at,
       bool_or(status = 'CUSTOMER') AS musteri,
       bool_or(status = 'HOT') AS sicak
FROM ds_leads
GROUP BY 1
HAVING count(*) > 1;

-- 1) Tutulacak (en eski) satırı zenginleştir
UPDATE ds_leads k SET
  score         = g.skor,
  tags          = (SELECT coalesce(array_agg(DISTINCT t), '{}') FROM ds_leads d, unnest(coalesce(d.tags, '{}')) t
                   WHERE lower(trim(d.email)) = g.e),
  phone         = coalesce(nullif(k.phone, ''), g.phone),
  company       = coalesce(nullif(k.company, ''), g.company),
  startup_stage = coalesce(k.startup_stage, g.startup_stage),
  user_id       = coalesce(k.user_id, g.user_id),
  wa_onay       = g.wa_onay,
  wa_onay_at    = coalesce(k.wa_onay_at, g.wa_onay_at),
  status        = CASE WHEN g.musteri THEN 'CUSTOMER'
                       WHEN g.sicak AND k.status <> 'CUSTOMER' THEN 'HOT'
                       ELSE k.status END
FROM lead_grup g
WHERE k.id = g.tut;

-- 2) Kopyaları sil
DELETE FROM ds_leads d
USING lead_grup g
WHERE lower(trim(d.email)) = g.e AND d.id <> g.tut;

-- 3) Tekrarını engelle
CREATE UNIQUE INDEX IF NOT EXISTS ds_leads_email_tekil ON ds_leads (lower(trim(email)));

COMMIT;
