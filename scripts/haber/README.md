# Haber → İçerik Merkezi

Yatırım haberlerini içeriğe çeviren hat. Aylık nakit maliyet **0 $**.

## Günlük akış

Toplama **otomatik** (GitHub Actions, günde 2 kez) — sen hiçbir şey yapmıyorsun,
`kuyruk/` klasörü kendiliğinden doluyor.

Bir haberi içeriğe çevirmek için sırayla:

```bash
K=kuyruk/2026-08-28_hubx-5ca6.json          # işlemek istediğin kayıt

# 1) Görsel + video çekimi  (~50 sn) → Drive'daki paketler/ klasörüne
node scripts/haber/varlik.mjs $K

# 2) Metin — iki yoldan biri
node scripts/haber/metin.mjs $K --prompt     # çıktıyı Claude'a ver, dönen JSON'u
                                             # paketler/<id>/metin.json olarak kaydet
node scripts/haber/metin.mjs $K              # ya da ücretsiz LLM (anahtar gerekir)

# 3) Kaydırmalı post (6 slayt, 1080×1350)
node scripts/haber/carousel.mjs $K

# 4) Blog yazısı → siteye TASLAK olarak düşer
node --env-file=.env.local scripts/haber/yayinla.mjs $K
```

## İKİ ŞERİT — hangi haberde ne üretilir

Ölçüldü (30 Eylül 2026, sahip ziyaretleri ayıklanmış): **Türk şirketi haberi
yabancının ~40 katı okunuyor.** HubX 86 okunma; Crusoe 2, Vantora 1,
EnduroSat 0, Altis Labs 0. Sebebi arama: insanlar Türk kurucuyu ADIYLA
arıyor ("hubx kurucusu", "cem ortabaş kimdir"), yabancı kurucuyu aramıyor.

| | Yabancı girişim | 🇹🇷 Türk girişimi |
|---|---|---|
| Adım 1 — `varlik.mjs` (B-roll, foto) | **atla** | çalıştır |
| Adım 2 — metin | yaz | yaz |
| Adım 3 — `carousel.mjs` | **atla** | çalıştır |
| Adım 4 — `yayinla.mjs` | çalıştır (görselsiz) | çalıştır |

Kapak otomatik seçilir ama konuyu bilemez — egaranti'de en yüksek entropili
görseller ekip portreleriydi ve kapak, haberde adı geçmeyen bir kişinin
fotoğrafı oldu. Elle seç:

```bash
node scripts/haber/carousel.mjs $K --gorseller            # adayları listele
node scripts/haber/carousel.mjs $K --kapak 1              # carousel kapağı (numara)
node --env-file=.env.local scripts/haber/yayinla.mjs $K --kapak 20_appstore_02.jpg
```
Blog kapağı DOSYA ADI alır: iki araçtaki sıralama farklı, numara karıştırır.

Görselsiz yayın için paket klasörü gerekmez; yeterli olan `metin.json`.
Elle oluştur: `mkdir -p paketler/<id> && <metin.json yaz>`.

Türk girişimi **otomatik işaretlenir**: `topla.mjs` çıktısında satır başında
🇹🇷 çıkar ve koşunun sonunda ayrı bir uyarı basılır. Kayıtta `kunye.turk`.

Dedektörün sözcük dağarcığı genişledikçe eski kayıtlar yanlış kalıyor. Haftada
bir (Pazartesi 09:20) `turk-tara.yml` Türk kaynaklı son 60 günün kayıtlarını
yeniden okuyup işareti tazeliyor. Elle: `node scripts/haber/turk-tara.mjs --yaz`

> `kunye.ulke` bu iş için **kullanılamaz** — o alan KAYNAĞIN ülkesi. Webrazzi
> "TR" olduğu için Crusoe, EnduroSat, Vantora gibi ABD şirketleri de TR
> görünüyor. Gerçek işaret `turk.mjs` içinde ölçülüyor.

# 5) Yayın onayı — /admin/blog

Adım 4 yazıyı **canlıya çıkarmaz**, taslak olarak bırakır. Taslak `/blog`
listesinde ve sitemap'te görünmez, doğrudan URL'i 404 verir, anon anahtarla
sorgulansa bile RLS engeller.

`/admin/blog` panelinde her taslağın yanında:

| Düğme | Ne yapar |
|---|---|
| ↗ (dış bağlantı) | Taslağı şifreli önizleme bağlantısıyla açar (`?onizleme=…`, `noindex`) |
| ✎ | İçeriği düzenler — durumu değiştirmez |
| **Yayınla** | Siteye çıkarır: `/blog` listesine ve sitemap'e girer |
| **Taslağa al** | Yayındaki yazıyı siteden geri çeker (onay sorar) |

Yayındaki bir yazıyı `yayinla.mjs` ile yeniden basmak durumu bozmaz — yayında kalır.
Panelden elle açılan yeni yazılar da taslak doğar.

## Kuyruğu görmek

```bash
node scripts/haber/topla.mjs --domainsiz     # kuru koşu, yazmaz
node scripts/haber/topla.mjs --yaz           # kuyruğu güncelle
```

## Ayarlar

| Ne | Nasıl |
|---|---|
| Video süresi / hızı | `varlik.mjs $K --sure 12 --hiz 300` (varsayılan 8 sn, 340 px/sn) |
| Carousel kapak görseli | `carousel.mjs $K --gorseller` ile listele, `--kapak 6` ile seç |
| Blog'u yazmadan görmek | `yayinla.mjs $K --kuru` |
| Paket klasörü | `HABER_PAKET_DIR` ortam değişkeni (şu an Drive'a bağlı) |

## CI (bunu atlama)

`haber.yml` bilerek `npm install` yapmaz — toplayıcının sıfır bağımlılığı var.
Regresyon testi yanlışlıkla ağır bir modül import ederse (playwright-core,
@supabase/supabase-js) CI her koşuda `ERR_MODULE_NOT_FOUND` ile düşer ve
**haber toplama hiç çalışmaz**. Bu iki kez yaşandı: 13 Eylül (`varlik.mjs`),
29 Eylül (`gorsel.mjs` + `yazi.mjs`).

Kural: testin import ettiği her modül bağımlılıksız olacak. Saf fonksiyonlar
ayrı dosyalarda durur — `appstore.mjs`, `gorsel-govde.mjs`, `yazi-kapi.mjs`.

Test dosyasına dokunduktan sonra:

```bash
./scripts/haber/ci-kontrol.sh     # node_modules'ü gizleyip testleri koşar
```

## Testler

```bash
node scripts/haber/regresyon.test.mjs           # 26 test, ağ istemez
node scripts/haber/regresyon.test.mjs --canli   # + canlı RSS ölçümü
```

## Kurallar (bozma)

- **Rakamlara model dokunmaz.** Tutar, tur tipi, yatırımcı adı kuyruk kaydından mekanik basılır.
- **Model HTML yazmaz.** Blog gövdesini şablon üretir, model metni kaçırılmış olarak girer.
- **Uydurma engeli metne dayanır.** Modelin yazdığı her sayı ve özel ad kaynak makalede
  birebir geçmeli; geçmiyorsa o cümle düşer (`metin.mjs` → `dogrula`).
- **Makale metni saklanmaz.** Telif: o an çekilir, modele verilir, atılır. Kuyrukta yalnız
  olgular ve ≤200 karakterlik alıntılar durur.
- **Paketler repoya girmez** (`.gitignore`), blog görselleri girer (`public/haber/<slug>/`).

## Dosyalar

| Dosya | İşi |
|---|---|
| `topla.mjs` | 4 RSS → tur haberi ayıkla → künye → domain → `kuyruk/*.json` |
| `tur-haberi-mi.mjs` | Bu item bir yatırım turu haberi mi (derleme/M&A/fon kapanışı eler) |
| `kunye.mjs` | Tutar / para birimi / tur tipi / değerleme — regex, LLM yok |
| `kisiler.mjs` | Lider + katılan yatırımcılar, kurucular |
| `domain.mjs` | Şirket domaini + kimlik kapısı (yanlış şirketin sitesini eler) |
| `kuyruk.mjs` | Dedupe + puanlama + dosya yazımı |
| `varlik.mjs` | Kaydırma videosu + şirket fotoğrafları + App Store görselleri |
| `metin.mjs` | Carousel/blog yorum metinleri + uydurma engeli |
| `carousel.mjs` | 1080×1350 slaytlar |
| `yayinla.mjs` | Blog yazısı + `public/haber/<slug>/` görselleri |

---

## Fikir yazıları (haber dışı)

Eser'in kendi fikrinden yazı. Haber hattından ayrı, kaynağı bir haber değil.

```bash
# 1) Fikri Claude'a ver, o araştırıp yazsın → yazilar/<slug>.json
# 2) Yayınla:
node scripts/haber/yazi.mjs yazilar/<slug>.json --kuru          # önce gör
node --env-file=.env.local scripts/haber/yazi.mjs yazilar/<slug>.json
```

Görseller otomatik üretilir (`gorsel.mjs`): kontrol listesi, karşılaştırma tablosu,
akış şeması, alıntı kartı. Stok fotoğraf kullanılmaz — bunlar özgün ve markalı.

### Kaynak kapısı
Yazıda 2+ haneli sayı geçen cümle varsa `kaynaklar` listesi BOŞ olamaz; boşsa yayın
reddedilir. Fikir yazısı olması uydurma istatistik yazma izni değildir.

### Uzunluk hedefleri (2026 verisi)
| Tip | Hedef | Neden |
|---|---|---|
| `analiz` | 800–2200 | Klasik SEO 1.500-2.500 ister ama AI aramalarında alıntılananların %53,4'ü 1.000'in altında. Kısa taraf seçildi. |
| `rehber` | 1800–3000 | Adım adım anlatım yer ister |
| `liste` | 1000–1800 | |
| `haber` | 300–800 | Haber hattı bu bantta |

**Kural:** uzunluk sıralama getirmiyor, KAPSAM getiriyor. Dolgu yazma; kapsamı
soru-cevap bloğuyla genişlet (`sorular` alanı) — hem Google hem yapay zeka hem okur kazanır.

### Yazı JSON'unun alanları
`baslik` `slug` `tip` `seo_title` `seo_description` `bolumler[]` `sorular[]`
`kaynaklar[]` `cta_baslik` `cta` `cta_link` `cta_link_metin` `kapak_etiket` `kapak_metin`

`bolumler[]` tipleri: `h2` `h3` `p` `liste` `alinti` `ayrac` `gorsel`
**JSON'a HTML YAZMA** — kaçırılır ve okuyucuya ham etiket olarak görünür. Bağlar
`cta_link` gibi ayrı alanlarla verilir.
