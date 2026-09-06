// Haber toplayıcı — tur haberi sınıflandırıcısı (saf fonksiyon, ağ isteği yok, bağımlılık yok).
// Girdi: RSS item'ının başlığı + content:encoded tam metni. Çıktı: { evet, guven, gerekce }.
//
// TASARIM TERCİHİ — YANLIŞ POZİTİF, YANLIŞ NEGATİFTEN PAHALI:
// Yanlış haberden içerik paketi üretilir; kaçan haber ise bir sonraki turda yakalanır.
// Bu yüzden (a) eşik ölçümle seçildi, (b) tutar zorunlu kılındı,
// (c) veto katmanı puanı ezer — sınırda kalınca "hayır" denir.
//
// TASARIM TERCİHİ — SADECE BAŞLIK + LEDE OKUNUR (ilk 900 karakter):
// Ölçüldü: profil/röportaj yazılarının gövdesinde tur cümlesi geçiyor
// (tech.eu "Principle" yazısı 15 KB'ın ortasında "raised $2.5 million in pre-seed" diyor);
// eu-startups her yazının sonuna "benzer turlar" paragrafı ekliyor (Ponda yazısında 11 başka tur).
// Tam metne bakan sınıflandırıcı bunların hepsinde yanlış pozitif veriyor.
//
// BAGIMSIZ DOGRULAMA SONRASI 5 DUZELTME (132 yeni canli item, elle etiketli, 30 Ag 2026):
// 1. duzMetin(sayi/nesne) COKUYORDU -> String(...) ile sarmalandi.
// 2. Derleme vetosu tech.eu'nun HAFTALIK formatini hic yakalamiyordu ("weekly recap",
//    "Last week, we tracked"). 16 derlemenin 15'i yalniz 1 puanlik esik marjiyla eleniyordu;
//    lede'sinde "led by" gecen gercekci bir varyant 7/11 alip GECIYORDU.
// 3. Basliktaki tutar, basliktaki tur fiili/asamasi olmadan 2 puan veriyordu; ciro/degerleme
//    haberleri bu bedava 2 puanla esige tirmaniyordu (Verda "$100M revenue run rate" -> 5/11, YP).
//    Tutar puani artik tur fiili VEYA asama sartina bagli.
// 4. Hibe kurtarma cekirdegi asama kelimesi sart kosuyordu; asamasiz gercek turlar (HexSeed
//    "early-stage funding ... led by Carbon13") hibe vetosuna takiliyordu. Fiil+tur ismi de kabul edildi.
// 5. TR lede kalibi "yatirim yapti"/"yatirim alarak" bicimlerini kaçırıyordu (TTTech Auto).
// Ayrica duzMetin para birimi entity'lerini (&#8364; &pound;) BOSLUGA cevirip tutari yok ediyordu.
//
// OLCUM (222 item = onceki 90 + bagimsiz 132): TP=87 FP=0 FN=6 · kesinlik %100 · duyarlilik %93.5
// Esik taramasi (222, bu surum): ESIK=3 -> 1 YP; ESIK=4 -> 0 YP, %94.6; ESIK=5 -> 0 YP, %93.5.
// ESIK=5 KORUNDU: 2 puanlik marj, tek bir sponsorlu advertorial'a tercih edildi.

const LEDE_UZUNLUK = 900;   // olumlu sinyaller burada aranır
const VETO_UZUNLUK = 400;   // veto yalnız "iddia" bölgesinde aranır (başlık + ilk ~2 cümle)
const ESIK = 5;

// HTML'i düz metne indir (RSS content:encoded ham HTML gelir).
export function duzMetin(html) {
  return String(html ?? "")
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#8217;|&#8216;|&#039;|&apos;/g, "'")
    .replace(/&#8220;|&#8221;|&quot;/g, '"')
    .replace(/&#8211;|&#8212;|&ndash;|&mdash;/g, "-")
    // Para birimi entity'leri: asagidaki genel "&#\d+; -> bosluk" kurali bunlari
    // yutup tutari yok ediyordu (&#8364;5 million -> " 5 million" -> "tutar yok").
    .replace(/&#8364;|&euro;/gi, "€").replace(/&#163;|&pound;/gi, "£").replace(/&#36;/g, "$").replace(/&#8378;/g, "₺")
    .replace(/&amp;/g, "&").replace(/&nbsp;/g, " ")
    .replace(/&#\d+;|&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ").trim();
}

// --- Olumlu sinyaller -------------------------------------------------------
// Para tutarı: €4M, $12.9BN, £10M, 30 milyon dolar, €800k ...
const TUTAR = /[€$£₺]\s?\d[\d.,]*\s?(?:k|m|bn|b|milyon|milyar|million|billion|thousand)?\b|\b\d[\d.,]*\s?(?:milyon|milyar|bin)\s+(?:dolar|euro|avro|sterlin|lira|tl)\b|\b\d[\d.,]*\s?(?:million|billion)\s+(?:euros?|dollars?|pounds?|kronor)\b/i;
// Başlıkta tur fiili. "receive/receives" BİLEREK YOK: ölçümde bu fiilin geçtiği
// 2 vakanın 2'si de hibe çıktı (ÄIO/EIS, Readily/Gates Foundation).
const BASLIK_FIIL = /\b(raises?|raised|raising|secures?|secured|securing|lands?|landed|nets?|netted|bags?|bagged|closes?|closed|closing|scores?|snaps up|picks up)\b|yat[ıi]r[ıi]m ald[ıi]|yat[ıi]r[ıi]m turu|turunu (kapat|tamamla)/i;
// Tur aşaması
const ASAMA = /\b(pre-?seed|seed|series\s?[a-j]|angel (round|funding|investment)|bridge round)\b|\b(pre-?tohum|tohum turu)\b|\b[a-j] serisi\b/i;
// Lede'de tur cümlesi. TR kısmı genişletildi: "yatırım yaptı" (TTTech Auto) ve
// "yatırım alarak" (GOAT) biçimleri eskiden kaçıyordu.
const LEDE_TUR = /\b(rais\w+|secur\w+|clos\w+|land\w+|attract\w+|bagg?\w+)\b[^.]{0,90}\b(round|funding|financing|investment|capital)\b|\b(round|funding|financing)\b[^.]{0,60}\b(?:co-?)?led by\b|yat[ıi]r[ıi]m (ald|al[ıi]|turu|yapt)|turuna\b[^.]{0,80}liderlik/i;
// Lider yatırımcı ifadesi
const LIDER = /\b(led by|co-?led by|backed by)\b|liderlik etti|öncülüğ[üu]nde/i;

// --- Veto katmanı (başlık + ilk ~2 cümlede aranır; puanı ezer) --------------
// PENCERE DAR TUTULDU (ölçüldü): Webrazzi'nin Socure turu haberinde lede'nin
// 742. karakterinde "turun bir bölümü ... satın alındığı duyurulan Fravity AI için
// kullanıldı" geçiyor. 900 karakterlik pencere bu ikincil olguyu M&A sanıp gerçek
// turu eliyordu. Haberin ASIL İDDİASI başlıkta ve ilk iki cümlededir.
const VETOLAR = [
  // "recap" ve "last week, we tracked": tech.eu'nun HAFTALIK derleme formati.
  // Bunlar olmadan 16 derlemenin 15'i yalniz 1 puanlik marjla eleniyordu.
  ["derleme", /round-?up|\bwrap\b|\brecap\b|deals of the week|(?:this|last) week,? we (tracked|covered)|weekly funding|haftan[ıi]n (yat[ıi]r[ıi]m|haber)|g[üu]ndem[ıi]? ?#\s?\d|bu hafta(?:ki)? (?:öne ç[ıi]kan|yat[ıi]r[ıi]m|haber|gündem)|top-?funded|\btop \d+\b|\bH[12] 20\d\d\b/i],
  ["fon kapanışı", /\b(launch\w*|unveil\w*|clos\w*|rais\w*|announc\w*)\b[^.]{0,60}\b(venture (firm|fund)|vc (firm|fund)|new fund|fund I{1,3}\b|\d(?:st|nd|rd|th) fund)\b|targeting [€$£][^.]{0,60}to invest|fon(unu)? kapat|yeni fonu(nu)?/i],
  ["satın alma/birleşme", /\bacquir\w+|\bacquisition\b|\bto buy\b|\bbuys\b|\bmerger\b|\btakeover\b|sat[ıi]n al|birleşme|devral/i],
  // "IPO founder" bir KİŞİ tanımıdır, olay değil (arctic: "Denmark's youngest IPO founder raises $7.5M").
  ["halka arz", /\bIPO\b(?!\s+(?:founder|co-?founder|veteran|alumn))|halka arz|nasdaq|business combination|begins? trading|goes? public|borsaya/i],
  ["hibe/kredi", /\bgrants?\b|\bgranted\b|\bloans?\b|non-?dilutive|\bhibe\b|business and innovation agency|applied research programme|federal funding|devlet destek|kredi ald/i],
  ["iş birliği", /\bpartner(s|ed|ing)? with\b|\bpartnership with\b|\bin partnership\b|anlaşma(s[ıi])? imzala|iş ?birliği|teams? up with/i],
  ["finansal sonuç", /gelir elde etti|quarterly results|\bQ[1-4] (results|earnings)|çeyre(kte|ğinde)/i],
];

// KURTARMA: gerçek turların lede'sinde hibe/kredi İKİNCİL kalem olarak sık geçiyor
// (SnerpaPower: "€3M seed round led by Encevo ... as well as a €400k grant";
//  Velatir: "€5M seed funding in a round co-led by ... as well as a match loan").
// Çekirdek iki parça ayrı aranır, çünkü "Series A financing round. The round was led by X"
// kalıbı cümle sınırını aşıyor. Çekirdek varsa hibe ve halka arz vetoları kalkar.
// Derleme / fon kapanışı / M&A vetoları SERT kalır: orada haberin konusu zaten başkadır.
// AŞAMA ŞARTI GEVŞETİLDİ: aşama kelimesi geçmeyen gerçek turlar da var
// (HexSeed: "raised over €700k in early-stage funding. The funding was led by Carbon13").
// Ayırt edici olan "led by"dir: gerçek hibe/kredide lider yatırımcı olmaz
// (Readily/Gates Foundation, LITILIT/kalkınma bankası kredisi, PLD Space/ESA ödülü) — ölçüldü.
const CEKIRDEK_ASAMA = /\b(pre-?seed|seed|series\s?[a-j]|angel)\b[^.]{0,80}\b(round|funding|financing)\b|\b(rais\w+|secur\w+|clos\w+)\b[^.]{0,80}\b(round|funding|financing)\b/i;
const CEKIRDEK_LIDER = /\b(?:co-?)?led by\b|liderlik etti|öncülüğ[üu]nde/i;
const KURTARILABILIR = new Set(["hibe/kredi", "halka arz"]);

/**
 * Bir RSS item'ı tek-şirketlik yatırım turu haberi mi?
 * @param {string} baslik RSS <title>
 * @param {string} metin  RSS <content:encoded> (ham HTML olabilir)
 * @returns {{evet: boolean, guven: number, gerekce: string}}
 */
export function turHaberiMi(baslik, metin) {
  const b = duzMetin(baslik);
  const lede = duzMetin(metin).slice(0, LEDE_UZUNLUK);
  const iddia = `${b}. ${lede.slice(0, VETO_UZUNLUK)}`;

  const cekirdek = CEKIRDEK_ASAMA.test(iddia) && CEKIRDEK_LIDER.test(iddia);
  for (const [ad, re] of VETOLAR) {
    const m = iddia.match(re);
    if (!m) continue;
    if (cekirdek && KURTARILABILIR.has(ad)) continue; // ikincil kalem, haberin konusu değil
    return { evet: false, guven: 0.9, gerekce: `veto: ${ad} ("${m[0].trim().slice(0, 40)}")` };
  }

  const tutarVar = TUTAR.test(b) || TUTAR.test(lede);
  if (!tutarVar) return { evet: false, guven: 0.85, gerekce: "tutar yok" };

  const puanlar = [
    [BASLIK_FIIL.test(b), 2, "başlıkta tur fiili"],
    // Başlıktaki tutar TEK BAŞINA puan vermez: ciro/değerleme/ceza rakamları da başlıkta
    // tutar olarak görünüyor ("Verda ... reaching $100M revenue run rate" -> yanlış pozitifti).
    [TUTAR.test(b) && (BASLIK_FIIL.test(b) || ASAMA.test(b)), 2, "başlıkta tur tutarı"],
    [ASAMA.test(b), 2, "başlıkta tur aşaması"],
    [LEDE_TUR.test(lede), 2, "lede'de tur cümlesi"],
    [ASAMA.test(lede), 2, "lede'de tur aşaması"],
    [LIDER.test(lede), 1, "lider yatırımcı"],
  ];
  const puan = puanlar.reduce((t, [v, p]) => t + (v ? p : 0), 0);
  const nedenler = puanlar.filter(([v]) => v).map(([, , ad]) => ad);

  const evet = puan >= ESIK;
  // Güven: eşiğe uzaklıkla artar, sınırdaki kararlarda düşük kalır. OLASILIK DEĞİLDİR.
  const guven = Math.min(0.97, 0.5 + Math.abs(puan - ESIK + 0.5) * 0.09);
  return { evet, guven: Number(guven.toFixed(2)), gerekce: `puan ${puan}/11 — ${nedenler.join(", ") || "sinyal yok"}` };
}