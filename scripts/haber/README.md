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

# 4) Blog yazısı + görseller
node --env-file=.env.local scripts/haber/yayinla.mjs $K
```

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
