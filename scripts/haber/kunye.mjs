// Haber künyesi çıkarımı — tutar / para birimi / tur tipi / değerleme / enstrüman.
// Toplayıcının doğruluk omurgası: bu alanlar LLM'e YAZDIRILMAZ, regex çıkarır, şablona slot olarak basılır.
// Saf fonksiyon: metin girer, nesne çıkar. Ağ isteği yok, npm bağımlılığı yok (Node 22 yerleşikleri).
//
// Kullanım:
//   import { kunyeCikar, normalizeMetin } from "./kunye.mjs";
//   const k = kunyeCikar(item.contentEncoded, item.title);

// ---------------------------------------------------------------- normalizasyon
// SIRA ÖNEMLİ: script/style sil -> blok etiketlerini boşluğa çevir -> etiket sil -> entity çöz -> boşluk sıkıştır.
// Entity çözümü atlanırsa "&#8217;" içeren doğru alıntı bile substring testinde FAIL eder.
const ENTITY = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", hellip: "…",
  ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”",
  euro: "€", pound: "£", cent: "¢", deg: "°", middot: "·", laquo: "«", raquo: "»",
};

function entityCoz(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+\d*);/gi, (m, n) => ENTITY[n] ?? ENTITY[n.toLowerCase()] ?? m);
}

export function normalizeMetin(html) {
  let t = String(html ?? "");
  t = t.replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ");
  t = t.replace(/<br\s*\/?>/gi, " ").replace(/<\/(p|div|li|tr|h[1-6])>/gi, " ");
  t = t.replace(/<[^>]+>/g, " ");
  t = entityCoz(t);
  t = t.replace(/[\s ​]+/g, " ").trim();
  // WordPress kuyrugu: "The post <baslik> appeared first on X." basligi govdeye kopyalar;
  // temizlenmezse ayni rakam ikinci kez, baglamsiz bicimde aday olur.
  return t.replace(/\s*The post .*? appeared first on [^.]{0,60}\.\s*$/i, "").trim();
}

// ---------------------------------------------------------------- para yakalama
const SEMBOL = { $: "USD", "€": "EUR", "£": "GBP", "₺": "TRY" };
const KOD = {
  usd: "USD", "us$": "USD", dollar: "USD", dollars: "USD", dolar: "USD",
  eur: "EUR", euro: "EUR", euros: "EUR", avro: "EUR",
  gbp: "GBP", pound: "GBP", pounds: "GBP", sterlin: "GBP",
  try: "TRY", tl: "TRY", lira: "TRY", liras: "TRY",
  nok: "NOK", sek: "SEK", dkk: "DKK", chf: "CHF", pln: "PLN", kron: "NOK",
};
const OLCEK = {
  k: 1e3, bin: 1e3, thousand: 1e3,
  m: 1e6, mn: 1e6, mio: 1e6, million: 1e6, millions: 1e6, milyon: 1e6,
  b: 1e9, bn: 1e9, billion: 1e9, milyar: 1e9,
  tn: 1e12, trillion: 1e12, trilyon: 1e12,
};
// Desteklenen para birimleri (çıktıda bunlar tercih edilir); NOK/SEK/DKK vb. yalnız çeviri parantezinde geçer.
const HEDEF_BIRIM = new Set(["USD", "EUR", "GBP", "TRY"]);

const PARA_RE = new RegExp(
  "(?:(?<sim>[$€£₺])\\s*|\\b(?<kodOn>US\\$|USD|EUR|GBP|TRY|TL|NOK|SEK|DKK|CHF|PLN)\\s+)?" +
  "(?<sayi>\\d{1,3}(?:[.,]\\d{3})+(?:[.,]\\d+)?|\\d+(?:[.,]\\d+)?)" +
  "\\s*(?<olcek>million[s]?|billion|trillion|thousand|milyon\\w*|milyar\\w*|trilyon\\w*|bin\\b|bn\\b|mn\\b|mio\\b|k\\b|m\\b|b\\b)?" +
  "\\s*(?<kodSon>US\\$|USD|EUR|GBP|TRY|NOK|SEK|DKK|CHF|PLN|dollar\\w*|dolar\\w*|euro\\w*|avro\\w*|pound\\w*|sterlin\\w*|TL['’]?\\w*|liras\\w*|kron\\w*)?",
  "giu",
);

// Sayı biçimi çözümü. Kural: iki ayraç varsa SONUNCUSU ondalıktır; tek ayraç varsa
// ardından tam 3 hane geliyorsa binlik, aksi halde ondalıktır. ("€1.6 million"=1.6, "1,600"=1600)
function sayiCoz(ham) {
  const s = ham.trim();
  const sonNokta = s.lastIndexOf("."), sonVirgul = s.lastIndexOf(",");
  if (sonNokta > -1 && sonVirgul > -1) {
    const ond = Math.max(sonNokta, sonVirgul);
    return Number(s.slice(0, ond).replace(/[.,]/g, "") + "." + s.slice(ond + 1));
  }
  const ayrac = sonNokta > -1 ? "." : sonVirgul > -1 ? "," : null;
  if (!ayrac) return Number(s);
  const adet = s.split(ayrac).length - 1;
  const kuyruk = s.length - s.lastIndexOf(ayrac) - 1;
  if (adet > 1 || kuyruk === 3) return Number(s.replace(/[.,]/g, ""));
  return Number(s.replace(ayrac, "."));
}

function birimCoz(g) {
  if (g.sim) return SEMBOL[g.sim];
  for (const raw of [g.kodOn, g.kodSon]) {
    if (!raw) continue;
    const k = raw.toLowerCase().replace(/['’]/g, "");
    if (KOD[k]) return KOD[k];
    for (const [ad, kod] of Object.entries(KOD)) if (k.startsWith(ad) && ad.length > 2) return kod;
  }
  return null;
}

// Metindeki tüm para geçişleri. 50.000 altı ve para birimi belirsiz olanlar elenir.
function paraGecisleri(N) {
  const out = [];
  PARA_RE.lastIndex = 0;
  for (const m of N.matchAll(PARA_RE)) {
    const g = m.groups;
    const birim = birimCoz(g);
    if (!birim) continue;
    const olcekAd = g.olcek ? g.olcek.toLowerCase().replace(/^(milyon|milyar|trilyon)\w*$/, "$1") : null;
    const carpan = olcekAd ? (OLCEK[olcekAd] ?? 1) : 1;
    const deger = Math.round(sayiCoz(g.sayi) * carpan);
    if (!Number.isFinite(deger) || deger < 50_000) continue;
    out.push({ deger, birim, ham: m[0].trim(), i: m.index, j: m.index + m[0].length });
  }
  return out;
}

// ---------------------------------------------------------------- cümle / alıntı
function cumleAraliklari(N) {
  const par = [];
  let bas = 0;
  const re = /[.!?…](?=\s)|[.!?…]$/g;
  for (const m of N.matchAll(re)) {
    const son = m.index + 1;
    // "Dr.", "No.", "vs." gibi kısaltmalarda bölme.
    if (/\b(Dr|Mr|Mrs|Ms|Prof|St|No|vs|Inc|Ltd|Co|Sn|Av|Op)\.$/.test(N.slice(bas, son))) continue;
    par.push([bas, son]);
    bas = son + 1;
  }
  if (bas < N.length) par.push([bas, N.length]);
  return par;
}

function cumleBul(araliklar, i) {
  for (const [a, b] of araliklar) if (i >= a && i < b) return [a, b];
  return [Math.max(0, i - 160), i + 160];
}

// Alıntı: geçişi içeren cümle. Cümle 340 karakteri aşarsa geçişin çevresinden pencere alınır.
function alintiYap(N, aralik, i, j) {
  let [a, b] = aralik;
  if (b - a > 340) {
    a = Math.max(a, i - 150); b = Math.min(b, j + 150);
    while (a > 0 && !/\s/.test(N[a - 1])) a--;
    while (b < N.length && !/\s/.test(N[b])) b++;
  }
  return N.slice(a, b).trim();
}

// ---------------------------------------------------------------- kural tablosu
// Pozitifler geniş pencerede (tur bağlamı yayılır), negatifler CÜMLE İÇİNDE aranır
// (kümülatif/değerleme/pazar ifadeleri sayıya cümle içinde yapışır).
const POZITIF = [
  [3, /\b(raised|raises|raise|securing|secured|secures|lands|landed|closed|closes|closing|received|receives|receive|bagged|bags|backed by|investment from|led by|led the round|co-led)\b/i],
  [3, /\b(funding|financing|investment)\s+(round|of|from|to build|to scale)\b|\bin\s+(?:a|an|its|the|new)?\s*(pre-?seed|seed|series\s+[a-h]|growth|bridge|equity|grant)\b|\b(pre-?seed|seed|series\s+[a-h])\s+(round|funding|financing|investment|extension)\b|\bin\s+funding\b/i],
  [3, /yatırım al\w+|yatırım tur\w+|turuna liderlik|yatırımı\w* al\w+|fon\w* aldı|yatırım yaptı/i],
  [2, /\b(round|turu|turuna)\b/i],
];

const NEGATIF = [
  // kümülatif toplam — "bringing its total raised to $X"
  [9, /\b(total|cumulative)\s+(raised|funding|investment|capital|financing)\b|bring\w*\s+(its|their|the)\s+total|\btotal\s+(raised|funding)\s+to\b|\braised to date\b|\bto date\b/i],
  [9, /toplam (yatırım|finansman|fon|sermaye)\w*|toplamda\b|bugüne kadar\w*\s+\w*\s*(yatırım|topla)/i],
  // pazar / sektör büyüklüğü
  [8, /\b(market|industry|sector)\b[^.]{0,45}\b(worth|size|valued)\b|\bworth\b[^.]{0,30}\b(annually|globally|worldwide)\b|\bin annual\b|\bannual (investment|spend|revenue|turnover)\b|representing an industry/i],
  [8, /\bpazar\w*|sektör\w* büyüklüğü|yıllık (gelir|ciro|pazar)/i],
  // geçmiş tur / önceki haber
  [7, /\b(previous(ly)?|prior|earlier|back in|last year|in 20[0-2]\d\b|since 20[0-2]\d|following a)\b/i],
  [7, /daha önce|önceki|geçen yıl|\b20[0-2]\d yılında(?!\s*kurul)|\b20[0-2]\d['’]\w*|aktarmıştık|duyurmuştuk/i],
  // başka şirketlerin turları / derleme paragrafı
  [7, /\b(comparable announcements|adjacent announcements|has reported|ranging from|respectively|such as|including)\b/i],
  [7, /\bpledged?\b|\b(public|federal|state|regional|EU)\s+funding\b|\bcommitments?\b/i],
  // proje bütçesi
  [6, /\b(project budget|total budget|budget of)\b|proje bütçesi|toplam bütçe/i],
  // tur değil: gelir, satın alma, anlaşma, halka arz, dava
  [9, /\brevenue\b|\bacquisitions?\b|\bacquired?\b|\bacquires\b|\bbuy\b|\bpurchase\b|\bsettlement\b|\bIPO\b|\blisting\b|\bin cash\b|at closing|\btransaction\b|\bearnings\b/i],
  [9, /\bgelir\b|\bciro\b|satın al\w+|anlaşma\S*\s+imzala|ödeme yapa|\bdava\w*|halka arz|net kâr/i],
  // fon/yatırımcı haberi (şirket turu değil)
  [8, /\b(venture firm|venture fund|the fund|its fund|fund i{1,3}\b|first close|to invest into|to invest in|invests? in european)\b/i],
];

// Değerleme negatifleri AYRI: aynı cümlede ayrı bir geçiş zaten değerleme olarak seçildiyse
// kalan rakamlar bu cezadan MUAF tutulur ("2,4 milyar dolar değerleme üzerinden 120 milyon dolar yatırım aldı").
const NEGATIF_DEGERLEME = [
  [9, /\bvaluation\b|\bvalued at\b|\bvalues\s+\w+\s+at\b|pre-?money|post-?money|market cap/i],
  [9, /değerleme\w*|değerlemesi\w*|değeri üzerinden/i],
];

// Belge düzeyi kapı: fon kuruluşu / haftalık derleme / listeleme haberi ise tüm adaylar kırılır.
const BELGE_KAPI = /\b(venture firm|venture fund|vc (firm|fund)|launch\w*\s+(a\s+)?(vc|venture|fund)|(clos\w+|rais\w+|launch\w+|secur\w+)\s+(its|their|the)\s+(\w+\s+){0,2}fund\b|fund (i{1,3}|iv|v)\b|first close|debut fund|weekly funding|weekly recap|tech weekly|round-?up|top-?funded|most funded)\b|fon\w* kurdu|haftalık\s+(yatırım|tur)|öne çıkan yatırımlar|gündemi #\d/i;

// Liste/derleme başlığı: "10 European X startups", "The 10 biggest startup investments" — tek şirketlik tur duyurusu değil.
const LISTE_IFADE = /\b\d{1,2}\s+(european|nordic|uk|us|german|dutch|swedish|turkish|french|female|ai|deep\s?tech)\b[^.]{0,45}\b(startups?|companies|scale-?ups)\b|\bbiggest\s+(startup\s+)?investments\b|\btop\s+\d{1,2}\b/i;

// Başlık kapısı: satın alma / gelir / halka arz / dava haberi ise gövdedeki rakam tur tutarı DEĞİLDİR.
// "IPO founder" bir KİŞİ tanımıdır, olay değil: "Denmark's youngest IPO founder raises $7.5M"
// gerçek bir turdu ve ceza onu tamamen siliyordu. Sınıflandırıcıdaki lookahead ile aynı.
const BASLIK_KAPI = /\b(acquir\w+|to buy|buys|buying|purchase[sd]?|merger|takeover|revenue|earnings|nasdaq|nyse|goes public|settlement|lawsuit)\b|\bipo\b(?!\s+(?:founder|co-?founder|veteran|alumn))|satın al\w+|anlaşma\S*\s+imzala\S*|gelir elde|halka arz|\bdava\w*|ödeme yapa\w*|teklifinden vazgeç/i;

const TAVAN_RE = /\b(up to|as much as|a maximum of|no more than|in talks to raise|looking to raise|seeking to raise|could raise|plans to raise|targeting)\b|\bkadar\b|en fazla|en çok|\bvaran\b|hedefliyor/i;
const YAKLASIK_RE = /\b(around|approximately|roughly|about|some|circa|~|≈)\b|yaklaşık|civarında|kadarlık/i;
const TABAN_RE = /\b(over|more than|at least|in excess of|north of|upwards of)\b|üzerinde(?!n)|aşkın|\başan\b|en az|\bfazla\b/i;   // 'üzerinden' = değerleme ablatifi, 'fazla' değil

// Sayının hemen önündeki 34 karakter: "up to $50M" / "75 milyon dolara kadar" (TR'de sonra gelir).
function kesinlikOlc(N, i, j, aralik) {
  // Pencere CÜMLE SINIRINI AŞMAZ: önceki cümledeki "over/up to" sonraki rakamı kirletiyordu
  // ("... raising over €8 million. The €8.2m pre-seed round ..." → €8.2m yanlışlıkla "taban" oluyordu).
  const [a0, b0] = aralik ?? [0, N.length];
  const on = N.slice(Math.max(a0, i - 34), i);
  const arka = N.slice(j, Math.min(b0, j + 22));
  if (TAVAN_RE.test(on) || TAVAN_RE.test(arka)) return "tavan";
  if (TABAN_RE.test(on) || TABAN_RE.test(arka)) return "taban";
  if (YAKLASIK_RE.test(on)) return "yaklasik";
  return "kesin";
}

// Çeviri parantezi: "€1.6 million (£1.4 million)" — parantez içindeki tutar ikincil.
function parantezIci(N, i) {
  const on = N.slice(Math.max(0, i - 45), i);
  return on.lastIndexOf("(") > on.lastIndexOf(")");
}

// ---------------------------------------------------------------- tur tipi / enstrüman
const TUR_KURAL = [
  ["pre-seed", /pre[-\s]?seed|ön[-\s]?tohum|pre[-\s]?tohum/i],
  ["series-c+", /series[-\s]?[c-h]\b|\b[C-H] [Ss]erisi/i],
  ["series-b", /series[-\s]?b\b|\bB [Ss]erisi/i],
  ["series-a", /series[-\s]?a\b|\bA [Ss]erisi/i],
  ["seed", /\bseed\b|tohum yatırım\w*|\btohum turu/i],
  ["bridge", /\bbridge (round|financing|funding)\b|köprü tur\w*/i],
  ["grant", /\bgrant\b|\bhibe\b|non-dilutive|innovation agency|research programme|research program\b|horizon europe|eic accelerator|tübitak|kosgeb|\bawarded\b|\baward\b/i],
  ["debt", /\bventure debt\b|\bdebt (financing|facility|funding)\b|credit facility|\bloan\b|borç\w* finansman|kredi (imkanı|olanağı|limiti)|tahvil/i],
];
const ENSTRUMAN_KURAL = [
  ["convertible", /convertible (note|loan|bond)|\bSAFE\b|dönüştürülebilir/i],
  ["debt", /\bventure debt\b|\bdebt (financing|facility|funding)\b|credit facility|\bloan\b|borç\w* finansman|kredi (imkanı|olanağı|limiti)|tahvil/i],
  ["grant", /\bgrant\b|\bhibe\b|non-dilutive|innovation agency|research programme|research program\b|horizon europe|eic accelerator|tübitak|kosgeb|\bawarded\b|\baward\b/i],
];

function ilkEslesme(kurallar, ...kapsamlar) {
  for (const k of kapsamlar) {
    if (!k) continue;
    for (const [ad, re] of kurallar) if (re.test(k)) return { ad, alinti: (k.match(re) || [""])[0] };
  }
  return null;
}

// ---------------------------------------------------------------- ana çıkarım
export function kunyeCikar(metin, baslik = "") {
  const N = normalizeMetin(metin);
  const B = normalizeMetin(baslik);
  const araliklar = cumleAraliklari(N);
  const basliktakiDegerler = new Set(paraGecisleri(B).map((p) => p.deger));
  const fonVeyaDerleme = BELGE_KAPI.test(B) || BELGE_KAPI.test(N.slice(0, 260)) || LISTE_IFADE.test(B);
  const turHaberiDegil = BASLIK_KAPI.test(B);

  // 1) Adaylar önce PUANSIZ çıkarılır — değerleme seçimi puandan bağımsızdır.
  const adaylar = paraGecisleri(N).map((p) => {
    const aralik = cumleBul(araliklar, p.i);
    return { ...p, aralik, cumle: N.slice(aralik[0], aralik[1]) };
  });

  // 2) Değerleme: değerleme anahtar kelimesine 90 karakterden yakın, geçmiş tur işareti taşımayan tutar.
  // Satın alma/gelir/dava başlığı ya da fon/derleme yazısında değerleme de ÜRETİLMEZ (aksi halde
  // Nvidia–HuggingFace satın alma yazısından 4,5 milyar, haftalık derlemeden 30 milyar sızıyordu).
  const DEG_RE = /\bvaluation\b|\bvalued at\b|pre-?money|post-?money|değerleme\w*|değerlemesi\w*/gi;
  const degAnahtar = (turHaberiDegil || fonVeyaDerleme) ? [] : [...N.matchAll(DEG_RE)].map((m) => m.index);
  let degerlemeAday = null, degerlemeMesafe = Infinity;
  for (const a of adaylar) {
    const d = Math.min(...degAnahtar.map((k) => Math.min(Math.abs(k - a.j), Math.abs(k - a.i))), Infinity);
    if (d > 90) continue;
    if (/\b(previous(ly)?|back in|in 20[0-2]\d\b)\b|daha önce|\b20[0-2]\d yılında(?!\s*kurul)|\b20[0-2]\d['’]\w*|aktarmıştık/i.test(a.cumle)) continue;
    if (d < degerlemeMesafe) { degerlemeAday = a; degerlemeMesafe = d; }
  }

  // 3) Puanlama.
  for (const p of adaylar) {
    const genis = N.slice(Math.max(0, p.i - 250), p.j + 250);
    let skor = 0;
    for (const [w, re] of POZITIF) if (re.test(genis)) skor += w;
    for (const [w, re] of NEGATIF) if (re.test(p.cumle)) skor -= w;
    // Değerleme cezası: aynı cümlede BAŞKA bir geçiş zaten değerleme seçildiyse bu aday muaftır.
    // cumleBul kopya dizi döndürdüğü için kimlik değil DEĞER karşılaştırması yapılır.
    const degerlemeMuaf = degerlemeAday && degerlemeAday !== p && degerlemeAday.aralik[0] === p.aralik[0];
    if (!degerlemeMuaf) for (const [w, re] of NEGATIF_DEGERLEME) if (re.test(p.cumle)) skor -= w;
    if (p.i < 350) skor += 4;                                  // lede'deki rakam turun kendisidir
    if (basliktakiDegerler.has(p.deger)) skor += 6;            // başlıkta geçen rakam en güçlü sinyal
    if (!HEDEF_BIRIM.has(p.birim)) skor -= 6;                  // NOK/SEK/DKK: çeviri parantezinden gelir
    if (parantezIci(N, p.i)) skor -= 3;                        // "(approximately $3 million)"
    p.kesinlik = kesinlikOlc(N, p.i, p.j, p.aralik);
    if (p.kesinlik !== "kesin") skor -= 2;                     // "over €8M" varken "€8.2m" tercih edilir
    if (fonVeyaDerleme) skor -= 12;
    // Başlık kapısı artık KESİN VETO değil, ağır ceza: "Denmark's youngest IPO founder raises $7.5 million"
    // gerçek bir turdu ve veto onu tamamen siliyordu. Ceza satın alma/gelir yazılarını yine eliyor.
    if (turHaberiDegil) skor -= 10;
    p.skor = skor;
  }

  // 4) Tur tutarı: değerleme olarak seçilen geçiş aday havuzundan düşülür; trilyonluk rakam tur olamaz.
  const turAdaylari = adaylar.filter((a) => a !== degerlemeAday && a.deger < 1e12).sort((x, y) => y.skor - x.skor || x.i - y.i);
  let tutarAday = turAdaylari.length && turAdaylari[0].skor > 0 ? turAdaylari[0] : null;

  // Kesinleştirme: kazanan "over €8 million" gibi tavan/taban diliyse, aynı turu tarif eden
  // kesin rakam ("€8.2m") metinde varsa onu kullan. Başlık kaba rakamı yazar, gövde kesinini.
  if (tutarAday && tutarAday.kesinlik !== "kesin") {
    const oran = (a) => a.deger / tutarAday.deger;
    const kesin = turAdaylari.find(
      (a) => a !== tutarAday && a.kesinlik === "kesin" && a.skor > 0 &&
             a.birim === tutarAday.birim && oran(a) >= 0.85 && oran(a) <= 1.35,
    );
    if (kesin) tutarAday = kesin;
  }

  const tutarAlinti = tutarAday ? alintiYap(N, tutarAday.aralik, tutarAday.i, tutarAday.j) : null;
  const tutarOK = Boolean(tutarAlinti) && N.includes(tutarAlinti) && tutarAlinti.includes(tutarAday.ham);

  const degAlinti = degerlemeAday ? alintiYap(N, degerlemeAday.aralik, degerlemeAday.i, degerlemeAday.j) : null;
  const degOK = Boolean(degAlinti) && N.includes(degAlinti) && degAlinti.includes(degerlemeAday.ham);

  // --- enstrüman: önce tutarın cümlesi, sonra başlık
  const ens = ilkEslesme(ENSTRUMAN_KURAL, tutarAday?.cumle, B);
  const instrument = ens ? ens.ad : "equity";

  // --- tur tipi: önce tutarın cümlesi, sonra başlık, sonra tüm metnin ilk geçişi; yoksa enstrümandan türet
  const ASAMA_KURAL = TUR_KURAL.filter(([ad]) => ad !== "grant" && ad !== "debt");
  // Başlık ve belge geneli taranırken GEÇMİŞ TURA atıf yapan cümlecikler düşülür: "Velatir secures
  // €5 million six months AFTER ITS PRE-SEED ROUND" başlığı yeni turu pre-seed sanıyordu.
  const gecmisiAt = (t) => String(t ?? "").replace(/\b(after|following|since|prior to|previously|earlier)\b[^.,;]{0,70}/gi, " ");
  // Belge geneli aşama taraması YALNIZ bir tur tutarı bulunduysa yapılır: aksi halde derleme
  // yazılarında ("Yapay Zeka Gündemi #60") tutar null iken tur_tipi uydurma bir aşama döndürüyordu.
  const tur = ilkEslesme(TUR_KURAL, tutarAday?.cumle, gecmisiAt(B)) ||
    (tutarAday ? ilkEslesme(ASAMA_KURAL, gecmisiAt(N)) : null);
  const turTipi = tur ? tur.ad : instrument === "grant" ? "grant" : instrument === "debt" ? "debt" : "belirsiz";
  const turAlinti = tur ? tur.alinti : ens ? ens.alinti : null;

  return {
    tutar: {
      deger: tutarOK ? tutarAday.deger : null,
      para_birimi: tutarOK ? tutarAday.birim : null,
      metin: tutarOK ? tutarAday.ham : null,
      kesinlik: tutarOK ? tutarAday.kesinlik : null,   // kesin | tavan | taban | yaklasik
      kaynak_alinti: tutarAlinti,
      dogrulandi: tutarOK,
    },
    tur_tipi: {
      deger: turTipi,
      kaynak_alinti: turAlinti,
      dogrulandi: Boolean(turAlinti) && N.includes(turAlinti),
    },
    degerleme: {
      deger: degOK ? degerlemeAday.deger : null,
      para_birimi: degOK ? degerlemeAday.birim : null,
      metin: degOK ? degerlemeAday.ham : null,
      kaynak_alinti: degAlinti,
      dogrulandi: degOK,
    },
    // equity varsayılandır: kanıt cümlesi yoktur, dogrulandi=false ile işaretlenir.
    instrument: {
      deger: instrument,
      kaynak_alinti: ens ? ens.alinti : null,
      dogrulandi: Boolean(ens) && N.includes(ens.alinti),
    },
    normal_metin: N,   // alıntıların substring testi çağıran tarafta da tekrarlanabilsin
  };
}
