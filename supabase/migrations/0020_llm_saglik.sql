-- LLM sağlayıcı sağlığı.
--
-- OpenAI kredisi bitince AI mentör sessizce öldü ve kimse fark etmedi; ziyaretçiye
-- hazır bir metin gösterilip cevap veriliyormuş gibi yapıldı. Bu tablo her
-- sağlayıcının son durumunu tutar ki (1) zincir çalışan sağlayıcıya düşebilsin,
-- (2) bekçi günlük özette uyarabilsin, (3) kota bitince hemen mail gidebilsin.
--
-- Satır sayısı sağlayıcı sayısı kadar (2-3); büyümez.

CREATE TABLE IF NOT EXISTS public.ds_llm_saglik (
  saglayici TEXT PRIMARY KEY,
  son_basari TIMESTAMP WITH TIME ZONE,
  son_hata TEXT,
  son_hata_kod INTEGER,
  son_hata_at TIMESTAMP WITH TIME ZONE,
  -- Kota/bakiye bitti mi (HTTP 402/429). Bekçi ve anlık uyarı bunu okur.
  kota_bitti BOOLEAN NOT NULL DEFAULT false,
  -- Aynı sorun için günde bir mail: uyarı yağmuru olmasın.
  son_bildirim TIMESTAMP WITH TIME ZONE
);

-- Politika yok: yalnız service-role (sunucu) erişir.
ALTER TABLE public.ds_llm_saglik ENABLE ROW LEVEL SECURITY;
