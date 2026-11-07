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

## Teslim (paylaşıma hazır klasör)
Proje dosyasına `kapak` (`arka_sn`, `rozet`, `baslik`, `vurgu`) ve `paylasim` (`baslik`, `instagram`, `shorts`, `linkedin`) ekle, sonra:
`node teslim.mjs projeler/<ad>.json` → `~/Desktop/Startup Doktoru Videolar/<ad>/` (video, yayin.mp4, kapak 1080x1920, thumbnail 1280x720, broll/, metinler.md),
Paylaşım sekmesine "Hazır" kaydı (aynı başlık varsa günceller; paylaşıldı işaretlerine dokunmaz) ve **otomatik paylaşım kuyruğu**:
yayın dosyası + kapak Supabase Storage'a (`paylasim-video`) yüklenir, video en az 24 saat sonraki ilk boş güne yerleşir (saat 19:00 TR).
İptal edilmiş video kendiliğinden geri girmez; yayını başlamış videonun dosyasına dokunulmaz.
`--dry-run`: klasörü ve yayin.mp4'ü üretir, veritabanına ve Storage'a dokunmaz.
45 MB üstü dosya otomatik sıkıştırılır (Supabase ücretsiz plan sınırı 50 MB; 43 sn'lik video ~18 MB çıkıyor).
Shorts metni `BAŞLIK: ...` + `AÇIKLAMA:` kalıbında olmalı; proje dosyasında `"ai_beyan": true` ise YouTube ve Instagram'a otomatik AI beyanı gider ve `metinler.md` uyarı yazar.

### AI beyanı (`ai_beyan`)
Kurguda Claude video başına karar verir. **`true`** yalnız izleyicinin gerçek sanabileceği fotogerçekçi AI içerik varsa:
AI üretimi gerçekçi kişi veya gerçekçi sahne, gerçek bir kişi/olay/yerin değiştirilmesi (ör. `yuz-uret.mjs` yüzü, gerçekçi B-roll insanları).
**`false`**: kendi çekimin, kurgu, efekt, altyazı, grafik/yazı, açıkça fantastik veya illüstrasyon tarzı görüntü.
Alan yoksa `teslim.mjs` uyarı basar ve eski geniş kuralı uygular (herhangi bir AI B-roll/video varsa beyan açık).

## Toplu üretim (haftalık oturum)
Gelen kutusu: **`~/Desktop/Startup Doktoru Videolar/_gelen/`**. Ham videoları buraya at.
Google Drive masaüstü klasörü için: `VIDEO_GELEN="$HOME/Library/CloudStorage/GoogleDrive-<hesap>/Drive'ım/Ham Videolar" node toplu.mjs` (veya `--gelen <klasör>`).

```
node toplu.mjs            # yeni videoları işle, kurgusu biteni teslim et, tabloyu göster
node toplu.mjs --durum    # yalnız tablo
node toplu.mjs --dry-run  # teslim veritabanına ve Storage'a dokunmaz
node toplu.mjs --zorla    # kontrol uyarısına rağmen teslim et
```

Her video şu aşamalardan geçer; durum gelen kutusundaki `.toplu-durum.json`'da durur, yarıda kesilirse aynı komut kaldığı yerden sürer:
1. `metin`: `projeler/<ad>.json` açılır, `kes.mjs` metne çevirip keser. Son 60 sn'de değişen dosya (Drive hâlâ indiriyor olabilir) sonraki çalıştırmaya kalır.
2. `kurgu_bekliyor`: **burada durur.** Claude `public/<ad>/kurgu.json`'daki metni okur, proje dosyasına `kes`, `duzelt`, `gorsel`, `kapak`, `paylasim` yazar (gerekirse `ekran.mjs`, `broll-uret.mjs`), `"ai_beyan": true|false` kararını yazar (bkz. AI beyanı) ve son olarak `"kurgu_tamam": true` ekler. Varsayılan `gorsel` tek yüz sahnesidir, ama `kurgu_tamam` olmadan video asla teslim edilmez.
3. Komut yeniden çalıştırılır. Proje değiştiyse `kes.mjs` tekrar koşar (metin önbellekten), kontrolden geçen video `teslim.mjs` ile render edilir.
4. `kuyrukta`: bitti, bu dosya bir daha işlenmez (dosya adı değişse de boyut + ilk 1 MB ile tanınır).

Yayın öncesi kontrol (`kontrol.mjs`, kesilmiş kelime zamanlarından): konuşma ilk 1 sn'de başlıyor mu, kelimeler arasında veya sonda 1,5 sn'den uzun boşluk var mı.
Uyarı varsa `kontrol_uyari`'da durur: düzelt (`kes`) veya `--zorla`. 3 sn merak cümlesi ve ekrandaki yazı kontrolü kurgu adımında Claude'dadır.

Testler: `node --test scripts/video/kontrol.test.mjs`. Not: Remotion, yolunda `.claude/` geçen klasörde kök bileşeni yükleyemiyor; render'ı ana klonda çalıştır, worktree'de değil.
