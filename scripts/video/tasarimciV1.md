# tasarımcıV1 — video kurgu sistemi devir notu (2026-11-10)

Bu dosya, Startup Doktoru kısa video sisteminin şimdiye kadarki durumu, yapılanlar, karşılaşılan
hatalar ve hata ayıklama süreci içindir. Başka bir Claude hesabından devam edecek oturum buradan
başlamalı. Repo: `~/Desktop/Dr.Startup_WebSitesi` · video hattı: `scripts/video/` (ayrı paket,
Vercel build'ine girmez) · teslim klasörleri: `~/Desktop/Startup Doktoru Videolar/`.

> **Durum:** E2VC_v2 hazır ama **iki yerde dudak kayması var** (aşağıda §5). Bu oturumun kod
> değişiklikleri **commit EDİLMEDİ** (§7). E2VC_v2 paylaşım kuyruğunda **DEĞİL**; kuyrukta 11 Kasım
> 19:00'da eski `e2vc-growth-fund` var — Eser'in kararı bekleniyor.

> **⚠️ 1,7 SANİYE KURALI (Eser, 2026-11-16 — her videoda zorunlu):** Sosyal medyada geçme kararı
> ~1,7 sn'de veriliyor. İlk 1,7 sn **şov**: görsel VE işitsel hook'ların hepsi orada patlar ki izleyici
> geçmesin. **Hook'lar orada bitmez** — videonun tamamı boyunca tutmaya devam: her sahne geçişinde
> geçiş sesi/efekti, 2–3 sn'de bir görsel değişim (zoom, B-roll, yazı vurgusu), müzik baştan sona
> altta ve geçişlerle uyumlu (kesimler vuruşa yakın), önemli kelimelerde vurgu sesi.
> - Görsel: kanca yazısı ilk karede ekranda (ilk sahnede `kanca`), en güçlü görüntü/yüz ilk karede.
> - İşitsel: ilk kelime ≤ 0,3 sn (sessiz başlangıç yok), hook cümlesi 1,7 sn'de duyulmuş olur,
>   darbe/riser ses efekti ≤ 1,7 sn (`efektler` içinde `an` ≤ 1.7), müzik ilk karede başlar.
> - Uzun hook cümlesi 1,7 sn'ye sığmıyorsa kısalt ya da soğuk açılışla en vurucu parçayı başa al.
> - `teslim.mjs` bunu denetler: ilk kelime ya da ilk ses efekti 1,7 sn'den sonraysa, müzik/efekt/kanca
>   eksikse teslim reddedilir (yalnız bilinçli sade video için projeye `"sade": true`).

> **✅ ASGARİ KALİTE STANDARDI (Eser onayladı, 2026-11-16 — "en azından böyle olmalı"):**
> Referans proje: **`projeler/hatali-basvuru.json`** (43 sn). Her yeni video **en az** bu seviyede olur;
> bunun altına düşen kurgu teslim edilmez. Yeni videoya başlarken önce bu projeyi aç, yapısını kopyala.
>
> | Ölçüt | Asgari | hatali-basvuru'da |
> |---|---|---|
> | Sahne sayısı | ~3 sn'de bir sahne değişimi | 14 sahne / 43 sn |
> | Sahne çeşitliliği | yalnız yüz+B-roll değil; en az 3 farklı grafik türü | yuz, ekran, grafik, buyuk, liste, sayi, kapanis |
> | Video boyunca kanca yazısı | açılış + en az 2 ara kanca | "YANLIŞ BAŞVURU", "ANLAMAMIŞSIN", "İŞİ ANLATMA" |
> | Yüz sahnelerinde hareket | her yüz sahnesinde `zoom` ya da `kanca`/`isim` | zoom: yanlış, gerçek, işi |
> | Ses efekti | her geçişte whoosh/glitch + içerik sesi (hata, damga, pop, kasa) | 24 efekt |
> | Müzik | projeye özel (gerekirse `broll-uret` ile üret), ses 0.16 / kısık 0.06 | muzik-hatali-basvuru |
> | Vuruş uyumu | müziğin temposunu ölç, başını kırp (`-k.mp3`), sahne `an`'larını en yakın vuruşa oturt (≤ 0,2 sn) | ort. sapma 0,08 sn |
> | Ses | `ses_filtre` (E2VC stüdyo zinciri), -14 LUFS civarı | -14,3 LUFS, -1,5 dBTP |
> | Kurgu | takılma, tekrar, dolgu cümleleri ("ama arkadaşlar", "ve bakalım") atılır; 35–45 sn | 3 ham → 41 sn |
> | Sona | `kapanis` + startupdoktoru.com | "Başvurunu DOĞRU YAP" |
>
> **Gizlilik:** Ekranda gerçek başvuru/kişi/girişim bilgisi görünecekse çekimi kullanma; isimsiz grafiği
> HTML'den çiz (Chrome headless → PNG, `grafik` sahnesi). Örnek: `public/hatali-basvuru/basvuru-*.png`.
>
> **Kontrol (her render'dan sonra, kuyruğa almadan önce):** `teslim.mjs --dry-run --yeniden` →
> 2 kare/sn tam kontak tablosu (gizli bilgi sızıyor mu, siyah kare var mı) → ebur128 ses ölçümü →
> Eser'e önizleme → onayla kuyruk. Yüz sahnesi `an`'ı klip sınırından ≥ 0,02 sn sonra (bkz. §4 #17).
>
> **Kapak karesi (Eser, 2026-11-21 — kontrol listesinde zorunlu):** `kapak.arka_sn`'yi rastgele bırakma.
> Yüz sahnelerinden ~0,3–0,5 sn aralıkla 20–30 aday kare çıkar, en iyi 2–3'ünü yüze yakın kırparak büyüt
> (`crop=640:700:220:420`), sonra adayları gerçek `Kapak` still'i olarak render edip yan yana karşılaştır.
> Seçim ölçütü: **iki göz tam açık** (göz kırpma/yarı kapalı kapak = ret), ağız kapalı ya da doğal,
> yüz çarpık/ara-hece ifadesinde değil, bakış kameraya; bunların içinden en dikkat çekici, canlı ifade.
> Yazı kafayı/gözleri kapatmamalı. 2026-11-21 Kuzey Yıldızı kapağı tek göz kapalı çıktı → 31,2 sn ile değişti.
>
> **Teslim kapısı (`teslim.mjs`, 2026-11-17):** Şunlardan biri tutmazsa teslim reddedilir (`"sade": true` hariç):
> sahne başına ort. ≤ 3,5 sn · hiçbir sahne > 7 sn değil · ≥ 3 grafik türü · açılıştan sonra ≥ 2 kanca ·
> her yüz sahnesinde zoom/kanca/isim · ≥ 20 efekt · her kesimde −0,3…+0,15 sn içinde efekt · müzik ≥ 0,14 ·
> `ses_filtre` var · son sahne kapanis · süre 25–60 sn. Vuruş uyumu, LUFS ve gizlilik makinece denetlenmez — elle kontrol.

---

## 1. Sistem ne yapıyor (kısaca)

Eser'in sesi/çekimleri → kesim + altyazı + hareketli grafik + B-roll + (gerekirse) dudak senkronu →
1080x1920 video + kapak + thumbnail + platform metinleri → (istenirse) otomatik paylaşım kuyruğu.

| Dosya | Görev |
|---|---|
| `yazi.py` | Yerel Whisper (mlx, `.venv`) ile kelime zamanlı metin |
| `kes.mjs` | Sessizlik kısaltma, elle kesim (`kes`), klipleri birleştirme, `kurgu.json` + `ses.wav` üretir |
| `yuz-analiz.py` | **Yeni.** MediaPipe ile yüz/duygu analizi (`.venv-yuz`, Python 3.11) |
| `cekim.mjs` | **Yeni.** Kütüphanedeki kendi çekiminden aralık keser + renk düzeltir → `public/<ad>/<id>.mp4` |
| `dudak.mjs` | **Yeni.** Duyguya göre dudak senkronu (fal.ai lipsync-2) |
| `broll-uret.mjs` | Kütüphanede yoksa üretir: Flux görsel, Veo 3.1 Lite video, ElevenLabs SFX, **ElevenLabs Music** |
| `kutuphane.mjs` | Kütüphane listele/ara/ekle (`kutuphane/index.json`, medya yerelde) |
| `src/Video.tsx` + **`src/Studyo.tsx`** | Remotion kompozisyonu (sahneler, altyazı, ses) |
| `teslim.mjs` | Render + kapak + thumbnail + metinler + Paylaşım sekmesi + kuyruk (`--dry-run` ile yalnız klasör) |
| `toplu.mjs` | Gelen kutusundaki ham videoları toplu işler |
| `analiz/` | Yüz/metin analiz çıktıları, `RAPOR.md`, `kutuphaneye-yaz.mjs` |

Akış (E2VC_v2 için kullanılan sıra):
```
node kes.mjs projeler/E2VC_v2.json          # ses kurgusu + kelime zamanları
node broll-uret.mjs projeler/E2VC_v2.json   # müzik/SFX/Veo (kütüphanede varsa ücretsiz)
node cekim.mjs projeler/E2VC_v2.json        # sessiz tepki çekimleri
node dudak.mjs projeler/E2VC_v2.json        # dudak senkronu (var olanı atlar, --yeniden ile yeniler)
node teslim.mjs projeler/E2VC_v2.json --dry-run   # render + klasör (kuyruğa almaz)
```
Önizleme: `npx remotion still src/index.ts Video out/x.png --frame=<n> --props='{"proje":"E2VC_v2"}'`

---

## 2. Bu oturumda yapılanlar

### 2.1 Çekim analizi (duygu + yüz + söz)
- 7 ham çekim (`ham_gelen/`: Uzun anlatım, Düşünme, Sessiz Dinleme, Gülme, Şaşırma, Sitem, Sert
  Konuşma) metne çevrildi → `analiz/metin/*.json`.
- Yüz: saniyede 10 kare, 52 ifade katsayısı + baş açısı + ağız açıklığı → `analiz/yuz/*.json`,
  bölümler (duygu, konuşuyor/sessiz). Kare dizileri gözle kontrol edildi.
- **Kütüphane:** eski, silinmiş `IMG_44xx` dosyalarına bakan 10 `cekim` kaydı silindi; yerine
  15 kayıt (9 sessiz tepki + 6 konuşan) — `analiz/kutuphaneye-yaz.mjs` yeniden üretir.
- `ham_gelen/.toplu-durum.json`: bu 7 çekim `asama: "kutuphane"` → `toplu.mjs` onları video sanıp
  işlemez (toplu.mjs'e bu aşama eklendi).

Önemli sessiz tepki anları (sesli anlatımın üstüne konabilir):
`eser-kahkaha` (Gülme 9–12), `eser-kahkaha-2` (15.1–17.5), `eser-dusunme-cene` (Düşünme 13.7–17),
`eser-dinleme` (Sessiz Dinleme 4.1–11.4), `eser-alayci-gulumseme` (Şaşırma 10.5–12.8),
`eser-parmak-uyari` (Sert 12.1–13.4), `eser-sitem-sonu`, `eser-dinleme-kas`, `eser-dusunme-kisa`.
Konuşan (dudak senkronu referansı): `eser-gulumseyerek-anlatim` (Gülme 0–9), `eser-sert-konusma`
(Sert 0–12.1), `eser-uzun-anlatim` (2.8–57.2), `eser-dusunme-konusma` (0–7.3),
`eser-sasirma-konusma` (0–10.5), `eser-sitem-konusma` (0–13.6).

### 2.2 Hook derlemesi (gerçek veri)
`ds_sosyal_video` (YouTube tutma eğrisi), 37 Shorts: 10. saniyede **soru/hikâye + büyük sayı %85+**
("Melek Değiller", "Krizden Doğan Milyar Dolarlık Fikir", "Nasıl Başlayacaksın?"); **liste/öğüt
%31–55** ("Bu 3 Soruya Dikkat", "Sunumda Görmek İstedikleri"). Kurallar `analiz/RAPOR.md` §2.

### 2.3 Yeni altyapı
- **Studyo.tsx** (kodlama ajanı yazdı; eski projeler byte-aynı render doğrulandı): sahne türleri
  `baslik`, `sayi`, `asama`, `zaman`, `grafik`; her sahnede `pip` (köşe balonu), `isik` (renk);
  kurgu düzeyinde `muzik` (konuşurken kısılır), `efektler` (kelimeye bağlı SFX), `studyo` (gren +
  vinyet); sahne `an` (mutlak başlangıç); **ifadeler sırayla aranır** (tekrarlanan cümlenin ikincisi
  bulunur); `liste` → `tik`, `baslik`, `resim` opsiyonel. Şema: ajanın raporu bu dosyanın §8'inde.
- **kes.mjs:** `{"sessizlik": 0.8}` klibi (tepki anı), aynı dosyadan çok klip (soğuk açılış),
  `tempo` (yavaşlatma), `ses_filtre` (stüdyo sesi), `muzik/efektler/studyo` kurguya aktarılır.
- **broll-uret.mjs:** `uret` (sahneye bağlı olmayan Veo arka planları), `efektler` (`ses_istem`),
  `muzik` (ElevenLabs Music $0,6/dk) — hepsi kütüphaneye girer.
- **cekim.mjs, dudak.mjs, yuz-analiz.py** (yukarıda).

### 2.4 E2VC_v2 videosu
`projeler/E2VC_v2.json` → `~/Desktop/Startup Doktoru Videolar/E2VC_v2/` (video.mp4, yayin.mp4,
kapak.jpg, thumbnail.jpg, metinler.md, analiz-raporu.md, broll/). 43,1 sn, -14,9 LUFS, -0,7 dBTP.
- **Soğuk açılış:** anlatımın 24. sn'sindeki "…yaklaşık bir yıl sonra tam 1 milyar doları aşan bir
  değerleme ile satıldı" başa alındı; $1.000.000.000 sayacı + darbe/riser/kasa sesi.
- Sonra: gülümseyerek dudak senkronlu giriş → $150M → Series A–C → $10M → Mobil OYUN → "Neden mi?"
  (düşünme, dudak) → Loom Games zaman çizelgesi → **0,8 sn tepki anı** (gerçek kahkaha + kasa) →
  "Asıl mesele şu" (sert, dudak) → 950/47/7 verisi → "yurt dışına…" (vurgulu, dudak) → "Ama bu
  kapıyı" (parmak, dudak) → kontrol listesi → kapanış.
- `ai_beyan: true` (dudak senkronu + Veo görüntüleri).
- Maliyet: ~$1,53 (müzik 0,45 · Veo 0,50 · görsel/SFX ~0,09 · dudak 0,49).

---

## 3. Kararlar (Eser'in)
- **İlk 1,7 sn şov: görsel + işitsel hook'ların hepsi orada; sonra video boyunca hook, geçiş efekti ve müzik devam** (2026-11-16; bkz. en üstteki kural, teslim denetler).
- Yüz gerektiğinde **dudak senkronu kullan** (lipsync-2 ~$0,05/sn uygun bulundu), **duyguya göre**
  referans seç, araya gerçek konuşan/tepki sahneleri koy.
- Sesli anlatım **ham**; yutmalar/sürçmeler kurguda temizlenmeli.
- Sürümler ayrı projeler/klasörler (v1'e dokunma). Teslim klasör adı = proje adı (ör. `E2VC_v2`).
- Kod işleri ayrı kodlama ajanına verilebilir; sohbet ana oturumda.

---

## 4. Hatalar ve hata ayıklama süreci (öğrenilenler)

| # | Belirti | Sebep | Çözüm / ders |
|---|---|---|---|
| 1 | Yüz analizinde ağız açıklığı hep ~0,01 | **Sakal** MediaPipe `jawOpen`'ı bastırıyor | Ağız = iç dudak noktaları (13–14) / yüz boyu |
| 2 | Konuşan çekimlerin yarısı "şaşırma" çıktı | Eser **konuşurken kaş kaldırarak vurgu yapıyor** | Konuşurken kalkık kaş = vurgu; sessizken = şaşırma |
| 3 | Kahkaha "gülümseme" çıktı | Kahkahada kaşlar da çatılıyor, çene ölçülemiyor | Eşik: gülümseme > 0,52 → gülme (kişiye göre ayarlandı) |
| 4 | Sessiz çekimde "İzlediğiniz için teşekkür ederim" | Whisper'ın sessizlikte uydurma (bilinen) | Konuşma tespitinde yok say |
| 5 | Soğuk açılışta tekrar eden cümle → sahneler yanlış yerde | `ifadeAni` hep ilk geçişi buluyordu | Sahne ifadeleri **sırayla** aranıyor + `an` alanı |
| 6 | Tepki anında hayalet "Asıl" altyazısı | Whisper kelime başını sessizliğe koymuş (28,36; ses 29,2'de) → kesim sınırı 0,06 sn'den fazla örtüştü | Kesim sınırını **silencedetect'in sessizlik başına** çek (28,40). Ders: sınırı kelime saatine değil sessizliğe koy |
| 7 | "Asıl mesele" veri sahnesi 1 sn görünüyordu | Sonraki sahne ifadesi erken eşleşti | Sonraki sahneyi "yurt dışına"dan başlattık |
| 8 | Köşe balonu başlığın üstünü kapattı (asama) | Balon sol-üstte, başlık da üstte | O sahneden `pip` kaldırıldı. Ders: başlıklı sahnede balon kullanma |
| 9 | Ses ölçümü yanlış yorumlandı | Ölçüm aralığı tepki anı değil anlatımdı | Aralığı `kurgu.sahneler` sessizlik klibinden al |
| 10 | Açılışta tepe seviye 0,0 dBTP | Darbe + riser + ses üst üste | Darbe 0,55→0,4 → -0,7 dBTP |
| 11 | Tepki anı çok sessiz (-33 dB) | Kasa sesi fazla kısılmıştı | 0,55'e geri |
| 12 | Loom zaman çizelgesi ve küçük yazılar okunmuyordu | Telefonda min. boyutlar düşük | Ajan düzeltti: içerik y 160–1150, etiket ≥ 46–60px |
| 13 | "mobil oyun", "startupdoktoru" yutuk | **Telaffuz** (whisper olasılığı %47 / "startuptoktor") | %8–15 tempo yetmedi → **yeniden kayıt veya ses klonu** (Eser'in kararı) |
| 14 | `kes.mjs` testi v4'te patladı | v4 ham dosyası silinmiş eski geçici klasörde | Kod hatası değil; testi mevcut projeyle yap |
| 15 | Higgsfield Virality Predictor | Ücretli oldu ($15/ay), CLI desteklemiyor | Alınmadı, kaldırıldı; gerçek tutma verisi kullanılıyor |
| 16 | GitHub'dan indirilen CLI çalıştırılamadı | Claude Code güvenlik denetimi | Doğru davranış; resmî kurulum kullanıcıda |
| 17 | Gizli kalması gereken ekran görüntüsü yüz sahnesinde göründü | Sahne `an`'ı vuruşa oturtulurken klip sınırının 0,003 sn önüne düştü → `Yuz` bir önceki klibin (laptop) görüntüsünü oynattı | Yüz sahnesi `an`'ı klip başından **en az 0,02 sn sonra** olmalı; vuruşa oturtma klip sınırını geçemez. Her render'dan sonra 2 kare/sn tam kontak tablosuyla bak |
| 18 | Düzeltmeler videoya girmedi | `teslim.mjs` video varsa yeniden render etmiyor | Proje değişince **`--yeniden`** |

Yutulma tespiti yöntemi (ses dinlenemediği için): Whisper kelime olasılığı (< %60) + konuşma hızı
(harf/sn > 22) + kelime içi sessizlik (silencedetect -36 dB, 0,1 sn).

---

## 5. AÇIK SORUN: dudak kayması (Eser fark etti)

Eser'in tespiti: **"…tam sizin için"** (giriş sahnesinin sonu, `dudak-giris.mp4`) ve **"bu kapıyı
çalmadan önce"** (`dudak-kapi.mp4`) cümlelerinde dudak kayıyor.

Muhtemel sebepler (doğrulanmadı):
1. **Referans penceresi kötü seçildi.** `dudak-giris` referansı `eser-gulumseyerek-anlatim`
   (Gülme 0–9 sn); bu çekimin 6,4–9 sn'si **gülerek konuşma** — sonda ağız gülümseme şeklinde,
   model "tam sizin için"i oturtamıyor olabilir. `dudak-kapi` referansı Sert konuşma 6–7,4 sn:
   **parmak ağza yakın / baş dönük** olabilir.
2. Referansta Eser **başka kelimeler söylüyor**; lipsync-2 ağzı yeniden çiziyor ama hızlı
   konuşmada (bu iki cümle hızlı) gecikme/kayma yapabiliyor.
3. Sahne sesi `ses.wav`'dan kesiliyor; sahne başı/sonu kelimeyi tam ortadan bölüyorsa uçlarda kayma.

Denenecek çözümler (ucuzdan pahalıya):
1. **Referansı ölçümle seç:** `analiz/yuz/<çekim>.json`'dan yaw < 8°, gülümseme < 0,3, ağız
   hareketi düzenli, el yüzden uzak bir pencere bul → `dudak_bas` ile ver. (Ör. giriş için
   `eser-uzun-anlatim` nötr-vurgulu bölümleri, kapı için `eser-sert-konusma` 0–2,4 sn.)
2. **Sahne sınırlarını kelime aralarındaki sessizliğe hizala** (bkz. hata #6).
3. Sadece bu iki sahneyi **`lipsync-2-pro`** ile dene (~1,67x fiyat; `dudak.mjs`'de model alanı
   parametre yapılabilir), `--yeniden` yerine dosyayı silip tekrar üret.
4. Kaymanın olduğu son yarım saniyeyi **J-cut** ile grafiğe/B-roll'a geçir (yüz cümle bitmeden kesilir).
5. Ses klonu/yeniden kayıt kararı (§4 #13) ile birlikte ele al.

Kontrol yöntemi: ağız bölgesini büyüt (`ffmpeg ... crop`) + kare dizisi; asıl doğrulama Eser'in
sesli izlemesi (ses dinlenemiyor).

---

## 6. Diğer açık işler
- Yeniden kayıt mı ses klonu mu ("İlk odak mobil oyun." + "Detaylar startupdoktoru.com'da.")?
- E2VC_v2, kuyruktaki eski e2vc'nin yerine geçsin mi? (`teslim.mjs` dry-run'sız çalıştırılırsa
  kuyruğa girer — aynı başlık yok, ayrı kayıt olur; eskisini panelden iptal etmek gerekir.)
- `teslim.mjs` `broll/` klasörüne yalnız eski tip broll'ları kopyalıyor; yeni sahnelerin malzemesi
  elle kopyalandı → teslim'e `uret`/`cekim`/`dudak`/müzik/efekt kopyalaması eklenmeli.
- Kapak arka planı ilk `yuz+video` sahnesinden alınıyor (`dudak-giris.mp4`, arka_sn 1.0) — kontrol et.

## 7. Commit edilmemiş değişiklikler
`scripts/video/`: `kes.mjs`, `broll-uret.mjs`, `toplu.mjs`, `src/Video.tsx`, `src/Studyo.tsx` (yeni),
`cekim.mjs` (yeni), `dudak.mjs` (yeni), `yuz-analiz.py` (yeni), `analiz/` (yeni; `face_landmarker.task`,
`metin/`, `yuz/` büyük/yerel — repoya girip girmeyeceğine karar ver), `projeler/E2VC_v2.json`,
`kutuphane/index.json`, `tasarimciV1.md`. `.venv-yuz/` gitignore'a eklenmeli.
Doğrulama: `npx tsc -p .` geçiyor; eski proje (`yatirimci-yok-mu-v4`) byte-aynı render (ajan doğruladı).

## 8. Yeni sahne şeması (özet)
- Sahne: `an?` (mutlak sn), `pip?: "x.mp4"`, `isik?` (yuz+video), `dudak?` + `dudak_bas?` (dudak.mjs).
- `baslik`: `ust?, baslik: string[], vurgu?, arka?: x.mp4|jpg|png`
- `sayi`: `sayi, on?, son?, etiket?, ust?`
- `asama`: `asamalar: string[], aktif: number[], baslik?, etiket?`
- `zaman`: `baslik?, adimlar: {ust, metin, ifade?, vurgu?}[]`
- `grafik`: `resim, baslik?, kaynak?`
- `liste`: `tik?, baslik?, resim?` + `maddeler: {metin, ifade}[]`
- Kurgu: `muzik: {dosya, ses?=0.22, kisik?=0.07}`, `efektler: [{ses, ifade?|an?, kaydir?, seviye?}]`, `studyo: true`
- Klip: `{dosya, kes, tempo?}` | `{sessizlik: sn}`; proje `ses_filtre`.

Maliyet referansı: lipsync-2 $0,05/sn (pro ~$0,083) · Veo 3.1 Lite $0,05/sn · Flux ~$0,036 ·
ElevenLabs SFX $0,002/sn · ElevenLabs Music $0,6/dk. Anahtar: `.env.local` `FAL_KEY` (Vercel'e eklenmez).

---

## 9. E2VC_v3 (2026-11-10) — dudak kayması çözümü

**Kök neden (ölçümle doğrulandı):** `dudak-giris` referansı Gülme 0–4,6 sn → 3,4–5,5 sn arası Eser
**susuyor**; "tam sizin için" tam oraya düşüyor. `dudak-kapi` referansı Sert 6–7,4 sn → baş **−13° dönük**.

**Yeni ölçer — `senkron-olc.py` (dudak kapanma testi):** b/m/p sesleri dudak kapanmadan çıkmaz; kelime
zamanından bu anları tahmin edip ağzın kapanıp kapanmadığına bakar. Kalibrasyon: gerçek çekimler
%89–100 (Düşünme %62: "Hmmm"). E2VC_v2: giriş 6/8 ("**tam**" AÇIK), kapı 3/4 ("**çalmadan**" AÇIK),
neden 0/1 ("mi"), yurtdışı 2/4 ("kalmayabilir") — Eser'in duyduğu yerleri birebir buldu.
(Ses zarfı ↔ ağız korelasyonu denendi, bırakıldı: sakal + oda sesi → gerçek çekim bile 0,1–0,3.)

**dudak.mjs yenilendi:** `"dudak": "oto"` (+ `dudak_kaynak` tercih listesi) → analiz/yuz'dan önden,
gülümsemesiz, kesintisiz konuşan pencere seçer; sahneler aynı pencereyi paylaşmaz. Ses iki yandan
0,35 sn bağlam payıyla senkronlanır, sonra kırpılır. Her çıktı ölçülür, skor < 0,85 ise sıradaki
referansla tekrar (en çok 3), en iyisi tutulur → `public/<ad>/dudak-rapor.json`. `--aday` (ücretsiz
önizleme), `--sadece x.mp4`, `--pro` (lipsync-2-pro).

**Motion:** `isim` alanı → isim bandı (lower third), V3'te ilk yüz sahnesinde.

### 9.1 Sakal lekesi (Eser fark etti, 2026-11-10 gece)
**Belirti:** giriş cümlesi boyunca dudak altında beyaz/mavimsi pürüzsüz leke. **Sebep:** lipsync modeli alt
yüzü yeniden çizerken kır sakal dokusunu siliyor; her çıktıda var, en çok "Uzun anlatım" çekiminde (sakal
parlak + mavi ışık) — V3 referanslarının çoğu oradan seçildiği için belirginleşti. Dudak testi bunu görmez.
**Çözüm (kalıcı, dudak.mjs içinde):** `sakal-onar.py` — dudaklar modelden kalır, alt dudak altı → çene
bölgesi gerçek referans kareden (çene geometrisine afin bükülü, yumuşak maske, noktalar zamanda
yumuşatılmış) geri konur. `yama-olc.py` (çene dokusu çıktı/referans Laplace oranı; ortanca < 0,4 = LEKE;
kalibrasyon: ham 0,25, onarılmış 0,51–0,61) — LEKE kalan çıktı kalite kapısından geçemez.
V3'ün 5 sahnesi onarıldı (ek ücret yok), dudak testi yine 5/5 tam, kuyruktaki video güncellendi.

### 9.2 Temiz dudak cümleleri kütüphanesi
`dudak-kutuphane.mjs` (dudak.mjs sonunda otomatik): dudak testi + leke testi geçen her cümle, kendi sesiyle
`kutuphane/dudak-<proje>-<sahne>.mp4`, kayıt `tur: "dudak"` (metin, kelime zamanları, duygu, ref, testler).
Arama: `node kutuphane.mjs ara dudak-senkron`. V2 klipleri girmedi (kayma + leke). İleride cümle cümle
birleştirme için temel.

### 9.3 Karar: sakal onarımı GERİ ALINDI (Eser, 2026-11-10)
Onarımlı sürümde Eser daha çok kayma gördü (çene referanstan geldiği için çene sesle değil referansla
oynuyor). Kuyrukta onarımsız A sürümü. `dudak.mjs` onarımı yalnız `--sakal` ile yapar; leke ölçümü rapora
yazılır ama kapı değildir. Kütüphane: senkron geçen kayıtlar girer, `sakal-lekesi`/`temiz` + `onayli` etiketli.
Karşılaştırma dosyaları: teslim klasöründe karsilastir-A-onceki.mp4 / karsilastir-B-sakal-onarimli.mp4.
Sıradaki: Eser daha temiz bir ses kaydı gönderecek → yeniden deneme.
