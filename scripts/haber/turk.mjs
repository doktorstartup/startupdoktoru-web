// ŞİRKET TÜRK MÜ? — saf fonksiyon, hiçbir bağımlılığı yok.
//
// NEDEN: ölçüldü, Türk şirketi haberi yabancı şirket haberinin ~40 katı
// okunuyor (HubX 86 okunma; Crusoe/EnduroSat/Vantora 0-2). Sebebi arama:
// insanlar Türk kurucuyu ADIYLA arıyor, yabancı kurucuyu aramıyor. O yüzden
// Türk turu çıktığı gün tam paket (B-roll + carousel) üretilir; yabancı tur
// yalnız metin olarak yayınlanır.
//
// kunye.ulke BU İŞ İÇİN KULLANILAMAZ: o alan KAYNAĞIN ülkesi. Webrazzi "TR"
// olduğu için Crusoe, EnduroSat, Vantora gibi ABD şirketleri de TR görünüyor.

const SEHIRLER =
  "İstanbul|Istanbul|Ankara|İzmir|Izmir|Bursa|Antalya|Kocaeli|Konya|Adana|Gaziantep|Eskişehir|Eskisehir|Denizli|Kayseri|Samsun|Trabzon|Mersin";

// Kesme işareti üç biçimde geçiyor: düz ('), sağ tek tırnak (’) ve yok.
const K = "['’]?";

// \b KULLANILAMAZ: sınırı [A-Za-z0-9_]'e göre tanımlı ve "İ" ile "ş" \w değil.
// \bİstanbul hiç eşleşmiyordu — HubX'i ("İzmir'de kurulan") bu yüzden kaçırdık.
// Unicode harf sınırı: öncesinde ve sonrasında harf/rakam olmasın.
const BAS = "(?<![\\p{L}\\p{N}])";
const SON = "(?![\\p{L}\\p{N}])";

// GÜÇLÜ işaretler — tek başına yeterli. Hepsi şirketin KURULUŞ YERİNİ ya da
// merkezini söylüyor; "İstanbul'a açılıyor" gibi genişleme cümleleri değil.
const GUCLU = [
  new RegExp(`${BAS}(?:${SEHIRLER})${K}(?:de|da|te|ta)\\s+kurul`, "iu"),      // "İzmir'de kurulan HubX"
  new RegExp(`${BAS}(?:${SEHIRLER})\\s+merkezli${SON}`, "iu"),                    // "İstanbul merkezli"
  new RegExp(`${BAS}Türkiye\\s+merkezli${SON}`, "iu"),
  new RegExp(`${BAS}Türkiye${K}(?:de|nin)\\s+[^.]{0,40}kurul`, "iu"),
  new RegExp(`${BAS}Türk\\s+girişim`, "iu"),
  new RegExp(`${BAS}(?:${SEHIRLER})-based${SON}`, "iu"),                          // "Istanbul-based"
  new RegExp(`${BAS}Turkey-based${SON}`, "iu"),
  new RegExp(`${BAS}Turkish\\s+(?:startup|company|firm|fintech|scale-?up|founder)`, "iu"),
  // "Ankara'da ODTÜ TEKNOKENT bünyesinde FAALİYET GÖSTEREN M-Based" — Webrazzi
  // bunu "merkezli" kadar sık kullanıyor ve listede yoktu; M-Based bu yüzden
  // yabancı işaretlendi. Araya kısa bir öbek girebiliyor ("… bünyesinde").
  new RegExp(`${BAS}(?:${SEHIRLER})${K}(?:de|da|te|ta)\\s[^.]{0,60}?faaliyet\\s+göster`, "iu"),
  new RegExp(`${BAS}Türkiye${K}(?:de|da)\\s[^.]{0,60}?faaliyet\\s+göster`, "iu"),
  // Türk teknoparkları: yabancı bir şirket bunların "bünyesinde" olmaz.
  new RegExp(`${BAS}(?:TEKNOKENT|Teknokent|Teknopark|Teknoparkı)${SON}`, "u"),
  new RegExp(`${BAS}(?:ODTÜ|Boğaziçi|İTÜ|Bilkent|Sabancı|Koç)\\s+(?:TEKNOKENT|Teknokent|Teknopark|Çekirdek)`, "iu"),
];

// ZAYIF işaretler — tek başına yetmez, ikisi birden gerekir. Yabancı bir şirket
// de Türkiye'de ofis açabilir ya da bir Türk yatırımcı turda yer alabilir.
const ZAYIF = [
  new RegExp(`${BAS}(?:${SEHIRLER})${K}(?:daki|deki|taki|teki)\\s+ofis`, "iu"), // "İzmir ve İstanbul'daki ofisleri"
  new RegExp(`${BAS}Anonim\\s+Şirketi\\b|\\bA\\.\\s?Ş\\.(?:\\s|,|$)`, "iu"),
  new RegExp(`${BAS}(?:${SEHIRLER})${K}(?:de|da|te|ta)\\s+(?:ofis|merkez|genel merkez)`, "iu"),
  // Türk kurumsal işaretleri. Yabancı şirket haberinde de bağlam olarak
  // geçebildiği için tek başına yetmez.
  new RegExp(`${BAS}Girişim\\s+Sermayesi\\s+Yatırım\\s+Fonu${SON}`, "iu"),
  new RegExp(`${BAS}(?:TÜBİTAK|KOSGEB|TTGV|TÜBITAK)${SON}`, "u"),
];

/**
 * @param {string} metin   makale düz metni (toplama anında elde var)
 * @param {string} domain  doğrulanmış şirket domaini
 * @returns {{turk: boolean, neden: string[]}}
 */
export function turkMu(metin, domain) {
  const m = String(metin ?? "");
  const d = String(domain ?? "").toLowerCase();
  const neden = [];

  if (/\.tr$/.test(d)) neden.push(`domain ${d}`);
  for (const re of GUCLU) {
    const e = re.exec(m);
    if (e) { neden.push(e[0].trim().slice(0, 40)); break; }
  }
  if (neden.length) return { turk: true, neden };

  const zayifVuran = [];
  for (const re of ZAYIF) {
    const e = re.exec(m);
    if (e) zayifVuran.push(e[0].trim().slice(0, 40));
  }
  if (zayifVuran.length >= 2) return { turk: true, neden: zayifVuran };
  return { turk: false, neden: zayifVuran };
}
