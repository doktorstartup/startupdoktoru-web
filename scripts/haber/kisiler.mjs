// Haber toplayıcı — yatırımcı + kurucu çıkarımı (saf fonksiyon, ağ isteği yok, bağımlılık yok).
// Girdi: tur haberinin düz metni. Çıktı: { lider_yatirimci, katilan_yatirimcilar, kurucular,
//        ne_yapiyor_kaynak_cumle, ne_yapiyor_adaylari, belirsizler, llm_gerekli }.
//
// TASARIM TERCİHİ — ADLAR NORMALİZE EDİLMEZ:
// "Point72 Private Investments" ≠ "Point72 Ventures" ≠ "Point72"; üçü ayrı tüzel kişilik ve
// HubX'in yatırımcısı birincisidir. Kısaltmak/uzatmak utandırıcı hata olduğu için
// haberde ne yazıyorsa o saklanır. Yalnız cümlenin gramerinden gelen ekler ("the",
// "New York-based ... fund", "former Google CEO") sökülür — bunlar adın parçası değil.
//
// TASARIM TERCİHİ — KÜÇÜK HARFLİ ROL KELİMESİ = AÇIKLAMA, BÜYÜK HARFLİ = ADIN PARÇASI:
// Ölçüldü: "Harbert Growth Partners" / "Motive Partners" firma adıdır ama
// "Lunar's former CEO" / "a professional auditor" / "existing investors" tarif cümlesidir.
// Ayırt edici sinyal büyük/küçük harf. Bu yüzden rol kelimesi elemeleri `i` bayrağı OLMADAN çalışır.
//
// TASARIM TERCİHİ — HALÜSİNASYON KAPISI ZORUNLU:
// Çıkarılan her ad kaynak metinde birebir substring olarak doğrulanır (dogrula()).
// Doğrulanamayan aday sessizce düşürülür; uydurma kurucu adı bu sistemdeki en pahalı hatadır.

// ---------------------------------------------------------------------------
// 0. Küçük yardımcılar
// ---------------------------------------------------------------------------

const BUYUK = "\\p{Lu}";   // D1: Unicode buyuk harf sinifi (Š/Ž/Ł/Ū/Ő... Latin-Extended adlari icin)
const YER = "";   // maskeleme işareti (metinde asla geçmeyen kontrol karakteri)

// Firma adı eki — kişi mi kurum mu ayrımında kullanılır.
const FIRMA_EKI = /\b(Ventures?|Capital|Partners?|Fund|Funds|Group|Bank|Holdings?|Management|Investments?|Invest|VC|Labs?|Foundation|Trust|GmbH|Ltd|Inc|LLC|AB|AS|A\.?Ş|Sermaye)\b/;

// Küçük harfli rol/tarif kelimesi → eleman bir kişi/kurum adı değil, açıklamadır.
const KUCUK_ROL = /\b(former|ex-|chief|officer|partner|partners|director|president|chairman|auditor|executives?|shareholders?|advisors?|angels?|investors?|investor|others?|participants?|backers?|kurucu|ortağı|yönetici|melek|yatırımcılar|yatırımcı)\b/;
// Baştaki jenerik ifadeler (isim taşımayan yatırımcı grupları).
// `i` bayrağı YOK: küçük-harf ileri-bakışı (?=\s+[a-zçğıöşü]) aksi halde büyük harfleri de
// eşleştirip "Angel Invest" adlı gerçek yatırımcıyı "angel investors" sanıyor.
const JENERIK = /^(?:[Ee]xisting|[Oo]ther|[Nn]ew|[Aa]dditional|[Pp]rominent|[Pp]rivate|[Aa]ngel|[Bb]usiness|[Ss]everal|[Gg]roup|[Rr]ound|[Uu]nnamed|[Uu]ndisclosed|[Mm]evcut|[Dd]iğer|[İi]simsiz)\b(?=\s+[a-zçğıöşü]|[,.]|$)|^(?:[Aa] group|[Tt]he round|[Ii]ts|[Hh]is|[Hh]er|[Tt]heir|[Çç]ok sayıda|[Bb]ir grup)\b/;
// Ülke/bölge sıfatı tek başına yatırımcı olamaz ("strategic private investors from the Swedish food sector" -> "Swedish").
const ULKE_SIFAT = /^(?:Swedish|Danish|Norwegian|Finnish|Icelandic|British|English|French|German|Dutch|Belgian|Spanish|Italian|Swiss|Irish|Polish|Portuguese|Austrian|Estonian|Latvian|Lithuanian|Turkish|American|European|Nordic|Baltic|Asian|African|Global)$/i;
// Akademik/unvan eki — tek başına eleman olursa at.
const UNVAN_EKI = /^(?:LL\.?M|Ph\.?D|PhD|M\.?D|MBA|MSc|BSc|Jr|Sr|Dr|Prof)\.?$/i;
// D19: yalnizca BUYUK harfli unvan sozcuklerinden olusan parca ad degildir.
// "a former Creative Director and professional Concept Artist" -> "Creative Director" kurucu sanildi (Artwod);
// "Robert Iskander, Chairman and CEO of SchoolDay" -> "Chairman" yatirimci sanildi (BOOKR Kids).
// KUCUK_ROL bunlari yakalayamiyor cunku sozcukler buyuk harfle yaziliyor.
const UNVAN_SOZCUK = "Chief|Chairman|Chairwoman|Chairperson|President|Director|Managing|Executive|Partner|Partners|Officer|Manager|Head|Founder|Founding|Co-Founder|General|Senior|Vice|Creative|Technical|Financial|Investment|Operating|Marketing|Angel|Angels|Investor|Investors|Board|Member|Advisor|Adviser";
const SADECE_UNVAN = new RegExp(`^(?:${UNVAN_SOZCUK})(?:\\s+(?:and\\s+)?(?:${UNVAN_SOZCUK}))*$`);

const kirp = (s) => (s ?? "").replace(/\s+/g, " ").trim();
const anahtar = (s) => kirp(s).toLowerCase().replace(/[.,;:'’"()]/g, "").replace(/\s+/g, " ");

// Span sonlandırıcılar: yatırımcı listesi bu kalıplardan birinde biter.
// ", the global InsurTech investor whose..." gibi ara açıklamalar listeye karışmasın diye.
const KESICILER = [
  /\s+following\b/, /,\s*while\b/, /,\s*through\b/, /\s+under\s+the\b/, /\s+[–—]\s/, /\s+and is\b/, /\s+and (?:has|have)\b/, /,\s*which\b/, /,\s*who\b/, /,\s*as does\b/,
  /,\s*bringing\b/, /\s+and brings\b/,
  /\s+through\s+its\b/, /\s+whose\b/, /\s+that has\b/,
  // D4: "operators and founders from X" da ayni tuzak (Mimir) — tekil "executives from" yetmiyordu.
  /,?\s*including (?:executives|operators|founders|angels|leaders|employees|alumni)\s+(?:and\s+[a-zçğıöşü]+\s+)?from\b/,
  /\s+(?:executives|operators|founders|angels|leaders|employees|alumni)\s+(?:and\s+[a-zçğıöşü]+\s+)?from\b/,
  /\s+will partner\b/,
  /,\s*with participation\b/, /\s+with participation\b/, /,\s*with the participation\b/,
  /,\s*together with\b/, /,\s*alongside\b/, /\s+with a\b/, /\s+for\s+\d/,
  /\s+to develop\b/, /\s+to further\b/, /\s+ile\b/, /\s+olarak\b/,
  // D5: amac cumlesi ("…, to accelerate the commercialisation of…") yatirimci listesine karisiyordu (Monava -> "AI-powered").
  /,\s*to\s+[a-zçğıöşü]/, /\s+in order to\b/,
  // D6: "on behalf of" (Alva: "Emerald Technology Ventures on behalf of Nabtesco…" tek ad sanildi).
  /\s+on behalf of\b/,
  // D7: alinti/atif kuyrugu ("…, ” said Jean-Guillaume Marquaire , Investment Director at Wilstar Innovate") — EQON'da 3 yanlis ad.
  /[“”"]/, /\s+(?:said|says|adds?|commented|comments?|states?|according to)\b/,
  // D8: "Valentin Gololobov after their previous company was hit by…" (Embedd) — ad 10 sozcugu asip eleniyordu.
  /\s+after\s+(?:the|their|his|her|its|a)\b/, /\s+when\s+[a-zçğıöşü]/,
  // D16: "…, is an ocular oncologist at St. Erik Eye Hospital" -> hastane adi kurucu sanildi (Eyedentity).
  /,?\s+is\s+[a-zçğıöşü]/, /,?\s+was\s+[a-zçğıöşü]/,
  // D18: "investors like Azolla, Climentum and Gain" — ornekleme, tur listesi degil (EQON alintisi).
  /\s+(?:like|such as)\s+/,
];

// Span'i ilk kesiciye kadar kırp.
function spanKes(span) {
  let s = " " + span;
  let en = s.length;
  for (const k of KESICILER) {
    const m = s.match(k);
    if (m && m.index > 0 && m.index < en) en = m.index;
  }
  let r = kirp(s.slice(0, en));
  // Virgülle çevrili açıklama parçasını sil (adın kendisi değil, tarifi).
  // D9: eskiden ", the <herhangi bir sey>," kaliplarinin HEPSI siliniyordu; "…, the Inclimo Climate Tech Fund, Prosegur,
  // Techstars, the S20 Fund and PropelX" listesinde 5 gercek yatirimci yok oluyordu (Boldr). Artik yalnizca
  // KUCUK harfli bir tarif sozcugu tasiyan parca siliniyor ("the growth-stage fund of seed investor LocalGlobe").
  const TARIF = /\b(?:fund|firm|investor|investors|arm|unit|platform|company|subsidiary|division|vehicle|branch|backer|accelerator|programme|program)\b/;
  r = kirp(r
    .replace(/,\s*(?:the|a|an)\s+([^,]{3,90}?),(?=\s)/g, (t, ic) => (TARIF.test(ic) ? " " : t))
    .replace(/,\s*(?:the|a|an)\s+([^,]{3,90})$/g, (t, ic) => (TARIF.test(ic) ? "" : t)));
  // D17: bastaki "executives/operators/founders … from X, Y" -> bunlar yatirimci DEGIL, meleklerin sirketleri.
  return /^(?:executives|operators|founders|angels|leaders|employees|alumni)\s+(?:and\s+[a-zçğıöşü]+\s+)?from\b/i.test(r) ? "" : r;
}

// ---------------------------------------------------------------------------
// 1. Varlık listesi ayırma  ("A, B and C" -> ["A","B","C"])
// ---------------------------------------------------------------------------

// TUZAK: "Plug and Play Insurtech" tek bir firmadır, " and " ondan bölünemez.
// Metin içinde ayırt edilemez ("SymbiaVC and Medin VC" ile aynı şekle sahip).
// Çözüm: RSS'in <a> bağlantı metinleri (secenekler.baglantilar) sınır ipucu olarak verilirse
// bu adlar bölünmeden önce maskelenir. tech.eu ve arcticstartup bu bağlantıları veriyor.
function parcala(span, korunan = []) {
  const kasa = [];
  let s = span;
  for (const k of korunan) {
    if (!/\s(?:and|ve)\s/.test(k)) continue;
    let i;
    while ((i = s.indexOf(k)) >= 0) { s = s.slice(0, i) + `${YER}${kasa.length}${YER}` + s.slice(i + k.length); kasa.push(k); }
  }
  s = s.replace(/\([^)]*\)/g, (m) => { kasa.push(m); return `${YER}${kasa.length - 1}${YER}`; });
  const geri = (t) => t.replace(new RegExp(`${YER}(\\d+)${YER}`, "g"), (_, n) => kasa[+n]);

  // Başta jenerik bir grup tarifi + ":" varsa at ("...leaders investing personally: Ad, Ad").
  s = s.replace(/^[^:]{0,120}?\b(?:group|investors|leaders|angels|executives|including|şunlar)\b[^:]{0,60}:\s*/i, "");

  const cikti = [];
  for (const p of s.split(/\s*[,;]\s*/)) {
    // Her virgül parçasında YALNIZ İLK "and"/"ve" bölünür.
    // İlk (son değil): "Ceres Power Holdings and Temasek Trust's Catalytic Capital for Climate and Health"
    // son-and ile bölünseydi "…for Climate" + "Health" olurdu.
    const m = p.match(/^(.*?)\s+(?:and|ve)\s+(.*)$/);
    if (m) cikti.push(geri(m[1]), geri(m[2]));
    else cikti.push(geri(p));
  }
  return cikti.map(kirp).filter(Boolean);
}

// ---------------------------------------------------------------------------
// 2. Varlık temizleme + geçerlilik
// ---------------------------------------------------------------------------

function temizle(el) {
  let s = kirp(el).replace(/^[“"'`\-–—]+|[.,;:”"'`]+$/g, "").trim();
  s = s.replace(/^(?:and|ve|also|as well as|alongside|together with|plus|with|from|including|dahil|ayrıca|ile)\s+/i, "");

  // Parantez: rol açıklamasıysa ya da uzunsa at, kısa kısaltmaysa (C3H, HTGF) adın parçasıdır.
  // D10: "Jesper Brøndum (Boozt)" — melek yatirimcinin SIRKETI, adinin parcasi degil. Eski kural
  // "12 karakterden kisa, bosluksuz parantez adin parcasidir" diyordu; Palette haberinde 9 ad birden bozuldu.
  // Ayirt edici: kisaltma TAMAMI BUYUK harftir ((EIFO), (HTGF), (C3H), (BOM)); sirket adi karma yazilir ((Boozt), (Mastra)).
  s = s.replace(/\s*\(([^)]*)\)/g, (tam, ic) => {
    if (/\b(CEO|CFO|CTO|COO|founder|former|head|VP|partner|chief)\b/i.test(ic)) return "";
    return /^[\p{Lu}0-9&.\-]{2,10}$/u.test(ic.trim()) ? tam : "";
  }).trim();

  s = s.replace(/^(?:the|a|an)\s+/i, "");
  // "New York-based early-stage venture fund AlleyCorp" -> "AlleyCorp"
  // Head-noun KÜÇÜK harf olmalı: "KHAN Technology Transfer Fund II" bozulmasın.
  s = s.replace(/^.{0,70}?\b(?:investor|investors|fund|firm|bank|giant|company|startup|scale-?up|platform|group|vc|executives|entrepreneur)\s+(?=[A-Z0-9])/, "");
  // "former Google CEO Eric Schmidt" / "Napster co-founder Sean Parker" -> kişi adı
  s = s.replace(/^.{0,60}?\b(?:co-?founder|founder|CEO|CFO|CTO|COO|CPO|CIO|CMO|CRO|chairman|chief executive officer)\s+(?=[A-Z])/, "");
  // Baştaki büyük harfle başlamayan kelime dizisini at ("2019 yılında şirketten ayrılan Sunil Madhu")
  const t = s.split(" ");
  // D2: bastan sona kucuk harfli sozcuk atilir ("co-founders", "co-led", "yılında"); camelCase marka
  // ("byFounders") ve rakamla baslayan ad ("2100 Ventures") KORUNUR. Bastaki yil yalniz ardindan kucuk
  // harfli sozcuk gelirse atilir ("2019 yılında şirketten ayrılan Sunil Madhu" -> "Sunil Madhu").
  while (t.length > 1 && (/^[\p{Ll}][\p{Ll}\d'’-]*$/u.test(t[0]) || (/^\d{4}$/.test(t[0]) && /^[\p{Ll}]/u.test(t[1] ?? "")))) t.shift();
  // Rol/tarif kelimesi kontrolü sondaki kırpmadan ÖNCE yapılır: aksi halde
  // "a group of Nordic insurance executives" kırpılıp "Nordic" diye yatırımcı sanılıyor.
  if (KUCUK_ROL.test(t.join(" "))) return "";
  // Sondaki küçük harfli kelimeleri at: firma/kişi adı küçük harfle bitmez.
  // "EIFO also reinvested" -> "EIFO";  "Volve is rolling out a new graph-based" -> "Volve".
  while (t.length > 1 && /^[a-zçğıöşü][\p{L}\d-]*$/u.test(t[t.length - 1])) t.pop();
  s = t.join(" ");
  return kirp(s.replace(/^[.,;:\-–—]+|[.,;:\-–—]+$/g, ""));
}

function gecerliMi(s, sirket) {
  if (!s || s.length < 2 || s.length > 90) return false;
  if (!new RegExp(`[${BUYUK}]`, "u").test(s)) return false;
  if (!new RegExp(`^[${BUYUK}0-9\\p{Ll}]`, "u").test(s)) return false;   // D2: kucuk harfle baslayan marka ("byFounders", "imagi") gecerli
  if (UNVAN_EKI.test(s)) return false;
  if (SADECE_UNVAN.test(s)) return false;   // D19
  if (JENERIK.test(s)) return false;
  if (ULKE_SIFAT.test(s)) return false;
  if (KUCUK_ROL.test(s)) return false;                 // küçük harfli rol kelimesi = tarif cümlesi
  if (/^\W*$/.test(s) || /^[\d€$£₺.,%]+$/.test(s)) return false;
  if (s.split(" ").length > 10) return false;
  if (/\b(?:CEO|CFO|CTO|COO|VP)\b/.test(s)) return false;   // "CEO of OBOS" = tarif, ad değil
  // D11: cumle kalintisi / unvan kuyrugu ("Investment Director at Wilstar Innovate") — tekilleAdlar bunu
  // gercek "Wilstar Innovate" adinin YERINE gecirip dogru adi tamamen yutuyordu (EQON).
  if (/[“”"]/.test(s)) return false;
  if (/\s(?:at|from|by|said|says)\s/.test(s)) return false;
  if (/\.\s/.test(s)) return false;
  if (sirket && anahtar(s) === anahtar(sirket)) return false;   // şirketin kendisi yatırımcı değil
  return true;
}

// "Lightspeed Ventures' Jeremy Liew" — firma mı şahıs mı belirsiz.
function belirsizMi(s) {
  const m = s.match(new RegExp(`^([${BUYUK}][^'’]*?)['’]s?\\s+(.+)$`, "u"));
  return !!(m && FIRMA_EKI.test(m[1]) && kisiMi(m[2]));
}

// Kişi adı mı? (kurucu alanı yalnız kişi kabul eder)
function kisiMi(ad) {
  if (SADECE_UNVAN.test(kirp(ad))) return false;   // D19: "Creative Director" kişi adı değil
  const t = kirp(ad).split(" ");
  if (t.length < 2 || t.length > 5) return false;
  if (FIRMA_EKI.test(ad)) return false;
  return t.every((x) => new RegExp(`^[${BUYUK}]`, "u").test(x) || /^(?:van|von|de|del|da|di|der|den|bin|el)$/i.test(x));
}

// Kişi adının başındaki akademik unvanı sök: "Dr. Felix Marske" -> "Felix Marske"
const unvanSok = (ad) => kirp(ad.replace(/^(?:Dr|Prof|Mr|Mrs|Ms|Sn|Sayın)\.?\s+/i, "").replace(/,?\s*(?:PhD|Ph\.D\.?|MD|M\.D\.?|LL\.M\.?|MBA)\.?$/i, ""));

// ---------------------------------------------------------------------------
// 3. Cümleye bölme  (tüm kalıplar CÜMLE içinde çalışır)
// ---------------------------------------------------------------------------

// TASARIM TERCİHİ — SPAN'LER CÜMLE SINIRIYLA KAPANIR, "." İLE DEĞİL:
// Ölçüldü: "led by Healthy.Capital" ve "Founded in 2025 by Dr. Marske" vakalarında
// nokta-ile-kesen span, adı "Healthy" / "Dr" diye kırpıyordu. Kısaltma bilen bir
// cümle ayırıcı kullanılıp kalıplar cümle içinde çalıştırılınca ikisi de düzeldi.
export function cumleAyir(metin) {
  return kirp(metin)
    .replace(/\b(Dr|Prof|Mr|Mrs|Ms|Inc|Ltd|Co|St|No|vs|Sn)\.\s/g, "$1§ ")
    .replace(/([A-Za-z0-9])\.([A-Za-z])/g, "$1§$2")          // Healthy.Capital, os.energy
    .split(/(?<=[.!?])(?<!\s\p{Lu}\.)\s+(?=[“"«]?[\p{Lu}0-9])/u)
    .map((c) => kirp(c).replace(/§/g, "."))
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// 4. Yatırımcı çıkarımı
// ---------------------------------------------------------------------------

// Yatırımcı kalıpları YALNIZ bu ipucunu taşıyan cümlede aranır.
// Aksi halde "Alongside its direct deployments, Motion is launching a partner programme…"
// cümlesinden "Motion's platform" yatırımcı diye çıkıyordu.
// D12: ciplak "backed" cikarildi. Oshen'de "In a project backed by the UK's Defence and Security Accelerator,
// C-Stars are being trialled … alongside ZeroUSV and MarineAI" cumlesi 3 yanlis yatirimci uretiyordu.
// "backed by" gercek tur cumlesinde zaten round/funding/raise/million ile birlikte geciyor.
const FON_IPUCU = /\b(raise[ds]?|round|funding|financing|investment|invested|investors?|grant|award(?:ed)?|participation|led by|loan)\b|yatırım|finansman|tur(?:una|unda|unu)\b/i;
// D13: ONCEKI turu anlatan cumle bu turun yatirimcisini vermez. Callosum: "The Seed round follows an €8.76M
// pre-Seed raise …, which was led by Plural with participation from 22 investors and support from … (ARIA)."
const GECMIS_TUR = /\b(?:follows?|followed|previous(?:ly)?|earlier|prior|last year|back in|had (?:raised|secured)|in (?:January|February|March|April|May|June|July|August|September|October|November|December) \d{4})\b|daha önce|geçen yıl/i;

// Lider kalıpları — cümle içinde, span cümlenin kalanı.
const LIDER_KALIP = [
  /\b(?:co-)?led by\s+(.+)$/gi,
  /\bbacked by\s+(?:an?\s+[^.]{0,60}?\b(?:investment|round|funding)\s+from\s+)?(.+)$/gi,
  /\breceived a grant[^,]{0,80}?\bfrom\s+(.+)$/gi,
  /\bturuna\s+(.+?)\s+(?:ortaklaşa\s+)?liderlik etti/gi,
  /\b(?:has been |was |been )?awarded\s+[^;]{0,60}?\bby\s+(.+)$/gi,
  /\b(?:secured|received|raised|gets?)\s+[^.]{0,50}?\b(?:loan|grant|award|facility)\s+from\s+(.+)$/gi,
  // TR: "X'tan ... yatırım aldı" — "liderlik etti" kalıbı olmayan haberler (HubX).
  /(?:^|,\s*)(\p{Lu}[^,;]{2,70}?)\s*['’](?:t[ae]n|d[ae]n)\s+[^;]{0,90}?yatırım al/giu,   // D3: TR ondalik virgul ("1,2 milyar") araya girebiliyor
];

// Katılan kalıpları.
const KATILAN_KALIP = [
  /\bwith (?:the )?participation (?:from|of)\s+(.+)$/gi,
  /\bled by\s+[^,]{2,80},\s*with\s+(?!(?:the )?participation)(.+)$/gi,   // arctic: "led by X, with A, B and C"
  /\b(?:along with|alongside|joined by)\s+(.+)$/gi,
  /\btogether with\s+(.+)$/gi,
  /\bOther participants[^.]{0,60}?\binclude[sd]?\s+(.+)$/gi,
  /\bincludes? new investors\s+(.+)$/gi,
  // D21: iki paylasilan liste bicimi hicbir kalibin kapsaminda degildi:
  // MAASH "…equity raise from five new investors: Ambra Capital, InvestPro, …" (6 ad kayipti)
  // eComID "The round also brought together founders and retail leaders, including Alan Mamedi, …" (8 ad kayipti)
  /\binvestors?\s*:\s*(.+)$/gi,
  /\bbrought together\s+(?:[^,:]{0,60}?\bincluding\s+)?(.+)$/gi,
  /\bwith\s+(.+?)\s+also (?:investing|participating)/gi,
  /\bwith\s+(.+?)\s+joining as (?:an?\s+)?(?:investor|angel|backer)/gi,
  /\b(?:angel|private|existing) investors[^.]{0,20}?\b(?:also participated,?\s*)?including\s+(.+)$/gi,
  /\b(?:complemented|accompanied|supported) by\s+(?:an?\s+)?(?:loan|debt|grant|venture debt)[^.]{0,20}?from\s+(.+)$/gi,
  /\b(?:also )?includes? follow-on investment from\s+(.+)$/gi,
  /\bas well as\s+(?:an?\s+)?[€$£]?[\d.,]*\s*(?:million\s+|bin\s+)?(?:match loan|loan|grant|credit|facility)\s+from\s+(.+)$/gi,
  /\b(?:existing\s+)?(?:investors?|backers?|shareholders?)\s+(.+?)\s+(?:also\s+)?(?:reinvested|re-invested|doubling down|doubled down)/gi,
  /\byatırım turunda\s+(.+?)\s+yer ald/gi,
  /\bkatılım(?:ıyla|ı ile)\s+(.+)$/gi,
];

// Bir cümleye kalıp listesini uygula; her eşleşme için varlık listesi döndür.
function cumledenCikar(cumle, kaliplar, korunan, sirket) {
  const cikti = [];
  for (const re of kaliplar) {
    for (const m of cumle.matchAll(re)) {
      const grup = [];
      for (const ham of parcala(spanKes(m[1]), korunan)) {
        const t = temizle(ham);
        if (gecerliMi(t, sirket)) grup.push(t);
      }
      if (grup.length) cikti.push(grup);
    }
  }
  return cikti;
}

// Aynı varlığın uzun/kısa hallerini teke indir; UZUN olanı sakla ("Plug and Play" < "Plug and Play Insurtech").
function tekilleAdlar(liste) {
  const sirali = [...new Set(liste)].sort((a, b) => b.length - a.length);
  const tut = [];
  for (const s of sirali) {
    const k = anahtar(s);
    if (tut.some((v) => { const kv = anahtar(v); return kv === k || kv.startsWith(k + " ") || kv.endsWith(" " + k); })) continue;
    // Tek kelimelik parça, saklanan uzun bir adın İÇİNDE geçiyorsa at:
    // "Plug and Play Insurtech" bölünürse kalan "Play" ayrı yatırımcı sanılmasın.
    if (!s.includes(" ") && tut.some((v) => anahtar(v).split(" ").includes(k))) continue;
    tut.push(s);
  }
  return tut;
}

// ---------------------------------------------------------------------------
// 5. Kurucu çıkarımı
// ---------------------------------------------------------------------------

const KURUCU_UNVAN = /\b(?:co-?founder|founder|founding member|CEO|chief executive officer|kurucu ortak|kurucu|genel müdür)\b/i;
// Kişi adı: 1-4 sözcük, her biri büyük harfle başlar (van/von/de gibi ekler hariç).
// Nokta ADA DAHİL DEĞİL: aksi halde "…, co-founders of Ponda. Ponda’s Seed…" tek ad sanılıyordu.
// Baş harf kısaltması ("Dominik L. Schreiber") ayrı bir seçenekle karşılanır.
// Ad HER ZAMAN büyük harfli bir sözcükle biter; "van/de/da" gibi ekler yalnız ARADA durabilir.
// TUZAK: Türkçe "da/de" bağlacı ("Kaan Ortabaş da şirketin…") ek listesiyle çakışıyordu;
// eskiden ad "Kaan Ortabaş da şirketin" diye çıkıyor ve ikinci kurucu tamamen kayboluyordu.
const AD = `[${BUYUK}][\\p{L}'’-]+(?:\\s+(?:(?:van|von|de|der|den|di|del|da|bin|el)\\s+)*[${BUYUK}][\\p{L}'’-]+|\\s+[${BUYUK}]\\.){0,3}`;
// D20: SIRKET adi kucuk harfle baslayabilir ("eComID", "imagi", "os.energy", "byFounders").
// AD kalibi kullanildiginda "Oscar Rundqvist, co-founder and CEO of eComID" hic eslesmiyor,
// dolayisiyla kurucu tamamen kayboluyordu.
const AD_SIRKET = `[\\p{L}][\\p{L}\\d'’.&-]*(?:\\s+[\\p{Lu}\\d][\\p{L}\\d'’.&-]*){0,3}`;
const ROL = "[Cc]o-?[Ff]ounder|[Ff]ounder|CEO|Chief Executive Officer";
const kac = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Kurucu adayları. sirketIddia doluysa ŞİRKET KAPISI'ndan geçmek zorundadır.
function kurucuAdaylari(metin, cumleler, sirket, korunan) {
  const aday = [];
  const ekle = (ad, unvan, sirketIddia) => {
    const a = kirp(ad ?? "").replace(/[.,;]$/, "");
    if (a) aday.push({ ad: a, unvan: kirp(unvan || ""), sirketIddia: kirp(sirketIddia || "").replace(/[.,;]$/, "") });
  };
  const s = sirket ? kac(sirket) : "";

  for (const c of cumleler) {
    // (a) "Founded in 2019 by A and B" / "co-founded by A, B and C"
    const a = c.match(/\b(?:was\s+|were\s+)?(?:co-)?(?:founded|established|set up)(?:\s+in\s+\w+)?(?:\s+in\s+[A-Z][\w\s]{0,20})?(?:\s+as[^,]{0,40})?\s+by\s+(.+)$/i);
    if (a) {
      let span = a[1].split(/\s+and headquartered\b|\s+and is based\b/i)[0];
      if (s) span = span.split(new RegExp(`,\\s*${s}\\b`, "i"))[0];
      for (const ham of parcala(spanKes(span), korunan)) ekle(temizle(ham), "kurucu");
    }
    // (b) TR: "A ve B tarafından kurulan / hayata geçirilen"
    const b = c.match(/(?:^|,\s*|\s)([^,;]{3,120}?)\s+tarafından\s+(?:kurulan|kuruldu|hayata geçiril)/i);
    if (b) for (const ham of parcala(b[1], korunan)) ekle(temizle(ham), "kurucu");

    // (c) "NAME, (co-)founder and CEO of COMPANY" — unvan sonra, şirket iddiası var
    // D14: "Alexander Hebbe , CEO, Monava." — arctic'in sik kullandigi bicimde "of/at" YOK; eski kalip kaciriyordu.
    // Sirket kapisi bunu guvenli kiliyor: "Patrik Olson , CEO, Hede Capital" -> sirket eslesmedigi icin elenir.
    for (const m of c.matchAll(new RegExp(`(${AD})\\s*,\\s*(?:PhD|MD|Ph\\.D\\.|M\\.D\\.)?,?\\s*((?:[\\w-]+\\s+){0,3}(?:${ROL}))(?:\\s+(?:and|&)\\s+[\\w\\s]{0,28}?)?\\s*(?:,\\s*(?:of|at)\\s+|\\s+(?:of|at)\\s+|,\\s*)(${AD_SIRKET})`, "gu"))) ekle(m[1], m[2], m[3]);

    // (d) Şirket adı yok: "NAME, co-founder and CTO." — unvanda "founder" ŞART (çıplak CEO kabul edilmez)
    for (const m of c.matchAll(new RegExp(`(${AD})\\s*,\\s*((?:[\\w-]+\\s+){0,2}[Cc]o-?[Ff]ounder(?:\\s+(?:and|&)\\s+[A-Za-z]{2,30})?|(?:[\\w-]+\\s+){0,2}(?:CEO|CTO|CFO|COO|CPO)\\s+(?:and|&)\\s+[Cc]o-?[Ff]ounder)\\s*(?=[.,”"’]|$)`, "gu"))) ekle(m[1], m[2], sirket || "");

    // (e) Unvan önce + ŞİRKET KAPISI: "Stability AI's founder and CEO NAME", "HubX Kurucu Ortağı NAME"
    if (s) {
      for (const m of c.matchAll(new RegExp(`${s}['’]?s?\\s+(?:[\\w-]+\\s+){0,2}(?:[Cc]o-?[Ff]ounder|[Ff]ounder)(?:\\s+and\\s+[\\w\\s]{0,20})?\\s+(${AD})`, "gu"))) ekle(m[1], "kurucu", sirket);
      for (const m of c.matchAll(new RegExp(`${s}\\s+(Kurucu(?:\\s+Ortağı)?|Genel Müdürü|CEO['’]?su)\\s+(${AD})`, "gu"))) ekle(m[2], m[1], sirket);
    }

    // (f) Unvan önce, şirket adı YOK: "The fourth co-founder is NAME", "under CEO NAME".
    // Yatırımcı listesi cümlesinde çalıştırılmaz: orada "co-founder X" meleğin BAŞKA
    // şirketteki unvanıdır ("...FIRSTPICK VC and Vinted executives ... and co-founder Mantas Mikuckas").
    // TUZAK KAPISI: unvandan önce büyük harfli bir kelime (= başka şirket) ya da "former" varsa reddet.
    // "Napster co-founder Sean Parker" / "former Fennia CEO Tomi Yli-Kyyny" böyle elenir.
    if (!/participation|angel|investors? includ|melek yatırımcı/i.test(c)) {
      for (const m of c.matchAll(new RegExp(`(?<!(?:[${BUYUK}][\\p{L}\\d'’-]{0,24}|former|ex|previous|outgoing)\\s)(?:[Cc]o-?[Ff]ounder(?:\\s+and\\s+[a-z]+)?|CEO)\\s+(?:is\\s+)?(${AD})`, "gu"))) ekle(m[1], "kurucu", sirket || "");
    }

    // (h) "Co-founders NAME and NAME said"
    const h = c.match(/\b(?:Co-?founders?|Founders?)\s+(.{3,140}?)\s+(?:said|says|added|comments?)\b/);
    if (h) for (const ham of parcala(h[1], korunan)) ekle(temizle(ham), "kurucu", sirket || "");
  }

  // (g) "…, co-founders of COMPANY" — adlar GERİDE kalır, cümle başına doğru geri taranır.
  for (const m of metin.matchAll(new RegExp(`,\\s*(?:the\\s+)?co-?founders?\\s+of\\s+(${AD})`, "gu"))) {
    const onc = metin.slice(Math.max(0, m.index - 220), m.index);
    const bas = onc.search(/(?:say|says|said|adds?|according to|”|"|\.\s)[^.”"]*$/);
    const span = bas >= 0 ? onc.slice(bas).replace(/^(?:say|says|said|adds?|according to|”|")\s*/i, "") : onc;
    for (const ham of parcala(span, korunan)) ekle(temizle(ham), "kurucu", m[1]);
  }
  return aday;
}

// ---------------------------------------------------------------------------
// 6. "Ne yapıyor" kaynak cümlesi
// ---------------------------------------------------------------------------

const YAPIYOR = /\b(develops?|providing|provides?|builds?|building|offers?|operates?|helps?|enables?|makes?|produces?|delivers?|is developing|is building|specialis|platform for)\b|geliştiriyor|sunuyor|sağlıyor|üretiyor|yardımcı ol|odaklan/i;
// Paranın nereye harcanacağını anlatan cümle "ne yapıyor" cümlesi DEĞİLDİR.
const KULLANIM = /\b(plans? to use|will use|use the new|the new capital|new funding will|funding will (?:support|be used)|will support the|proceeds)\b|kullanacağını|yeni yatırımı|yeni sermayey/i;
const PARA = /[€$£₺]\s?\d|\b\d+(?:[.,]\d+)?\s?(?:m|bn|k|million|billion|milyon|milyar)\b|\braise[ds]?\b|\bfunding\b|\bround\b|\binvestors?\b|yatırım|tur(?:una|unda)\b/i;

function neYapiyorSec(cumleler, sirket) {
  const puanli = [];
  for (const c of cumleler) {
    if (c.length < 55 || c.length > 400) continue;
    let p = 0;
    if (sirket && c.includes(sirket)) p += 3;
    if (YAPIYOR.test(c)) p += 3;
    // "X, a … company that develops…" / "X is a … platform" tanım kalıbı en iyisidir.
    if (sirket && new RegExp(`(?:^|, )${sirket.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+(?:is|provides|develops|builds|offers|operates|produces|specialises)\\b`).test(c)) p += 3;
    if (PARA.test(c)) p -= 4;
    if (/[“”"«»]/.test(c)) p -= 4;                              // alıntı içeren cümle
    if (/\b(said|says|adds?|comments?|explained|dedi|belirtti|ifade etti)\b/.test(c)) p -= 3;
    if (KULLANIM.test(c)) p -= 5;                               // paranın nereye harcanacağı
    if (/^(?:But|This|That|For|Yet|However|Alongside|The investment|The deal|Öte yandan|Ayrıca|Bu)\b/.test(c)) p -= 2;
    if (/^Founded in|^\d{4} yılında/.test(c)) p -= 1;
    if (c.length >= 70 && c.length <= 300) p += 1;
    puanli.push([p, c]);
  }
  puanli.sort((a, b) => b[0] - a[0]);
  const iyi = puanli.filter(([p]) => p >= 3).slice(0, 3).map(([, c]) => c);
  return iyi;
}

// ---------------------------------------------------------------------------
// 7. Halüsinasyon kapısı
// ---------------------------------------------------------------------------

// Kaynak metinde birebir geçmeyen adı ELE. Tek savunma hattı; asla atlanmaz.
export function dogrula(metin, adlar) {
  const kabul = [], red = [];
  for (const a of adlar) (metin.includes(a) ? kabul : red).push(a);
  return { kabul, red };
}

// ---------------------------------------------------------------------------
// 8. Ana fonksiyon
// ---------------------------------------------------------------------------

/**
 * @param {string} metin   Haberin düz metni (content:encoded'dan HTML sökülmüş hali).
 * @param {object} secenekler
 *   - sirket:      Haberin konusu olan şirketin adı (başlıktan gelir). Şirket kapısı bununla çalışır.
 *   - baglantilar: RSS HTML'indeki <a> metinleri (opsiyonel sınır ipucu; tech.eu ve arcticstartup verir).
 */
export function kisilerCikar(metin, secenekler = {}) {
  // D0: boru hattindan string olmayan girdi gelirse cokuyordu (TypeError). Sessizce bos sayilir.
  const t = typeof metin === "string" ? kirp(metin) : "";
  const sirket = typeof secenekler.sirket === "string" ? kirp(secenekler.sirket) : "";
  const korunan = (Array.isArray(secenekler.baglantilar) ? secenekler.baglantilar : [])
    .filter((x) => typeof x === "string").map(kirp).filter((x) => x.length > 3);
  const cumleler = cumleAyir(t);
  // D13: gecmis turu anlatan cumleler yatirimci aramasinin disinda birakilir.
  const fonCumleleri = cumleler.filter((c) => FON_IPUCU.test(c) && !GECMIS_TUR.test(c));

  // --- yatırımcılar ---
  // Lider: SADECE ilk eşleşen cümlenin ilk kalıp grubu. Sonraki "led by"ler
  // ("...investors led by the business developer Daniel Stern") lideri değiştirmez.
  let liderGrup = [];
  for (const c of fonCumleleri) {
    const g = cumledenCikar(c, LIDER_KALIP, korunan, sirket);
    if (g.length) { liderGrup = g[0]; break; }
  }
  const lider = liderGrup[0] ?? null;

  const katilanHam = [...liderGrup.slice(1)];   // eş-lider varsa katılan listesinin başına
  for (const c of fonCumleleri) for (const g of cumledenCikar(c, KATILAN_KALIP, korunan, sirket)) katilanHam.push(...g);
  let katilan = tekilleAdlar(katilanHam).filter((x) => !lider || anahtar(x) !== anahtar(lider));

  // --- kurucular ---
  const belirsizler = [];
  const kurucuMap = new Map();
  for (const a of kurucuAdaylari(t, cumleler, sirket, korunan)) {
    const ad = unvanSok(a.ad);
    if (!kisiMi(ad)) continue;
    if (!KURUCU_UNVAN.test(a.unvan) && a.unvan !== "kurucu") continue;
    // ŞİRKET KAPISI: unvan başka bir şirkete bağlanmışsa kurucu değildir.
    // "Napster co-founder Sean Parker", "founder of Revier Invest Heidelberg", "former CEO of OBOS".
    if (sirket && a.sirketIddia && anahtar(a.sirketIddia) !== anahtar(sirket)) continue;
    const parca = ad.toLowerCase().split(" ");
    const altKume = (x, y) => x.every((w) => y.includes(w));   // "marske" ⊂ "felix marske"
    const es = [...kurucuMap.keys()].find((k) => {
      const kp = k.split(" ");
      return kp[kp.length - 1] === parca[parca.length - 1] && (altKume(kp, parca) || altKume(parca, kp));
    });
    if (!es) kurucuMap.set(parca.join(" "), { ad, unvan: a.unvan || "kurucu" });
    else if (ad.length > kurucuMap.get(es).ad.length) { kurucuMap.delete(es); kurucuMap.set(parca.join(" "), { ad, unvan: a.unvan || "kurucu" }); }
  }
  let kurucular = [...kurucuMap.values()];

  // Test kancası: uydurma ad enjekte edilirse halüsinasyon kapısı reddetmeli.
  if (secenekler.__testAdEkle) kurucular.push({ ad: secenekler.__testAdEkle, unvan: "kurucu" });

  // --- halüsinasyon kapısı (kurucu + yatırımcı) ---
  const kapi = dogrula(t, [...kurucular.map((k) => k.ad), ...katilan, ...(lider ? [lider] : [])]);
  const redSet = new Set(kapi.red);
  kurucular = kurucular.filter((k) => !redSet.has(k.ad));
  katilan = katilan.filter((x) => !redSet.has(x));
  const liderSon = lider && !redSet.has(lider) ? lider : null;

  // --- belirsizler ---
  for (const x of [liderSon, ...katilan].filter(Boolean)) {
    if (belirsizMi(x)) belirsizler.push({ metin: x, neden: "firma mı şahıs mı belirsiz" });
  }
  if (/\bexisting investors also participated\b|mevcut yatırımcılar da katıldı/i.test(t)) {
    belirsizler.push({ metin: "existing investors", neden: "isimsiz yatırımcı grubu — isim uydurma" });
  }

  // --- D15: supheli cikti isaretleri (LLM'e yonlendirme icin) ---
  const supheli = [];
  for (const x of [liderSon, ...katilan].filter(Boolean)) {
    if (x.split(" ").length > 5) supheli.push({ metin: x, neden: "cok uzun — cümle kalıntısı olabilir" });
    else if (!FIRMA_EKI.test(x) && !kisiMi(x) && x.split(" ").length > 2) supheli.push({ metin: x, neden: "ne firma eki ne kişi adı biçiminde" });
  }
  if (/\b(?:and|ve)\s/.test([liderSon, ...katilan].filter(Boolean).join("|")) && !korunan.length)
    supheli.push({ metin: "and", neden: "firma adı içinde 'and' olabilir — bağlantı ipucu yok" });
  if (kapi.red.length) supheli.push({ metin: kapi.red.join(", "), neden: "kaynak metinde birebir bulunamadı" });

  const neAdaylar = neYapiyorSec(cumleler, sirket);
  const neYapiyor = neAdaylar[0] ?? null;

  return {
    lider_yatirimci: liderSon,
    katilan_yatirimcilar: katilan,
    kurucular,
    ne_yapiyor_kaynak_cumle: neYapiyor,
    // LLM doğru cümleyi bunlar arasından seçer (hepsi metinde birebir geçer).
    ne_yapiyor_adaylari: neAdaylar,
    belirsizler,
    // LLM'e devredilecek mi? (bkz. LLM_PROMPT)
    // D15: eski bayrak yalnizca "alan bos mu" diye bakiyordu; olculdu -> hatali cikti ureten 11 haberin
    // 9'unda false donuyor, yani yanlis yatirimci listesi hic denetlenmeden geciyordu. Artik SUPHE de bakiliyor.
    llm_gerekli: !liderSon || kurucular.length === 0 || !neYapiyor || belirsizler.length > 0 || supheli.length > 0,
    supheli,
    reddedilen_adlar: kapi.red,
  };
}

// ---------------------------------------------------------------------------
// 9. LLM'e devredilen iş — prompt metni ve beklenen şema (çağrıyı bu dosya YAPMAZ)
// ---------------------------------------------------------------------------

export const LLM_PROMPT = `Sana bir yatırım turu haberinin TAM METNİ ve regex ile çıkarılmış TASLAK veriliyor.
Görevin taslağı DÜZELTMEK ve EKSİKLERİ TAMAMLAMAK. Kural dışına çıkma.

MUTLAK KURALLAR
1. Metinde birebir geçmeyen hiçbir ad yazma. Her adı yazmadan önce metinde ara.
   Emin değilsen alanı null/[] bırak. Uydurma ad, boş alandan çok daha kötüdür.
2. Yatırımcı adını haberde geçtiği TAM HALİYLE yaz. Kısaltma, uzatma, düzeltme YOK.
   "Point72 Private Investments" -> aynen. "Point72" veya "Point72 Ventures" YAZMA: farklı tüzel kişiler.
3. Yatırımcı = BU tura para koyan. Şunlar yatırımcı DEĞİLDİR:
   - Yatırımcı firmanın çalışanı ("Espen Malmo, Managing Partner at Skyfall Ventures";
     "Sarra Zayani Partner at Hedosophia"; "Erik Wenngren, Partner at Spintop Ventures").
   - "executives from X, Y" kalıbındaki X, Y şirketleri (yatırımcı onların çalışanları, şirketler değil).
   - Yatırımcı firmanın portföy şirketleri ("Healthy.Capital ... has backed Pharmi, MS Sherpa, OpenUp").
   - Melek yatırımcının GEÇMİŞTE yönettiği şirketler
     ("Thomas Visti, former CEO of Universal Robots and Mobile Industrial Robots" -> yatırımcı Thomas Visti'dir,
      Universal Robots ve Mobile Industrial Robots DEĞİL).
   - Danışman ("Fynveur, together with its advisor, Invus" -> Invus yatırımcı değil).
   - Haberin sonundaki "benzer turlar" paragrafındaki şirketler ve onların yatırımcıları
     (eu-startups her yazının sonuna bunu ekliyor; Ponda yazısında 11 başka tur var).
4. İSİMSİZ ifadeler yatırımcı adı değildir: "existing investors also participated",
   "a group of angel investors", "prominent investors", "mevcut yatırımcılar da katıldı".
5. Kurucu = BU şirketin kurucusu/CEO'su. Şunlar kurucu DEĞİLDİR:
   - Başka şirketin kurucusu ("Napster co-founder Sean Parker", "Cleo founder Barney Hussey-Yeo",
     "Jan Oberhauser, founder of n8n", "Joseph Lubin, Ethereum co-founder").
   - Yatırımcı firmanın "Founding Partner"ı ("Emmet King, Founding Partner at J12").
   - Yönetim kurulu üyesi / danışman / başka şirketin eski CEO'su
     ("Daniel Kjørberg Siraj, former CEO of OBOS" -> melek yatırımcı, kurucu değil).
   - Yatırımcı firmanın kurucusu ("Daniel Stern (founder of Revier Invest Heidelberg)").
6. AYNI SOYADLI İKİ KURUCU AYRI KİŞİDİR ("Cem Ortabaş" ve "Kaan Ortabaş" -> ikisi de yazılır).
7. ne_yapiyor_kaynak_cumle: şirketin ne iş yaptığını anlatan, metinde BİREBİR geçen TEK cümle.
   Öncelikle taslaktaki ne_yapiyor_adaylari listesinden seç; hiçbiri uygun değilse metinden
   başka bir cümleyi BİREBİR kopyala. Kopyala; yeniden yazma, çevirme, kısaltma, birleştirme.
   Şu cümleler UYGUN DEĞİLDİR: paranın nereye harcanacağı ("will use the new funding to..."),
   yatırımcı yorumu, pazar büyüklüğü, gelecek planı. Uygun cümle yoksa null.
8. Eş-lider varsa (iki firma birlikte liderlik ettiyse) ikisini de lider_yatirimci dizisine yaz.

ÇIKTI: yalnız JSON, açıklama yok.

ŞEMA
{
  "lider_yatirimci": string[],                 // eş-lider olabilir; yoksa []
  "katilan_yatirimcilar": string[],            // haberdeki tam haliyle; yoksa []
  "kurucular": [{"ad": string, "unvan": string}],   // unvan: metindeki hali ("co-founder and CEO", "Kurucu Ortak")
  "ne_yapiyor_kaynak_cumle": string | null,    // metinde birebir geçen tek cümle
  "belirsizler": [{"metin": string, "neden": string}],  // "Lightspeed Ventures' Jeremy Liew" gibi firma/şahıs karışıklıkları
  "guven": {"lider": 0..1, "katilan": 0..1, "kurucular": 0..1}
}`;

// ÖLÇÜMLE BELİRLENEN İŞ BÖLÜMÜ — regex'in ÇÖZEMEDİĞİ, LLM'e kalan vakalar:
//  1. Firma adının içindeki "and": "Plug and Play Insurtech", "Danish Export and Investment Fund (EIFO)".
//     Metinde "SymbiaVC and Medin VC" (iki firma) ile aynı şekle sahip; ayırt edilemez.
//     RSS <a> bağlantı metinleri (secenekler.baglantilar) verilirse regex bunu da çözüyor;
//     eu-startups ve webrazzi bu bağlantıları vermiyor.
//  2. "former Lunar co-founders Ken Villum Klausen, Peter Andreasen and Joachim Strøjer Hansen"
//     — BAŞKA şirketin kurucuları olarak yazılmış ama AYNI ZAMANDA bu şirketin kurucuları.
//     Şirket kapısı bunları bilerek reddediyor (aksi halde "Napster co-founder Sean Parker" geçerdi).
//  3. Melek yatırımcının geçmişte yönettiği şirketler ("former CEO of Universal Robots and
//     Mobile Industrial Robots" -> ikinci şirket yatırımcı sanılıyor).
//  4. "X of Y" / "Y CEO X" bağlılık cümleleriyle noktalı virgüllü melek listeleri
//     ("Leib Lurie of US literacy nonprofit Kids Read Now; Robert Iskander, Chairman and CEO of
//     SchoolDay; ... Billingo CEO Albert Sárospataki") — hâlâ kirli çıkıyor, DOĞRULAMA AÇIK NOKTASI.
//  5. "ne yapıyor" cümlesi: 25 haberde 25/25 bulundu ve 25/25'i metinde birebir geçiyor, ama
//     hangisinin GERÇEKTEN "ne yapıyor" cümlesi olduğu elle yargı gerektiriyor — LLM seçmeli.
//  6. Kamu hibesi lideri ("received €1.94 million from the Estonian Business and Innovation
//     Agency's (EIS) Applied Research Programme") kalıp dışında.