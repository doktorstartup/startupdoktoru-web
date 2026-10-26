# Video kurgu hattı

Kameraya konuşulan kısa videolar → 1080x1920 (Instagram / Shorts / LinkedIn).
Ayrı paket: kök projeye ve Vercel build'ine girmez. Medya (`public/`, `out/`) repoya girmez.

## Kurulum (bir kez)
```
brew install ffmpeg
cd scripts/video && npm i
python3 -m venv .venv && .venv/bin/pip install mlx-whisper
```

## Yeni video
1. `projeler/<ad>.json` yaz (örnek: `projeler/yatirimci-yok-mu.json`):
   - `klipler`: ham videolar sırayla. `goruntu: true` → yüz çekimi görünür; değilse yalnız sesi kullanılır.
   - `kes`: ham videonun saniyeleri — takılma/tekrar. (Sessizlikler zaten otomatik kısalır.)
   - `duzelt`: yanlış duyulan kelimeler (`""` at, `"+ek"` önceki kelimeye ekle).
   - `gorsel`: sahneler; her biri konuşmadaki bir `ifade` ile başlar.
     Türler: `yuz` (+`zoom`), `ekran` (+`resim`, `sayac`), `liste` (`maddeler`), `buyuk` (`vurgu`), `kapanis` (`metin`).
2. `node kes.mjs projeler/<ad>.json` — metne çevirir, keser, `public/<ad>/` üretir.
3. `node ekran.mjs public/<ad>` — platformdan temiz ekran görüntüleri (dev sunucu açık olmalı).
4. `npm run studio` ile canlı önizle, ya da:
   `npx remotion render src/index.ts Video out/<ad>.mp4 --props='{"proje":"<ad>"}'`

## B-roll ve kütüphane (önerilen)
Sahneyi `{"tur": "broll", "kareler": [...]}` yap; her kare bir `ifade` ile başlar:
`{ "ifade": "Kapı zili", "id": "kargocu-kapi-zil", "etiket": [...], "istem": "<görsel tarifi>", "hareket": "<hareket tarifi>", "ses": "zil-dingdong", "ses_istem": "...", "sayac": {...} }`
- `node broll-uret.mjs projeler/<ad>.json` — **önce kütüphaneye bakar**, eksikleri **fal.ai ile otomatik** üretir:
  görsel Flux (~$0,04) · `hareket` varsa Veo 3.1 Lite videosu (~$0,05/sn, 4 sn ≈ $0,20) · ses ElevenLabs (~$0,003).
- `--flow` (bedava, Google AI aboneliği; fal kredisi bitince): tarifi panoya kopyalar + Flow'u açar → sen
  **yapıştır → üret → indir** → İndirilenler'e düşen videoyu kendisi kütüphaneye ekler, sonrakine geçer.
  (Flow'u robotla kullanmak Google şartlarına aykırı; tıklamalar senin.) Veo sesli üretir: karede `"klip_sesi": 0.5`.
- `node kutuphane.mjs ara <kelime>` — kütüphanede ara; bulduğun `id`'yi yazman yeter, tekrar ödeme yok.
- Medya `kutuphane/` altında yerelde durur (repoya yalnız `index.json` girer) — ara ara Drive'a yedekle.

## Yüz çekimi olmayan sahneye yüz (AI — yalnız acil durum, ~$0,05/sn)
`node yuz-uret.mjs projeler/<ad>.json "<sahne ifadesi>" <omnihuman|lipsync> [referans.mp4]`
→ `public/<ad>/yuz-<yöntem>.mp4`; proje dosyasında o sahneyi `{"tur": "yuz", "video": "yuz-omnihuman.mp4"}` yap.
Ses senin gerçek kaydın, yalnız görüntü üretilir. `.env.local`'da `FAL_KEY` gerekir. ~$0,1–0,16/sn.
**Paylaşırken platformda "AI ile oluşturuldu" etiketini işaretle.**

Yatırımcı adları gibi kişisel veri `ekran.mjs` içinde `gizle` ile bulanıklaştırılır — herkese açık videoda görünmemeli.
