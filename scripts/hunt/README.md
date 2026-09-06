# INVEST — Yatırımcı Avı (hunt) reçetesi

Uygulamadan **ayrı**, tekrarlanabilir bir keşif/zenginleştirme akışı. Sonuçlar `inv_investors`'a
`status='pending'` olarak düşer; onay `/admin/invest` ekranından yapılır (KVKK: kaynaksız satır
`verified` yapılamaz).

## Mimari
- **Göz = agent-reach** (izole venv: `~/.agent-reach-venv`). Ücretsiz omurga:
  - Exa semantik arama: `mcporter call exa.web_search_exa query="..." numResults=N`
    (`category:people` / `category:company` LinkedIn'e odaklar)
  - Sayfa okuma: `curl https://r.jina.ai/<URL>`  veya  `mcporter call exa.web_fetch_exa urls='["..."]'`
  - RSS: agent-reach RSS kanalı
- **Beyin = Claude Code** — arama sonuçlarından yapılandırılmış kayıt + sektör/aşama etiketi + kalite skoru + gerekçe üretir.
- **El = `upsert-investor.mjs`** — service-role ile dedupe'li toplu insert.

## Hedefleme
`config.json` — amaç, coğrafya önceliği, aşamalar, seed sektörleri, Exa sorguları, kalite eşiği, KVKK kuralı.
(Bu dosya ileride bir "yatırımcı ara" panelinin toplayacağı parametrelerin aynısı.)

## Bir av oturumu
1. `config.json`'daki sorgularla Exa araması → aday kişiler/firmalar.
2. Zayıf kayıtlar için `web_fetch_exa`/Jina ile sayfayı derinleştir (e-posta, thesis, ticket).
3. Claude Code her adayı `inv_investors` alanlarına çevirir + kalite skoru/gerekçe (`notes`).
   - **Tez (`thesis`):** jargon değil, açık cümlelerle — ne yatırır, hangi aşama, hangi çek, hangi kurucuyu arar.
   - **İletişim (`notes` → "İletişim:"):** her lead için en iyi **yayınlanmış** ulaşım kanalı. Yatırımcıların çoğu kişisel e-posta yayınlamaz → gerçekçi kanal genelde LinkedIn + firma iletişim/pitch formu. Yayınlanmış e-posta varsa `email` + `address_purpose='outreach_published'`.
   - `source_url` = kaydın geldiği herkese açık URL (zorunlu). Tahmini/pattern e-posta ÜRETME (KVKK + deliverability riski).
4. Batch'i JSON'a yaz, dedupe'li yükle:
   ```
   node --env-file=.env.local scripts/hunt/upsert-investor.mjs scripts/hunt/pilot-batch.json
   ```
5. `/admin/invest` → pending'leri incele/onayla.

## Kalite kuralı ("kaliteli lead")
Aktif (son ~12 ay hareket) + herkese açık kanal + net sektör/aşama odağı + tekil. Eşiği geçmeyen yüklenmez.

## Gerçekçi tempo
Ücretsiz omurga: odaklı oturumda ~10–20 kaliteli lead. Ölçek/self-servis gerekince: panel + ucuz çıkarım modeli (Haiku) + güçlü yargı modeli.
