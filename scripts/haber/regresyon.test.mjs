// Haber toplayıcı — regresyon testleri.
// Çalıştır: node scripts/haber/regresyon.test.mjs
// Ağ istemez (canlı bölüm ayrı: --canli bayrağıyla açılır).
//
// Buradaki her vaka GERÇEK bir hatadan doğdu; silme, sadece ekle.
import { turHaberiMi, duzMetin } from "./tur-haberi-mi.mjs";
import { kunyeCikar } from "./kunye.mjs";
import { kisilerCikar } from "./kisiler.mjs";
import { identityGate, nameInDomain } from "./domain.mjs";
import { ayniTur, puanla } from "./kuyruk.mjs";
import { sirketAdiCikar } from "./topla.mjs";
import { appStoreUygunMu } from "./varlik.mjs";
import { dogrula } from "./metin.mjs";

const R = [];
const t = (ad, ok) => R.push([ad, !!ok]);

// ── Dayanıklılık: bozuk bir RSS item'ı tüm koşuyu düşürmemeli ──
for (const [ad, fn] of [
  ["turHaberiMi(sayı)", () => turHaberiMi(123, {})],
  ["duzMetin(sayı)", () => duzMetin(123)],
  ["kunyeCikar(sayı)", () => kunyeCikar(123)],
  ["kisilerCikar(sayı)", () => kisilerCikar(12345)],
  ["kisilerCikar(bozuk opts)", () => kisilerCikar("x", { baglantilar: "abc" })],
  ["puanla({})", () => puanla({})],
  ["ayniTur({},{})", () => ayniTur({}, {})],
]) {
  let ok = true;
  try { fn(); } catch { ok = false; }
  t(`çökmüyor: ${ad}`, ok);
}

// ── Künye: yanlış haberden rakam SIZMAMALI ──
const K = (m, b) => kunyeCikar(m, b);
t("M&A: tur tutarı sızmıyor",
  !K("The deal values Hugging Face at $12.9 billion. Nvidia agreed to buy the company.",
     "Nvidia agrees to buy Hugging Face for $12.9BN").tutar.deger);
t("M&A: değerleme sızmıyor",
  !K("The deal values Hugging Face at $12.9 billion.",
     "Nvidia agrees to buy Hugging Face for $12.9BN").degerleme.deger);
t("gelir haberi: tutar sızmıyor",
  !K("Nvidia reported $96.2 billion in revenue.",
     "Nvidia, ikinci çeyrekte 96,2 milyar dolar gelir elde etti").tutar.deger);
t("haftalık derleme: tutar sızmıyor",
  !K("Last week we tracked more than 60 deals. Acme raised $30 million in a Series B.",
     "European tech weekly recap: 60 funding deals").tutar.deger);

// "IPO founder" KİŞİ tanımıdır, olay değil — gerçek turu silmemeli.
t("'IPO founder' gerçek turu silmiyor",
  K("Denmark's youngest IPO founder raises $7.5 million in a round co-led by Ethereal Ventures.",
    "Denmark's youngest IPO founder raises $7.5 million").tutar.deger === 7_500_000);

// Tavan dili kesin rakam olarak yazılamaz.
t("'up to / in talks' kesin sayılmıyor",
  K("Acme is in talks to raise up to $50 million in a Series B.",
    "Acme in talks to raise up to $50M").tutar.kesinlik !== "kesin");

// Türkçe: aynı cümlede değerleme + tur tutarı.
const tr = K("Zylo, 2,4 milyar dolar değerleme üzerinden 120 milyon dolar yatırım aldı.",
             "Zylo 120 milyon dolar yatırım aldı");
t("TR: tur tutarı 120M", tr.tutar.deger === 120_000_000);
t("TR: değerleme 2,4 mlr, ayrı alanda", tr.degerleme.deger === 2_400_000_000);

// ── Kimlik kapısı: yanlış şirketin sitesi elenmeli ──
// hubx.com bir ABD B2B portalı; midas.com.tr bir altın takı üreticisi.
for (const [ad, dom, bas] of [
  ["HubX", "hubx.com", "HUBX Portal — B2B Wholesale"],
  ["Midas", "midas.com.tr", "Midas Altın Takı"],
]) {
  t(`kimlik kapısı eliyor: ${ad} → ${dom}`,
    identityGate({
      companyName: ad,
      candidate: { domain: dom, bag: "zayif" },
      page: { ok: true, reach: "ok", title: bas, siteName: bas, text: "wholesale marketplace" },
      context: ["Point72", "İzmir"],
    }).pass === false);
}
t("kısa domain tuzağı: bit.ly ≠ Bitpanda", nameInDomain("bit.ly", "Bitpanda") === false);

// ── Dedupe ──
const nv = { sirket_adi: "Nvidia", sirket_domain: "nvidia.com", tarih: "2026-08-28", tutar_usd: 12.9e9, ulke: "US" };
t("aynı şirketin çelişen tutarlı iki haberi birleşmiyor",
  !ayniTur(nv, { ...nv, tarih: "2026-08-27", tutar_usd: 96.2e9 }));
t("aynı tur iki kaynakta birleşiyor", !!ayniTur(nv, { ...nv, tarih: "2026-08-27" }));
t("jenerik ad tuzağı: motion.one ≠ usemotion.com",
  !ayniTur({ sirket_adi: "Motion", sirket_domain: "motion.one", tarih: "2026-08-28" },
           { sirket_adi: "Motion", sirket_domain: "usemotion.com", tarih: "2026-08-28" }));

// ── Puanlama ──
const simdi = new Date("2026-08-28");
const saglam = puanla({ ...nv, tur_tipi: "series-a", lider: "X" }, simdi);
t("geçersiz tarih maksimum tazelik almıyor",
  puanla({ ...nv, tarih: "yakında", tur_tipi: "series-a", lider: "X" }, simdi).kirilim.tazelik < saglam.kirilim.tazelik);
t("künye kapısı: tutarsız + tursuz kayıt eksik işaretleniyor",
  puanla({ sirket_adi: "X" }).kunye_eksik === true);

// ── Şirket adı çıkarımı ──
// 22 canlı başlık, elle etiketlendi. Ad hem kimlik kapısını hem dedupe'u besliyor:
// yanlış ad = yanlış şirketin videosu, ya da aynı turun iki ayrı kayıt olması.
const AD_VAKALARI = [
  ["ColibriTD secures €4M to scale its quantum simulation platform", "ColibriTD"],
  ["Motion lands $2M to expand humanoid robot deployments across Europe", "Motion"],
  ["Certain Energy raises £10M Series A for long-duration battery storage", "Certain Energy"],
  ["Stability AI raises $76M, with Warner and Sony investing", "Stability AI"],
  ["Lunar co-founders launch AI audit startup Repodo, raising over €8M", "Repodo"],
  ["Dutch AI-native financial services startup Neno secures €6.6M for European expansion", "Neno"],
  ["Biomaterials company Ponda closes crowdfunding round at €1.6 million", "Ponda"],
  ["Maastricht-based Clementine raises €1.7 million to scale its AI-powered hearing care platform", "Clementine"],
  ["Heidelberg-based Revier Therapeutics launches with €6 million to develop cardiometabolic therapies", "Revier Therapeutics"],
  ["Montpellier-based dental robotics startup Lupin Dental closes €15 million Series A round", "Lupin Dental"],
  ["Dolandırıcılık önleme girişimi Yardstik, 30 milyon dolar yatırım aldı", "Yardstik"],
  ["HubX, 1,2 milyar dolar değerleme üzerinden yaklaşık 75 milyon dolar yatırım aldı", "HubX"],
  ["Yapay zeka girişimi Deep Cogito, 43 milyon dolar yatırım aldı", "Deep Cogito"],
  ["Kişisel yapay zeka asistanları geliştiren Instinct, 250 milyon dolar yatırım aldı", "Instinct"],
  ["Danish os.energy raises €1 million to develop AI-powered tools for household energy use", "os.energy"],
  ["Norway’s Volve raises $3 million seed to tackle construction’s costly pre-project decisions with AI", "Volve"],
  ["Swedish Solace Care secures €2.1 million pre-seed to expand end-of-life platform across Europe", "Solace Care"],
  // Başlıkta şirket adı HİÇ geçmiyor — uydurmak yerine null.
  ["Former Lunar executives land €8.2 million pre-seed to build an AI-native audit firm from the ground up", null],
];
let adDogru = 0;
for (const [baslik, beklenen] of AD_VAKALARI) {
  if (sirketAdiCikar(baslik) === beklenen) adDogru++;
}
t(`şirket adı: ${adDogru}/${AD_VAKALARI.length} başlık doğru`, adDogru === AD_VAKALARI.length);

// Türkçe ayrılma hâli: Webrazzi'nin standart kalıbı ("X'tan yatırım aldı").
t("TR ayrılma hâli: yatırımcı çıkarılıyor",
  kisilerCikar("HubX, Point72 Private Investments’tan 75 milyon dolar yatırım aldı.").lider_yatirimci
    === "Point72 Private Investments");
// Yatırımcı adı KISALTILMAZ: Point72 Private Investments ≠ Point72 Ventures ≠ Point72.
t("yatırımcı adı tam hâliyle korunuyor",
  !/^Point72$/.test(kisilerCikar("HubX, Point72 Private Investments’tan 75 milyon dolar yatırım aldı.").lider_yatirimci ?? ""));


// ── App Store kimlik kapısı ───────────────────────────────────────────────
// 2026-09-07: Crusoe paketine "Crusoe Squeaky Ball Bubble POP" (satıcı:
// Cristian Cendon Marquez) girdi. Eski kapı uygulama ADINDA şirket adını
// arıyordu; ayrımı yapan alan satıcı kimliği. Vakalar iTunes'dan ölçüldü.
{
  const V = [
    // [not, sonuç, şirket, domain, beklenen]
    ["Crusoe: köpek oyunu",   { trackName: "Crusoe Squeaky Ball Bubble POP", sellerName: "Cristian Cendon Marquez", sellerUrl: "https://doggymakers.com" }, "Crusoe", "crusoe.ai", false],
    ["Crusoe: adiss",         { trackName: "Crusoe", sellerName: "ASESORAMIENTO Y DESARROLLO DE SISTEMAS INFORMATICOS SL", sellerUrl: null }, "Crusoe", "crusoe.ai", false],
    ["Atira Link: şahıs",     { trackName: "Atira Link", sellerName: "Mehde Mohamad", sellerUrl: "https://atiralink.com" }, "Atira", "atira.ai", false],
    ["HubX: tüzel ad",        { trackName: "AI Video - AI Video Generator", sellerName: "HUBX YAZILIM HIZMETLERI ANONIM SIRKETI", sellerUrl: "https://aivideoart.co/" }, "HubX", "hubx.co", true],
    ["Ultrahuman: tüzel ad",  { trackName: "Ultrahuman", sellerName: "ULTRAHUMAN HEALTHCARE PRIVATE LIMITED", sellerUrl: "https://www.ultrahuman.com" }, "Ultrahuman", "ultrahuman.com", true],
    ["Midas: marka ≠ domain", { trackName: "Midas: Borsa Hisse Alım Satım", sellerName: "MIDAS FINANSAL TEKNOLOJILER AS", sellerUrl: "https://www.getmidas.com/" }, "Midas", "midas.com.tr", true],
    ["sellerUrl domain yolu", { trackName: "Bambaşka Ad", sellerName: "Holding A.S.", sellerUrl: "https://www.getir.com/x" }, "Getir", "getir.com", true],
    ["kısa ad elenir",        { trackName: "AI Score", sellerName: "AI Score Ltd", sellerUrl: null }, "AI", "aiscore.ai", false],
  ];
  let ok = true;
  for (const [not, r, ad, dom, bekle] of V) {
    if (appStoreUygunMu(r, ad, dom) !== bekle) { ok = false; console.log(`     ✗ ${not}`); }
  }
  t("App Store kimlik kapısı: 8/8 vaka", ok);
}


// ── Uydurma kapısı: cümle başı büyük harfi ada dahil etmemeli ─────────────
// 2026-09-07: "Turda **Mubadala Capital** yer aldı." reddedildi çünkü çok
// sözcüklü ad taraması "Turda"yı adın parçası saydı. Tek sözcük kapısında bu
// istisna zaten vardı. Gevşetme uydurmayı geçirmemeli — iki yön de sınanır.
{
  const makale = "Tura Atreides Management ve Valor Equity Partners ortaklasa liderlik etti. "
    + "Turda Mubadala Capital yer aldi. Sirket 2018 yilinda kuruldu.";
  const kayit = { kunye: { tutar: { deger: 3000000000, usd: 3000000000 } } };
  const ko = (bloklar) => dogrula({ olcek: bloklar }, makale, kayit);

  const kabul = [
    ["cümle başı + gerçek ad", "Turda **Mubadala Capital** yer aldı."],
    ["cümle başı + iki gerçek ad", "Tura **Atreides Management** ve **Valor Equity Partners** liderlik etti."],
    ["ad cümle başındayken", "**Mubadala Capital** turda yer aldı."],
  ];
  const ret = [
    ["cümle başı + UYDURMA ad", "Turda Hayali Sermaye Fonu yer aldı."],
    ["cümle ortası uydurma ad", "Şirket Hayali Sermaye ile çalışıyor."],
    ["uydurma tek özel ad", "Şirket Ankara'da ofis açtı."],
    ["uydurma sayı", "Şirketin 4200 çalışanı var."],
  ];
  let ok = true;
  for (const [not, c] of kabul) {
    const r = ko([c]);
    if (r.sorunlar.length) { ok = false; console.log(`     ✗ geçmeliydi: ${not} → ${r.sorunlar[0]}`); }
  }
  for (const [not, c] of ret) {
    const r = ko([c]);
    if (!r.sorunlar.length) { ok = false; console.log(`     ✗ ELENMELİYDİ: ${not}`); }
  }
  t("uydurma kapısı: 3 kabul + 4 ret", ok);
}

// ── Soru-cevap blokları da kapıdan geçmeli ───────────────────────────────
// 2026-09-07: sorular alanı dogrula()'da tanınmıyordu; yayinla.mjs onu ham
// dosyadan okuduğu için FAQ cevapları hiç denetlenmeden yayına gidiyordu.
{
  const makale = "Sirketi Chase Lochmiller ve Cully Cavness kurdu.";
  const kayit = { kunye: { tutar: { deger: 1, usd: 1 } } };
  const gecer = dogrula({ sorular: [{ soru: "Kurucular kim?", cevap: "**Chase Lochmiller** ve **Cully Cavness**." }] }, makale, kayit);
  const duser = dogrula({ sorular: [{ soru: "Kurucular kim?", cevap: "**Ahmet Yilmaz** ve **Cully Cavness**." }] }, makale, kayit);
  t("soru-cevap kapıdan geçiyor", gecer.sorular !== undefined || gecer.metinler.sorular?.length === 1);
  t("soru-cevap uydurma adı eliyor", duser.sorunlar.length === 1 && !duser.metinler.sorular);
}

// ── Rapor ──
let bad = 0;
for (const [ad, ok] of R) {
  console.log(`${ok ? "  ✓" : "  ✗ BAŞARISIZ"}  ${ad}`);
  if (!ok) bad++;
}
console.log(`\n${R.length - bad}/${R.length} geçti`);

// ── Canlı bölüm (opsiyonel): node scripts/haber/regresyon.test.mjs --canli ──
if (process.argv.includes("--canli")) {
  const FEEDS = {
    "tech.eu": "https://tech.eu/feed/",
    "eu-startups": "https://www.eu-startups.com/feed/",
    "webrazzi": "https://webrazzi.com/feed/",
    "arcticstartup": "https://arcticstartup.com/feed/",
  };
  const items = (xml) => [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => {
    const g = (tag) => {
      const r = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`).exec(m[1]);
      return r ? r[1].replace(/^<!\[CDATA\[|\]\]>$/g, "").trim() : "";
    };
    return { baslik: g("title"), metin: g("content:encoded") || g("description") };
  });

  console.log("\nCANLI RSS:");
  let tot = 0, tur = 0, uc = 0, tam = 0, err = 0;
  for (const [ad, url] of Object.entries(FEEDS)) {
    let its = [];
    try {
      its = items(await (await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } })).text());
    } catch (e) { console.log(`  ${ad}: çekilemedi (${e.message})`); continue; }
    let n = 0;
    for (const i of its) {
      tot++;
      try {
        if (!turHaberiMi(i.baslik, i.metin).evet) continue;
        n++; tur++;
        const m = duzMetin(i.metin), k = kunyeCikar(m, i.baslik), ki = kisilerCikar(m);
        const dolu = [
          k.tutar.deger,
          k.tur_tipi.deger !== "belirsiz" && k.tur_tipi.deger,
          ki.lider_yatirimci?.deger || ki.katilan_yatirimcilar?.length,
          ki.kurucular?.length,
        ].filter(Boolean).length;
        if (dolu >= 3) uc++;
        if (dolu === 4) tam++;
      } catch { err++; }
    }
    console.log(`  ${ad.padEnd(14)} ${String(its.length).padStart(2)} item → ${n} tur haberi`);
  }
  const pct = (x) => (tur ? Math.round((x / tur) * 100) : 0);
  console.log(`  ${tot} item · ${tur} tur haberi · ≥3/4 alan: ${uc} (%${pct(uc)}) · 4/4: ${tam} (%${pct(tam)}) · ${err} çökme`);
}

process.exit(bad ? 1 : 0);
