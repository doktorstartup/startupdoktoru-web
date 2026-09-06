// Haber toplayıcı — DEDUPE + PUANLAMA + KUYRUK DOSYA DÜZENİ.
// Girdi: çıkarım katmanının ürettiği "aday" nesneleri. Bu dosya AĞ İSTEĞİ YAPMAZ,
// fonksiyonlar saf: metin/nesne girer, nesne çıkar. Sıfır bağımlılık (Node 22+).
// Kullanım: node scripts/haber/kuyruk.mjs adaylar.json [--yaz]
import { readFileSync, writeFileSync, readdirSync, mkdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";

export const SURUM = 1;
export const KUYRUK_DIR = "kuyruk";
const HAFIZA_DOSYA = "_hafiza.json";
const DOSYA_OMRU = 31;      // kuyruk dosyası: 30 gün + 1 gün pay (sınır günü kaybolmasın)
const GECMIS_PENCERE = 30;  // "bu şirketi zaten paketledik" bakışı — TEK AYAR DÜĞMESİ
// DÜZELTME: eskiden 180'di ve "45 gün sonraki takip tekrar paketlenmez" diye gerekçelendirilmişti.
// Yanlıştı: gecmisteVar() zaten GECMIS_PENCERE ile kesiyor, defterin 30 günü aşan kısmı hiç okunmuyordu.
// Defter penceresi artık bakış penceresini takip ediyor; süreyi uzatmak isteyen GECMIS_PENCERE'yi büyütür.
const HAFIZA_OMRU = GECMIS_PENCERE + 5;
const PENCERE_DOMAIN = 14;  // aynı domain kaç gün içinde aynı tur sayılır
const PENCERE_AD = 7;       // ad eşleşmesi kaç gün içinde aynı tur sayılır
const GUN = 86400000;

// ─────────────────────────── normalizasyon ───────────────────────────

// TUZAK (ölçüldü): "İ".toLowerCase() → "i" + U+0307 birleşen nokta üretir; string
// 1 karakter UZAR ve "İtoflow".toLowerCase() !== "itoflow" olur. Bu yüzden önce
// tabloyla katlıyoruz, sonra NFD + işaret temizliğiyle kalan aksanları düşürüyoruz.
const KATLA = { "İ":"i","I":"i","ı":"i","Ş":"s","ş":"s","Ğ":"g","ğ":"g","Ç":"c","ç":"c",
  "Ö":"o","ö":"o","Ü":"u","ü":"u","Ø":"o","ø":"o","Æ":"ae","æ":"ae","Å":"a","å":"a",
  "Þ":"th","þ":"th","Ð":"d","ð":"d","ß":"ss","Œ":"oe","œ":"oe","Ł":"l","ł":"l" };

export function duzle(s) {
  return (s ?? "").toString()
    .replace(/[İIıŞşĞğÇçÖöÜüØøÆæÅåÞþÐðßŒœŁł]/g, (c) => KATLA[c])
    .toLowerCase()
    .normalize("NFD").replace(/\p{M}/gu, "")   // é→e, ä→a, ñ→n …
    .replace(/[’'`´]/g, "")
    .replace(/\s+/g, " ").trim();
}

// Hukuki + kurumsal ek atma. Yalnız SON token'da ve tekrarlı:
// "İkas Yazılım A.Ş." → "ikas", "Volve AS" → "volve". Webrazzi tam ticari unvanı yazabiliyor,
// tech.eu markayı yazıyor; ek atılmazsa aynı şirket iki kayıt olur.
// Listeye YALNIZ jenerik kurumsal kelimeler girer — "Energy", "Care", "AI" gibi ayırt edici
// sektör kelimeleri KASITLI olarak dışarıda (Certain Energy ≠ Certain).
const EK = /[\s,.-]*\b(a\.?\s?s\.?|ltd\.?(\s?sti\.?)?|limited|inc\.?|llc|gmbh|ug|b\.?v\.?|n\.?v\.?|a\/s|aps|oyj|oy|ab|asa|as|s\.?a\.?s?\.?|sarl|spa|srl|plc|corp\.?|co\.?|kft|zoo|yazilim(lari)?|teknoloji(leri)?|bilisim|holding|technologies|software)\.?$/;

export function adNormal(s) {
  let a = duzle(s).replace(/^the\s+/, "");
  for (let i = 0; i < 3 && EK.test(a); i++) a = a.replace(EK, "").trim();
  return a.replace(/[^a-z0-9 ]+/g, "").replace(/\s+/g, " ").trim();
}

// Çok etiketli kamu son ekleri — "x.com.tr" iki değil üç etiketle kaydedilir.
const COK_ETIKET = new Set(["com.tr","org.tr","net.tr","edu.tr","gov.tr","co.uk","org.uk","ac.uk",
  "com.br","com.au","co.nz","co.il","co.za","com.mx","co.jp","com.sg","com.es","com.pl","co.in"]);

export function domainNormal(d) {
  if (!d) return "";
  let h = d.toString().trim().toLowerCase();
  if (h.includes("://")) { try { h = new URL(h).hostname; } catch { return ""; } }
  h = h.replace(/^www\./, "").split("/")[0].split(":")[0];
  const p = h.split(".").filter(Boolean);
  if (p.length < 2) return "";
  const son2 = p.slice(-2).join(".");
  // app.itoflow.ai → itoflow.ai ; ai.askclementine.com → askclementine.com
  return COK_ETIKET.has(son2) && p.length >= 3 ? p.slice(-3).join(".") : son2;
}

export const anahtarlar = (a) => ({ dom: domainNormal(a.sirket_domain), ad: adNormal(a.sirket_adi) });

// ─────────────────────────── dedupe ───────────────────────────

// DÜZELTME: geçersiz/eksik tarih eskiden ya çökertiyordu (kayitYap -> RangeError "Invalid time value")
// ya da isGunuFarki'yi 0 döndürüp habere MAKSİMUM tazelik puanı veriyordu. Tek kapıdan geçiriyoruz.
export function tarihNormal(t) {
  const d = new Date(t ?? NaN);
  return Number.isFinite(+d) ? d : null;
}
const gunFarki = (a, b) => {
  const x = tarihNormal(a), y = tarihNormal(b);
  return x && y ? Math.abs((x - y) / GUN) : Infinity;   // bilinmeyen tarih = "pencere dışı"
};
const tutarCelisir = (a, b) => {
  const x = a.tutar_usd, y = b.tutar_usd;
  return !!(x && y && Math.max(x, y) / Math.min(x, y) > 1.25); // kur çevrimine pay
};
const ulkeCelisir = (a, b) => !!(a.ulke && b.ulke && a.ulke !== b.ulke);

// İki adayın AYNI turu anlatıp anlatmadığı. Naif başlık token eşleşmesi %89 yanlış
// pozitif verdiği için başlığa hiç bakmıyoruz; yalnız künye alanlarına bakıyoruz.
export function ayniTur(a, b) {
  const A = anahtarlar(a), B = anahtarlar(b);
  const gun = gunFarki(a.tarih, b.tarih);
  // 1) İki tarafta da domain varsa KARAR domainindir. Farklı domain = farklı şirket,
  //    ad ne kadar benzerse benzesin birleştirme (jenerik ad tuzağı: Motion, Midas, HubX).
  // DÜZELTME: eskiden domain dalı çelişkiye HİÇ bakmıyordu (ad dalı bakıyordu) — asimetrikti.
  // Canlı veride sonucu: nvidia.com'un satın alma haberi ($12,9 mlr) ile çeyrek geliri haberi
  // ($96,2 mlr) tek "tur" olarak birleşti. Aynı şirketin 14 gün içindeki İKİ AYRI haberi
  // aynı tur değildir; tutar çelişiyorsa ayrı tutuyoruz.
  if (A.dom && B.dom)
    return A.dom === B.dom && gun <= PENCERE_DOMAIN && !tutarCelisir(a, b) ? "domain" : "";
  // 2) En az bir tarafta domain yok (ör. arcticstartup gövdesinde çoğu turda hiç dış link yok):
  //    ad + tarih penceresi, ama ÇELİŞEN kanıt varsa hayır. Eksik kanıt engellemez.
  if (!A.ad || A.ad !== B.ad || gun > PENCERE_AD) return "";
  if (tutarCelisir(a, b) || ulkeCelisir(a, b)) return "";
  return "ad";
}

// Aynı koşudaki adayları gruplar. n küçük (~60), O(n²) yeterli (ölçüldü: 500 aday 179 ms).
export function grupla(adaylar) {
  const gruplar = [];
  for (const a of adaylar) {
    const g = gruplar.find((grp) => grp.uyeler.some((u) => ayniTur(u, a)));
    if (g) g.uyeler.push(a); else gruplar.push({ uyeler: [a] });
  }
  return gruplar;
}

// ─────────────────────────── puanlama ───────────────────────────
// Ağırlıkların gerekçesi README/rapor'da; toplam tavan 100.
// DÜZELTME: düz nesne sözlükte tur_tipi "constructor"/"toString" gelirse Object.prototype'tan
// FONKSİYON dönüyordu; `?? 6` bunu yakalamıyor ve puan "20function Object()..." gibi bir STRING oluyordu.
// Prototipsiz tablo + sayı doğrulaması ile kapatıldı.
const KAYNAK_PUAN = Object.assign(Object.create(null),
  { "eu-startups": 6, "tech.eu": 5, "webrazzi": 4, "arcticstartup": 3 });
const TUR_PUAN = Object.assign(Object.create(null),
  { "pre-seed": 20, "seed": 16, "series-a": 9, "series-b": 5, "series-c": 3, "growth": 3, "bilinmiyor": 6 });
const tabloda = (t, k, varsayilan) => (typeof t[k] === "number" ? t[k] : varsayilan);

// Hafta sonu 2 gün sıfır haber geliyor (ölçüldü: 4 kaynakta da en yeni item Cuma).
// Takvim günüyle eskitirsek Pazartesi sabahı Cuma haberi 3 günlük görünür ve dibe düşer.
// Bu yüzden tazelik İŞ GÜNÜ ile ölçülür.
export function isGunuFarki(tarih, simdi) {
  const d = tarihNormal(tarih), son = tarihNormal(simdi);
  if (!d || !son) return Infinity;   // tarihi bilinmeyen habere tazelik puanı YOK
  if (!(d < son)) return 0;
  let n = 0;
  for (let i = 0; i < 60 && d < son; i++) {
    d.setUTCDate(d.getUTCDate() + 1);
    const g = d.getUTCDay();
    if (g !== 0 && g !== 6) n++;
  }
  return n;
}

const trMi = (a) => a.ulke === "TR" || /\.tr$/.test(domainNormal(a.sirket_domain));
const buyukluk = (usd) => (Number.isFinite(usd) && usd > 0)
  ? Math.max(0, Math.min(12, Math.round((Math.log10(usd) - 5) * 4))) : 0;   // negatif/NaN -> 0 (eskiden NaN)
const tazelik = (t, simdi) => [12, 12, 9, 6, 3][isGunuFarki(t, simdi)] ?? 0;

export function puanla(a, simdi = new Date()) {
  const kaynaklar = a.kaynaklar?.length ? a.kaynaklar : [{ ad: a.kaynak }];
  const k = {
    // doluluk (0-30): ölçülen çıkarım güvenine göre ağırlıklı — tutar %100, tur %80-96,
    // lider F1 .83, kurucu F1 .64. Güvenilir ve künyeyi taşıyan alan daha çok puan alır.
    alan_tutar: Number.isFinite(a.tutar_usd) && a.tutar_usd > 0 ? 10 : 0,
    alan_tur: a.tur_tipi && a.tur_tipi !== "bilinmiyor" ? 10 : 0,
    alan_lider: a.lider ? 5 : 0,
    alan_kurucu: a.kurucular?.length ? 5 : 0,
    tur_uygunluk: tabloda(TUR_PUAN, a.tur_tipi, 6),   // 0-20: okur pre-seed kurucusu
    tr: trMi(a) ? 20 : 0,                       // 0-20
    buyukluk: buyukluk(a.tutar_usd),            // 0-12, logaritmik
    tazelik: tazelik(a.tarih, simdi),           // 0-12, iş günü
    kaynak: Math.max(...kaynaklar.map((x) => tabloda(KAYNAK_PUAN, x?.ad, 2))), // 0-6, eşitlik bozucu
  };
  const puan = Object.values(k).reduce((x, y) => x + y, 0);
  // Künye kapısı: tutar da tur tipi de yoksa yazılacak paket yok.
  // DÜZELTME: eskiden `!a.tur_tipi` idi; kayitYap "bilinmiyor" (truthy) yazdığı için kapı hep açıktı.
  return { puan, kirilim: k,
    kunye_eksik: !(Number.isFinite(a.tutar_usd) && a.tutar_usd > 0)
      && (!a.tur_tipi || a.tur_tipi === "bilinmiyor") };
}

// ─────────────────────────── kuyruk kaydı ───────────────────────────

export const slug = (ad) =>
  adNormal(ad).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "isimsiz";

const ALINTI_MAX = 200, ALINTI_ADET = 2;
const AD_MAX = 120;          // DÜZELTME: ad/lider/kurucu alanlarına sınır yoktu; 300 KB'lık tek kayıt üretilebiliyordu
const LISTE_MAX = 12;

// DÜZELTME: aynı gün + aynı slug = aynı dosya adı. hubx.co ile hubx.com'u ayırmanın
// bütün anlamı, ikisini de "2026-08-25_hubx.json"a yazınca kayboluyordu (biri sessizce eziliyordu).
// 4 haneli kararlı kimlik eki (domain, yoksa normalize ad) çakışmayı kapatıyor.
function kimlikEki(dom, ad) {
  let h = 0x811c9dc5;
  for (const c of String(dom || ad || "?")) { h ^= c.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, "0").slice(0, 4);
}
const kirp = (s) => { const t = (s ?? "").toString().replace(/\s+/g, " ").trim();
  return t.length <= ALINTI_MAX ? t : t.slice(0, ALINTI_MAX - 1).replace(/\s\S*$/, "") + "…"; };
// DÜZELTME: ad/lider/kurucu alanları çıkarım katmanından geldiği gibi yazılıyordu — uzunluk sınırı yoktu.
// NOT: bu bir UZUNLUK sınırı, içerik doğrulaması değil. Uydurma kurucu adını elemek çıkarım
// katmanının işi; burada yapılan tek şey dusuk_guven ile işaretlemek.
const kirpAd = (s) => { const t = (s ?? "").toString().replace(/\s+/g, " ").trim(); return t ? t.slice(0, AD_MAX) : null; };
const kirpListe = (a) => (Array.isArray(a) ? a : []).map(kirpAd).filter(Boolean).slice(0, LISTE_MAX);

// Bir gruptan tek kayıt. Birincil = en dolu aday; eksik alanlar diğerlerinden tamamlanır.
export function kayitYap(grup, simdi = new Date()) {
  const uyeler = [...grup.uyeler].sort((x, y) => puanla(y, simdi).puan - puanla(x, simdi).puan);
  const b = uyeler[0];
  const ilk = (f) => uyeler.map((u) => u[f]).find((v) => v && (!Array.isArray(v) || v.length));
  // DÜZELTME: deger/birim/usd alan alan toplanınca farklı kaynaklardan karışıyordu
  // (ölçüldü: {deger:8.2, birim:"EUR", usd:8_640_000} — 8,2 EUR'nun karşılığı o değil).
  // Tutar üçlüsü TEK üyeden alınır.
  const tutarUye = uyeler.find((u) => Number.isFinite(u.tutar_usd) && u.tutar_usd > 0)
    ?? uyeler.find((u) => u.tutar_deger) ?? {};
  const p = puanla({ ...b,
    sirket_domain: ilk("sirket_domain"), tutar_usd: ilk("tutar_usd"), tur_tipi: ilk("tur_tipi"),
    lider: ilk("lider"), kurucular: ilk("kurucular"), ulke: ilk("ulke"),
    kaynaklar: uyeler.map((u) => ({ ad: u.kaynak })) }, simdi);
  // DÜZELTME: tek bir geçersiz pubDate tüm koşuyu RangeError ile çökertiyordu.
  const zamanlar = uyeler.map((u) => tarihNormal(u.tarih)).filter(Boolean).map(Number);
  const tarih = new Date(zamanlar.length ? Math.min(...zamanlar) : +simdi).toISOString();
  const dom = domainNormal(ilk("sirket_domain")) || null;
  const ad = kirpAd(ilk("sirket_adi"));
  return {
    surum: SURUM,
    id: `${tarih.slice(0, 10)}_${slug(ad)}-${kimlikEki(dom, adNormal(ad))}`,
    durum: p.kunye_eksik ? "eksik" : "hazir",
    puan: p.puan,
    puan_kirilimi: p.kirilim,
    kunye: {
      sirket: ad,
      domain: dom,
      ulke: kirpAd(ilk("ulke")),
      tur_tipi: tabloda(TUR_PUAN, ilk("tur_tipi"), null) === null ? "bilinmiyor" : ilk("tur_tipi"),
      tutar: { deger: tutarUye.tutar_deger ?? null, birim: tutarUye.tutar_birim ?? null,
               usd: Number.isFinite(tutarUye.tutar_usd) && tutarUye.tutar_usd > 0 ? tutarUye.tutar_usd : null },
      lider: kirpAd(ilk("lider")),
      katilanlar: kirpListe(ilk("katilanlar")),
      kurucular: kirpListe(ilk("kurucular")),
      sektor: kirpAd(ilk("sektor")),
      tarih,
    },
    // Ölçülen F1'i düşük alanlar insan gözüne işaretlenir (kurucu .64, katılan .72).
    dusuk_guven: ["kurucular", "katilanlar"].filter((f) => (ilk(f) ?? []).length),
    kaynaklar: uyeler.map((u) => ({ ad: u.kaynak, url: u.url, baslik: kirp(u.baslik), tarih: u.tarih })),
    // TELİF: tam metin YAZILMAZ. En fazla 2 adet, 200 karakterlik alıntı.
    alintilar: uyeler.flatMap((u) => (u.alintilar ?? []).map((x) => ({ metin: kirp(x), kaynak_url: u.url })))
      .slice(0, ALINTI_ADET),
    olusturma: simdi.toISOString(),
  };
}

// ─────────────────────────── hafıza + budama ───────────────────────────
// Dosya 31 günde silinir AMA hafıza kaybolmaz: anahtarlar (domain+ad) kuyruğa
// YAZILIRKEN ince bir deftere de işlenir. Defter olgu/alıntı taşımaz, satır başına ~95 bayt.
// Defterin ömrü GECMIS_PENCERE'yi takip eder (bkz. HAFIZA_OMRU): bakış penceresinin dışındaki
// satır zaten hiç okunmuyor, tutmak sadece dosyayı şişirirdi.
export const hafizaYolu = (dir = KUYRUK_DIR) => join(dir, HAFIZA_DOSYA);
export function hafizaOku(dir = KUYRUK_DIR) {
  try { return JSON.parse(readFileSync(hafizaYolu(dir), "utf8")); } catch { return { surum: SURUM, kayitlar: [] }; }
}
// Satır başına BİR şirket: git diff'i yeni şirket başına tek satır gösterir.
function hafizaYaz(dir, h) {
  const satirlar = h.kayitlar.map((r) => "  " + JSON.stringify(r)).join(",\n");
  writeFileSync(hafizaYolu(dir), `{"surum":${SURUM},"kayitlar":[\n${satirlar}\n]}\n`);
}

// DÜZELTME (en ciddi hata): eskiden domain VEYA ad eşleşmesi yeterliydi. ayniTur()'un
// "iki tarafta da domain varsa KARAR DOMAİNİN" kuralı burada uygulanmıyordu; sonuçta
// hubx.co ile hubx.com, motion.one ile usemotion.com geçmiş kapısında birbirini eziyor,
// ikinci şirket "30 gün içinde paketlendi" denip SESSİZCE düşüyordu. Kural aynen taşındı.
export function gecmisteVar(hafiza, aday, simdi = new Date(), gun = GECMIS_PENCERE) {
  const A = anahtarlar(aday);
  return hafiza.kayitlar.find((h) => {
    if (gunFarki(h.tarih, simdi) > gun) return false;
    if (A.dom && h.dom) return h.dom === A.dom;   // iki tarafta da domain var -> karar domainin
    return !!A.ad && h.ad === A.ad;               // en az bir taraf domainsiz -> ad
  });
}

// Budama: ÖNCE dedupe/yazma, SONRA budama. 31 günlük kesim sınır gününü korur.
export function buda(dir = KUYRUK_DIR, simdi = new Date()) {
  const hafiza = hafizaOku(dir);
  const silinen = [];
  let dosyalar = [];
  try { dosyalar = readdirSync(dir); } catch { return { silinen, hafiza_boyu: hafiza.kayitlar.length }; }
  for (const f of dosyalar.filter((f) => f.endsWith(".json") && f !== HAFIZA_DOSYA)) {
    const t = f.slice(0, 10);
    // gunFarki artık geçersiz tarihte Infinity dönüyor: adı bozuk dosya sonsuza dek kalmasın diye budanır.
    if (gunFarki(t, simdi) > DOSYA_OMRU) { unlinkSync(join(dir, f)); silinen.push(f); }
  }
  hafiza.kayitlar = hafiza.kayitlar.filter((h) => gunFarki(h.tarih, simdi) <= HAFIZA_OMRU);
  hafizaYaz(dir, hafiza);
  return { silinen, hafiza_boyu: hafiza.kayitlar.length };
}

// ─────────────────────────── akış ───────────────────────────

export function isle(adaylar, { dir = KUYRUK_DIR, simdi = new Date(), yaz = false } = {}) {
  const hafiza = hafizaOku(dir);
  const gruplar = grupla(Array.isArray(adaylar) ? adaylar : []);
  const kullanilanId = new Set();
  const yeni = [], atlanan = [];
  for (const g of gruplar) {
    const k = kayitYap(g, simdi);
    const eski = gecmisteVar(hafiza, { sirket_domain: k.kunye.domain, sirket_adi: k.kunye.sirket, tarih: k.kunye.tarih }, simdi);
    if (eski) { atlanan.push({ id: k.id, neden: `${GECMIS_PENCERE} gün içinde paketlendi (${eski.dosya})` }); continue; }
    if (k.durum === "eksik") { atlanan.push({ id: k.id, neden: "künye eksik (tutar ve tur tipi yok)" }); continue; }
    // Son emniyet: kimlik eki her şeye rağmen çakışırsa üzerine yazma, ayır.
    if (kullanilanId.has(k.id)) { let n = 2; while (kullanilanId.has(`${k.id}-${n}`)) n++; k.id = `${k.id}-${n}`; }
    kullanilanId.add(k.id);
    yeni.push(k);
    hafiza.kayitlar.push({ dom: k.kunye.domain, ad: adNormal(k.kunye.sirket), tarih: k.kunye.tarih.slice(0, 10), dosya: `${k.id}.json` });
  }
  yeni.sort((a, b) => b.puan - a.puan);
  if (yaz) {
    mkdirSync(dir, { recursive: true });
    for (const k of yeni) writeFileSync(join(dir, `${k.id}.json`), JSON.stringify(k, null, 2) + "\n");
    hafizaYaz(dir, hafiza);
    buda(dir, simdi);
  }
  return { gruplar: gruplar.length, yeni, atlanan };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dosya = process.argv[2];
  if (!dosya) { console.error("Kullanım: node scripts/haber/kuyruk.mjs adaylar.json [--yaz]"); process.exit(1); }
  let girdi;
  try { girdi = JSON.parse(readFileSync(dosya, "utf8")); }
  catch (e) { console.error(`Girdi okunamadı (${dosya}): ${e.message}`); process.exit(1); }
  const s = isle(girdi, { yaz: process.argv.includes("--yaz") });
  console.log(`${s.gruplar} grup → ${s.yeni.length} kuyruk kaydı, ${s.atlanan.length} atlandı`);
  for (const k of s.yeni) console.log(`  ${String(k.puan).padStart(3)}  ${k.id}  (${k.kaynaklar.length} kaynak)`);
  for (const a of s.atlanan) console.log(`  ---  ${a.id}: ${a.neden}`);
}
