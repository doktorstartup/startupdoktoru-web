# Maskot Animasyon Rehberi: Kapsül

Startup Doktoru maskotunun animasyonlu videolarını üretirken başvurulacak tek kaynak bu dosya. Karakterin nasıl göründüğünü, nasıl hareket ettiğini, hangi formatlarda teslim edileceğini ve ilk üretilecek animasyon setini tanımlar.

> Kaynak dosyalar: `public/brand/` (SVG). Karar tarihi: 2026-11-19.

---

## 1. Karakter kimliği

| | |
|---|---|
| **Ne** | Dikey duran, hafif eğik bir ilaç kapsülü. Üst yarısı turkuaz, alt yarısı beyaz. Üst yarıda iki beyaz hap göz. |
| **Rol** | Eser'in (Startup Doktoru) asistanı. Doktor değil, doktorun yanındaki yardımcı. Yol gösterir, tepki verir, kutlar. |
| **Kişilik** | Meraklı, dikkatli, sakin ve hafif esprili. Zeki ama ukala değil. **Asla çocuksu ya da sevimlilik abartısı yok.** |
| **Konuşma** | Ağzı yok, **konuşmaz ve dudak senkronu yapılmaz**. Bir şey söyleyecekse konuşma balonu, alt yazı ya da Eser'in sesiyle anlatılır. |
| **Duygu kaynağı** | Yalnızca **gözler + tüm gövdenin hareketi**. Kol, bacak ve yüz ifadesi eklenmez. |
| **İsim** | Henüz yok (açık karar, bkz. §10). |

Neden böyle: daha önce denenen stetoskop karakteri, unicorn ve banknot yönleri ya zorlama ya da çocuksu bulundu. Kapsülün gücü sadeliği. Canlılık çizim detayından değil, **hareketten** gelmeli.

---

## 2. Görsel kurallar (değişmez)

### Renkler

| Rol | Renk |
|---|---|
| Kapsül üst yarısı (kapak) | `#1BA1C4` turkuaz |
| Kapsül alt yarısı | `#FFFFFF` beyaz |
| Gözler | `#FFFFFF` beyaz (her zaman turkuaz üzerinde) |
| Parlama | `#FFFFFF`, %50 opaklık |
| Zemin / kontur | `#26304A` lacivert |

Bu beş değerin dışında renk kullanılmaz. Tek istisna kutlama parıltıları; onlar da turkuaz ya da beyaz olur.

### Geometri (100×100 tuval, SVG ile birebir)

- Kapsül: genişlik **34**, boy **72**, uç yarıçapı **17**. Ek yeri tam ortada (y = 50).
- Eğim: **−14°** (sola yatık), dönüş merkezi (50, 50).
- Gözler: **5.8 × 13.6** dikey hap, köşe yarıçapı 2.9. Merkezler **(44, 37)** ve **(56, 37)**, yani turkuaz yarıda.
- Parlama: kapağın sol üstünde ince yay, `M36.6 33 A14 14 0 0 1 41.5 22.6`, kalınlık 2.4.
- Açık zeminde (beyaz arka plan) kapsülün etrafına **2.4 kalınlığında lacivert kontur** eklenir, yoksa beyaz yarı kaybolur. Koyu zeminde kontur yok.
- Küçük boylarda (≤ 48 px) favicon ölçüleri kullanılır: gözler **7.6 × 15**, parlama yok.

### Yapılmayacaklar

- Ağız, kaş, kol, bacak, el, şapka, stetoskop gibi aksesuarlar eklemek
- Pembe, sarı, yeşil ya da gradyan renkler kullanmak
- Gözleri lacivert yapmak ya da beyaz yarıya taşımak (varyant B kararı)
- Gerçekçi 3D, plastik parlaklık, yansıma; stil **düz (flat) 2D**
- Gözleri yuvarlak "anime" gözlere çevirmek; temel hâl her zaman dikey hap
- Kapsülü ikiye ayırıp ayrı karakterler gibi oynatmak; kapak yalnızca kutlamada açılır ve geri kapanır

---

## 3. Kaynak dosyalar

`public/brand/` altında:

| Dosya | Ne için |
|---|---|
| `kapsul-ikon.svg` | Lacivert yuvarlak zeminli ikon. Profil fotoğrafı, sohbet avatarı. |
| `kapsul-ikon-acik-zemin.svg` | Zeminsiz, lacivert konturlu. Açık arka planlar. |
| `kapsul-ikon-koyu-zemin.svg` | Zeminsiz, kontursuz. Koyu arka planlar ve **animasyon için ana kaynak**. |
| `kapsul-favicon.svg` | Kalın gözlü küçük boy. Favicon, 48 px ve altı. |
| `logo-yatay.svg`, `logo-dikey.svg` | Yazılı logo kilitleri (açık zemin). |
| `logo-*-koyu-zemin.svg` | Yazılı logo kilitleri (koyu zemin). |

SVG'lerde animasyon için ayrık gruplar var:

- `#alt`: kapsülün beyaz alt yarısı (sabit gövde)
- `#kapak`: turkuaz üst yarı + parlama (kutlamada açılan parça)
- `#gozler`: iki göz (bakış yönü, kırpma ve ifade burada değişir)

After Effects'e alırken SVG'yi Illustrator'da açıp bu grupları ayrı katmanlara bölmek yeterli.

---

## 4. İfade kütüphanesi

Bütün ifadeler yalnızca gözlerin şekli ve konumuyla yapılır. Ölçüler 100'lük tuvalde, her gözün merkezine göre verilmiştir.

| İfade | Göz şekli | Ne zaman |
|---|---|---|
| **Normal** | Dikey hap 5.8 × 13.6 | Varsayılan, bekleme |
| **Kırpma** | 6.6 × 3 yatay hap, **140 ms** | Her 2,5–5 sn'de rastgele; canlılığın temeli |
| **Mutlu** | Yukarı kavisli yay `^ ^` (genişlik 7.6, kalınlık 3.1) | Başarı, satın alma, onay |
| **Şaşkın** | Daha uzun elips 8 × 16 | 404, beklenmedik veri, "vay!" anları |
| **Düşünüyor** | Yatay hap 6.6 × 3, gözler sağ üste kayık (+3, −2.5) | Yükleniyor, analiz ediliyor |
| **Uykulu** | Yatay hap, yavaş nefes hareketi | Uzun bekleme, boş ekran |
| **Göz kırpma** | Sol göz normal, sağ göz `^` | Esprili an, "sana bir sır vereyim" |
| **Endişeli** | Normal hap, iki göz içe doğru ±12° dönük, 1 birim aşağıda | Hata, uyarı ("nakit 3 ayda bitiyor") |
| **Kararlı** | Hap boyu kısalır (5.8 × 9), gözler 1 birim aşağı | "Hadi başlayalım", eyleme çağrı |
| **Bakış** | Normal hap, grup ±3 yatay / ±2.5 dikey kayar | İmleci ya da ekrandaki bir öğeyi izleme |

İfade geçişleri **80–120 ms** sürer; gözler önce kısa bir kırpmayla kapanıp yeni şekilde açılırsa geçiş daha doğal görünür.

---

## 5. Hareket dili

### Temel ilkeler

1. **Gövde tek parça hareket eder.** Duygu, tüm kapsülün eğilmesi, zıplaması ve esneyip yassılmasıyla güçlenir.
2. **Esneme ve yassılma (squash & stretch) ölçülü olmalı:** en fazla %8. Kapsül sert bir nesne gibi durmalı, jöle gibi değil.
3. **Hazırlık hareketi:** zıplamadan önce hafif çökme (3–4 kare), her büyük hareketten önce ters yönde küçük bir hareket.
4. **Taşma ve oturma:** hareket bitiş noktasını hafifçe geçip geri oturur. Web için yumuşatma eğrisi `cubic-bezier(.3, 1.6, .5, 1)`.
5. **Hiçbir zaman tamamen durmaz.** Beklerken çok hafif nefes (%2 dikey, 3,2 sn döngü) ve rastgele kırpma.

### İmza hareketleri

| Hareket | Tarif | Süre (30 fps) |
|---|---|---|
| **Nefes (idle)** | Dikeyde %2 esneme, alt kenar sabit | 96 kare döngü |
| **Zıplama** | 4 kare çökme → 8 kare yukarı (−12 birim) → 6 kare iniş + yassılma → 4 kare oturma | ~22 kare |
| **Kapak açılması** | `#kapak`, ek yerinin sağ ucu (67, 50) etrafında −14° döner ve 9 birim yukarı kalkar; gözler `^ ^`; 2–3 turkuaz parıltı. Sonra kapanır. | 10 kare açılma + 12 kare bekleme + 8 kare kapanma |
| **Baş sallama (onay)** | Eğim −14° → −6° → −14°, iki kez | ~18 kare |
| **Başını yana yatırma (merak)** | Eğim −14° → −24°, gözler aynı yöne kayar | ~12 kare |
| **Titreme (endişe)** | ±1,5 birim yatay sarsıntı, 3 tekrar | ~9 kare |
| **Düşüp oturma (giriş)** | Yukarıdan düşer, yassılarak oturur, gözler kapalıdan açılır | ~20 kare |

---

## 6. İlk animasyon seti

Önce bu sekiz animasyonu üretmek, site ve videoların ihtiyacının neredeyse tamamını karşılar.

| # | Ad | İçerik | Süre | Kullanım |
|---|---|---|---|---|
| 1 | `idle` | Nefes + rastgele kırpma + ara sıra bakış | 4 sn döngü | Site köşesi, sohbet balonu, video köşe filigranı |
| 2 | `selam` | Düşüp oturma → zıplama → göz kırpma | 1,5 sn | Site karşılaması, video girişi |
| 3 | `kutlama` | Zıplama → kapak açılır, parıltı → kapanır, `^ ^` | 1,5 sn | Satın alma, kurs tamamlama, "başardın" anları |
| 4 | `dusunuyor` | Gözler sağ üstte, yatay hap, hafif sallanma | 2 sn döngü | Yükleniyor, analiz |
| 5 | `saskin` | Ani elips gözler + küçük zıplama | 1 sn | 404, şaşırtıcı istatistik |
| 6 | `onay` | Mutlu gözler + baş sallama | 1 sn | Form başarısı, "doğru cevap" |
| 7 | `endise` | Endişeli gözler + titreme | 1 sn | Hata mesajı, uyarı, "bu hatayı yapma" |
| 8 | `logo-acilis` | Kapsül düşer → oturur → gözler açılır → yanında "STARTUP DOKTORU" yazısı belirir | 2 sn | Video intro/outro, sunum açılışı |

**Video girişinde kullanım:** "Hook 1,7 sn" kuralı geçerli. Maskot girişte kullanılacaksa `selam` ya da `logo-acilis` ilk 1,7 saniyeye sığmalı ve kancanın önüne geçmemeli. Tercihen kanca + maskot aynı karede olsun; maskot tek başına açılış yapmasın.

---

## 7. Teslim formatları

| Nerede | Format | Ölçü | Not |
|---|---|---|---|
| Video üstüne bindirme (Reels, YouTube) | **ProRes 4444 .mov** (şeffaf) | 1080 × 1080 kare tuval | Kurguda her boyuta yerleşir |
| Web'de şeffaf video | **WebM VP9 alfa** + Safari için **HEVC alfa .mov** | 512 × 512 | İkisi birlikte verilmeli |
| Site animasyonu (hafif) | **Lottie .json** ya da **Rive .riv** | vektör | Göz takibi gibi etkileşim istenirse Rive |
| Instagram hikâye çıkartması | **GIF** (şeffaf), GIPHY'ye yüklenir | 500 × 500, ≤ 8 MB | Döngülü: `idle`, `kutlama` |
| Reels / Shorts tam ekran | MP4 H.264 | 1080 × 1920, 30 fps | Lacivert zemin |
| YouTube | MP4 H.264 | 1920 × 1080, 30 fps | |

- Kare hızı **30 fps** (mevcut video hattıyla aynı, `scripts/video`).
- Maskot çerçevenin **%15'inden** küçük kalmasın; küçük kullanımda favicon göz ölçüleri.
- Dosya adı: `maskot-<animasyon>-<format>.<uzantı>`, örneğin `maskot-kutlama-alfa.mov`.

---

## 8. Üretim yolları

| Yol | Artısı | Eksisi | Ne için |
|---|---|---|---|
| **A. Remotion** (mevcut `scripts/video` hattı) | SVG'den birebir, karakter hiç bozulmaz; ifadeler kodla, tekrar üretilebilir; şeffaf ProRes çıkarabilir; videolara doğrudan girer | Serbest, el yapımı animasyon hissi daha zor | **Önerilen.** Video bindirmeleri, logo açılışı, Reels içi tepkiler |
| **B. After Effects + Lottie (Bodymovin)** | Animatörün tam kontrolü, en akıcı hareket | Animatör gerekir; Lottie'de bazı efektler desteklenmez | Sitedeki animasyonlar, özel kampanya videoları |
| **C. Rive** | Etkileşimli durum makinesi (imleci takip, tıklayınca kutlama); çok hafif | Video çıktısı için uygun değil | Site ve sohbet balonu |
| **D. Yapay zekâ video üreticileri** (Kling, Runway, Veo vb.) | Hızlı, sahne içine yerleştirme kolay | **Karakter tutarlılığı düşük**: renkler, göz şekli ve oranlar kayar; ağız ekleyebilir | Yalnızca deneme; her kare §2'ye göre kontrol edilmeli |

### D yolu için istem şablonu

Yapay zekâ aracı kullanılacaksa **görselden videoya** (image-to-video) modu kullanılmalı ve başlangıç karesi olarak `kapsul-ikon.svg`'den alınmış PNG verilmeli. İstem İngilizce:

```
A flat 2D vector mascot: a vertical medicine capsule tilted slightly left.
Top half solid turquoise #1BA1C4, bottom half solid white. Two white vertical
pill-shaped eyes on the turquoise half. No mouth, no arms, no legs, no outline
details, no gradients, no 3D shading. Solid navy #26304A background.
Motion: [HAREKET, örn. "the capsule hops once, squashes slightly on landing,
then blinks"]. Keep exact shape, colors and proportions in every frame.
Simple, clean, minimal motion graphics style.
```

Olumsuz istem (destekleniyorsa): `mouth, smile, arms, legs, hands, pink, gradient, 3D, glossy, realistic, extra characters, text`.

Yapay zekâ ile üretilen videolar paylaşılırken mevcut kural geçerli: video proje JSON'undaki `ai_beyan` alanı doldurulur.

---

## 9. Ses

Maskot konuşmadığı için sesi küçük ses efektleri taşır. Her hareketin kendi kısa sesi olsun ve hep aynı ses kullanılsın; zamanla maskotun "sesi" hâline gelir.

| Hareket | Ses |
|---|---|
| Kırpma | Yok (çok sık, gürültü yapar) |
| Zıplama / oturma | Yumuşak, kısa "tok" |
| Kapak açılması | Kapsül kapağı "pop" + hafif parıltı çınlaması |
| Şaşkın | Kısa yükselen "vıu" |
| Endişe | Kısa alçalan iki nota |
| Düşünüyor | Yumuşak, ritmik "tık tık" (isteğe bağlı) |

Video hattındaki SFX kütüphanesine `maskot-` önekiyle eklenmeli.

---

## 10. Açık kararlar

- **İsim:** maskotun adı yok. Kısa, Türkçe ve İngilizcede söylenebilir olmalı. Karar verilene kadar dosyalarda "kapsül" kullanılır.
- **Yazılı logoda maskot:** sitedeki eski PNG logo hâlâ kullanımda; yeni kapsüllü logoya geçiş ayrı bir iş.
- **İkinci karakter:** ileride içerik serileri için bir "hasta girişim" yan karakteri düşünülebilir. Şimdilik yok.

---

## 11. Remotion'da üretim (hazır)

§6'daki sekiz animasyonun hepsi `scripts/video/src/Maskot.tsx` içinde kodlu ve `Root.tsx`'e kayıtlı. Kompozisyon adları: `Maskot-idle`, `Maskot-selam`, `Maskot-kutlama`, `Maskot-dusunuyor`, `Maskot-saskin`, `Maskot-onay`, `Maskot-endise` (1080×1080) ve `Maskot-logo-acilis` (1920×1080).

Zemin `--props` ile seçilir: `seffaf`, `lacivert` ya da `beyaz` (beyazda kontur otomatik eklenir). `scripts/video` klasöründe:

```bash
npx remotion render src/index.ts Maskot-kutlama out/maskot/maskot-kutlama-alfa.mov --props='{"zemin":"seffaf"}' --codec=prores --prores-profile=4444 --pixel-format=yuva444p10le --image-format=png
```

```bash
npx remotion render src/index.ts Maskot-kutlama out/maskot/maskot-kutlama.mp4 --props='{"zemin":"lacivert"}' --codec=h264
```

Önizleme ve ince ayar için `npm run studio`. Hazır çıktılar `scripts/video/out/maskot/` altında; bu klasör git'e girmez. Yeni bir animasyon eklemek için `Maskot.tsx`'te bir bileşen yazıp `MASKOT_ANIMASYONLAR` listesine eklemek yeterli. Gövde (`Kapsul`) ve göz şekilleri ortak.

---

## 12. Yayın öncesi kontrol listesi

- [ ] Renkler yalnızca §2'deki beş değer mi?
- [ ] Gözler beyaz ve turkuaz yarıda mı? Ağız, kol ya da aksesuar eklenmemiş mi?
- [ ] Eğim −14° civarında ve oranlar bozulmamış mı (özellikle yapay zekâ çıktılarında)?
- [ ] Açık zeminde lacivert kontur var mı?
- [ ] Hareket ölçülü mü (esneme ≤ %8), çocuksu bir abartıya kaçmıyor mu?
- [ ] Videoda kullanılıyorsa ilk 1,7 sn kuralına uyuyor mu?
- [ ] Şeffaf teslimlerde alfa kanalı gerçekten çalışıyor mu (koyu ve açık zeminde test)?
- [ ] Yapay zekâ kullanıldıysa `ai_beyan` dolduruldu mu?
