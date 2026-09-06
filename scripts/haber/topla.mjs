// Haber toplayıcı — ORKESTRASYON.
// 4 tam metin RSS kaynağını çeker, tur haberlerini ayıklar, künyeyi çıkarır,
// şirket domainini çözer ve kuyruk/ altına JSON yazar.
//
// SIFIR npm bağımlılığı, SIFIR API anahtarı. GitHub Actions'ta koşar.
// Kullanım:
//   node scripts/haber/topla.mjs              → kuru koşu, ekrana yazar
//   node scripts/haber/topla.mjs --yaz        → kuyruk/ altına JSON yazar
//   node scripts/haber/topla.mjs --limit 5    → en fazla 5 aday işler (domain çözümü ağ istiyor)
//
// İş bölümü — her modül kendi testine sahip:
//   tur-haberi-mi.mjs  bu item bir tur haberi mi
//   kunye.mjs          tutar / para birimi / tur tipi / değerleme  (LLM'e ASLA sorulmaz)
//   kisiler.mjs        lider + katılan yatırımcılar, kurucular, "ne iş yapıyor" cümlesi
//   domain.mjs         şirket domaini + kimlik kapısı (yanlış şirketin sitesini eler)
//   kuyruk.mjs         dedupe + puanlama + dosya yazımı

import { turHaberiMi, duzMetin } from "./tur-haberi-mi.mjs";
import { kunyeCikar } from "./kunye.mjs";
import { kisilerCikar } from "./kisiler.mjs";
import { resolveCompanyDomain } from "./domain.mjs";
import { isle } from "./kuyruk.mjs";

// ── Kaynaklar ────────────────────────────────────────────────────────────
// Dördü de content:encoded'da TAM METİN veriyor → tek çekimle 4 alan da çıkıyor,
// ek istek yok, tarayıcı yok. Google News BİLEREK yok: linkleri curl ile çözülmüyor
// (Angular kabuğu döner) ve item'larının ~%20'si haftalık derleme.
export const KAYNAKLAR = [
  { ad: "tech.eu", url: "https://tech.eu/feed/", ulke: null },
  { ad: "eu-startups", url: "https://www.eu-startups.com/feed/", ulke: null },
  { ad: "webrazzi", url: "https://webrazzi.com/feed/", ulke: "TR" },
  { ad: "arcticstartup", url: "https://arcticstartup.com/feed/", ulke: null },
];

// Puanlamada büyüklük karşılaştırması için kaba kur. Kullanıcıya ASLA gösterilmez,
// yayınlanan metne ASLA girmez — orada haberdeki para birimi aynen kullanılır.
const KUR_USD = { USD: 1, EUR: 1.08, GBP: 1.27, TRY: 0.029, SEK: 0.095, NOK: 0.093, DKK: 0.145, CHF: 1.12 };

const UA = "Mozilla/5.0 (compatible; StartupDoktoruHaber/1.0)";
const ZAMAN_ASIMI = 20_000;

// ── RSS ayrıştırma (bağımlılıksız) ───────────────────────────────────────
const etiket = (govde, ad) => {
  const m = new RegExp(`<${ad}[^>]*>([\\s\\S]*?)</${ad}>`, "i").exec(govde);
  return m ? m[1].replace(/^\s*<!\[CDATA\[|\]\]>\s*$/g, "").trim() : "";
};

export function rssAyristir(xml) {
  return [...String(xml ?? "").matchAll(/<item[\s>][\s\S]*?<\/item>/gi)].map((m) => {
    const g = m[0];
    return {
      baslik: etiket(g, "title"),
      url: etiket(g, "link") || etiket(g, "guid"),
      icerik: etiket(g, "content:encoded") || etiket(g, "description"),
      tarih: etiket(g, "pubDate") || etiket(g, "dc:date"),
    };
  });
}

async function cek(url) {
  const c = new AbortController();
  const z = setTimeout(() => c.abort(), ZAMAN_ASIMI);
  try {
    const r = await fetch(url, { headers: { "user-agent": UA }, signal: c.signal, redirect: "follow" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.text();
  } finally { clearTimeout(z); }
}

// ── Şirket adı çıkarımı ──────────────────────────────────────────────────
// Ad iki yerde taşıyıcı: kimlik kapısı (doğru şirketin sitesi mi) ve dedupe.
// Yanlış ad = yanlış sitenin videosu, ya da aynı turun iki ayrı kayıt olması.
// Ölçüldü: naif "ilk fiile kadar al" kuralı 22 başlığın 9'unda şehir/tanımlayıcı
// döndürüyordu ("Berlin", "Biomaterials company Ponda", "Norway's Volve").

// Başlıktan atılacak ön ekler — sırayla uygulanır.
const ON_EKLER = [
  /^\s*[A-ZÀ-Ý][\w.'-]*(?:['’]s)\s+/,                       // "Norway's Volve"
  /^\s*[A-ZÀ-Ý][\w-]*-based\s+/i,                            // "Berlin-based Nanolope"
  /^\s*(?:danish|swedish|norwegian|finnish|icelandic|dutch|german|french|spanish|italian|portuguese|polish|estonian|latvian|lithuanian|belgian|austrian|swiss|irish|greek|czech|romanian|bulgarian|croatian|slovenian|slovak|hungarian|turkish|british|uk|us|european|nordic|baltic)\s+/i,
];
// "…startup/company/firm X" — tanımlayıcı öbek adın ÖNÜNDE durur, adı ondan sonrası verir.
const TANIMLAYICI = /\b(?:startup|scale-?up|company|firm|platform|venture|girişimi|şirketi|geliştiren|sunan|kuran)\s+/i;
// Öznesi ŞİRKET değil KİŞİ olan başlıklar: "Former Lunar executives land €8.2M…"
// Burada şirketin adı başlıkta hiç geçmiyor; uydurmak yerine null dönülür.
const KISI_OZNE = /^\s*(?:former|ex-)\s|\b(?:co-?founders?|executives?|founders?|alumni|veterans?)\s+(?:launch|land|raise|secure|start|build)/i;
// Fiil / rakam: adın bittiği yer.
const FIIL = /\s+\b(?:raises?|raised|raising|secures?|secured|lands?|landed|nets?|netted|bags?|bagged|closes?|closed|closing|scores?|snaps?\s+up|picks?\s+up|gets?|receives?|launches|attracts?)\b|\s+\b(?:yat[ıi]r[ıi]m|milyon|milyar)\b/i;

// Bir metin parçasındaki SON bitişik büyük-harfle-başlayan kelime öbeği.
// Türkçe başlıklarda tanımlayıcı önde, ad sonda: "Yapay zeka girişimi Deep Cogito" → "Deep Cogito".
function sonOzelAdObegi(s) {
  const kelimeler = s.trim().split(/\s+/).filter(Boolean);
  let son = [];
  for (let i = kelimeler.length - 1; i >= 0; i--) {
    if (/^[A-ZÀ-ÝÇĞİÖŞÜ]/.test(kelimeler[i])) son.unshift(kelimeler[i]);
    else if (son.length) break;
  }
  return son.join(" ");
}

export function sirketAdiCikar(baslik) {
  const b = duzMetin(baslik).replace(/^[\s"“”'‘’]+/, "");
  if (!b) return null;
  // KISI_OZNE burada DEĞİL, aşağıda tanımlayıcı öbek aranıp bulunamayınca bakılır:
  // "Lunar co-founders launch AI audit startup Repodo" hem kişi öznesi hem de adı taşıyor.

  const trMi = /[,]\s*\d|\byat[ıi]r[ıi]m\b|\bmilyon\b|\bmilyar\b|\bdeğerleme\b/i.test(b);

  if (trMi) {
    // Webrazzi kalıbı: "<tanımlayıcı> <AD>, N milyon dolar yatırım aldı"
    const oncesi = b.split(",")[0] ?? b;
    const ad = sonOzelAdObegi(oncesi.split(FIIL)[0] ?? oncesi);
    return ad ? ad.slice(0, 60) : null;
  }

  // SIRA ÖNEMLİ: önce fiilde kes. Tanımlayıcı sözcükler ("platform", "firm")
  // fiilden SONRA da geçiyor ve tüm başlıkta aranırsa yanlış yeri işaret ediyor
  // (ölçüldü: "…expand end-of-life platform across Europe" → "across Europe").
  let ozne = b.split(FIIL)[0] ?? b;

  const t = TANIMLAYICI.exec(ozne);
  if (t) {
    // Tanımlayıcı öbek adın ÖNÜNDE: "…audit startup Repodo", "dental robotics startup Lupin Dental".
    // Bu durumda özne kişi olsa bile şirket adı başlıkta geçiyor demektir.
    ozne = ozne.slice(t.index + t[0].length);
  } else {
    // Özne kişi ve ad hiç geçmiyorsa uydurma: "Former Lunar executives land €8.2M…"
    if (KISI_OZNE.test(ozne)) return null;
    for (const re of ON_EKLER) ozne = ozne.replace(re, "");
  }

  const govde = ozne.split(/\s*[,–—:]\s*/)[0] ?? ozne;
  const kelimeler = govde.trim().split(/\s+/).filter(Boolean);

  // Baştan itibaren özel ad öbeği. İlk kelime küçük harfle başlayabilir (os.energy, byFounders).
  const ad = [];
  for (const [i, k] of kelimeler.entries()) {
    if (i === 0 || /^[A-ZÀ-ÝÇĞİÖŞÜ0-9]/.test(k)) ad.push(k);
    else break;
    if (ad.length >= 4) break;                               // "Revier Therapeutics" evet, cümle hayır
  }
  const sonuc = ad.join(" ").replace(/[.,;:]$/, "");
  return sonuc.length > 1 ? sonuc.slice(0, 60) : null;
}

const usdCevir = (deger, birim) =>
  Number.isFinite(deger) && KUR_USD[birim] ? Math.round(deger * KUR_USD[birim]) : null;

// Alıntılar: telif yüzeyini dar tutmak için en fazla 2 adet, 200 karakter.
// Bunlar aynı zamanda "bu rakam kaynakta gerçekten geçiyor mu" denetiminin gözle
// bakılan hâli — yayından önce operatör bunu okur.
const alintiTopla = (k) =>
  [k.tutar?.kaynak_alinti, k.tur_tipi?.kaynak_alinti]
    .filter((x) => typeof x === "string" && x.trim())
    .map((x) => x.trim().slice(0, 200))
    .filter((x, i, a) => a.indexOf(x) === i)
    .slice(0, 2);

// ── Tek item → aday ──────────────────────────────────────────────────────
export async function adayUret(item, kaynak, { domainCoz = true } = {}) {
  const s = turHaberiMi(item.baslik, item.icerik);
  if (!s.evet) return null;

  // Adı olmayan kayıt paket üretemez: domain çözülemez, carousel yazılamaz, blog açılamaz.
  // Başlıkta şirket adı hiç geçmeyen gerçek vakalar var ("Former Lunar executives land €8.2M…");
  // aynı tur genelde başka bir kaynakta adıyla geliyor. Uydurmak yerine atlıyoruz.
  const adOn = sirketAdiCikar(item.baslik);
  if (!adOn) return null;

  const metin = duzMetin(item.icerik);
  const k = kunyeCikar(metin, item.baslik);
  const ki = kisilerCikar(metin, { sirket: adOn });

  const ad = adOn;
  const tutar = k.tutar?.deger ?? null;
  const birim = k.tutar?.para_birimi ?? null;

  // Domain çözümü tek ağ isteği gerektiren adım; kuru koşuda atlanır.
  let dom = null, domDurum = "atlandi", domIz = [];
  if (domainCoz) {
    try {
      const baglam = [ki.lider_yatirimci, ...(ki.katilan_yatirimcilar ?? []).map((x) => (typeof x === "string" ? x : x?.ad ?? x?.deger))]
        .filter((x) => typeof x === "string" && x.length > 2).slice(0, 4);
      const r = await resolveCompanyDomain({ companyName: ad, contentHtml: item.icerik, context: baglam });
      dom = r.verified ? r.domain : null;
      domDurum = r.durum;
      domIz = r.denenen ?? [];
    } catch (e) { domDurum = `hata: ${e.message}`; }
  }

  return {
    // kuyruk.mjs'in beklediği alan adları — sözleşme burada
    sirket_adi: ad,
    sirket_domain: dom,
    ulke: kaynak.ulke ?? null,
    sektor: null,                        // Faz 2: LLM sınıflandırması
    tarih: item.tarih || null,
    tutar_deger: tutar,
    tutar_birim: birim,
    tutar_usd: usdCevir(tutar, birim),
    tur_tipi: k.tur_tipi?.deger && k.tur_tipi.deger !== "belirsiz" ? k.tur_tipi.deger : null,
    // kisiler.mjs bu alanları DÜZ STRING olarak döndürür (nesne değil).
    lider: typeof ki.lider_yatirimci === "string" ? ki.lider_yatirimci : null,
    katilanlar: (ki.katilan_yatirimcilar ?? []).map((x) => (typeof x === "string" ? x : x?.ad ?? x?.deger)).filter(Boolean),
    kurucular: (ki.kurucular ?? []).map((x) => (typeof x === "string" ? x : x?.ad ?? x?.deger)).filter(Boolean),
    kaynak: kaynak.ad,
    url: item.url,
    baslik: item.baslik,
    alintilar: alintiTopla(k),

    // Sonraki adımlar (varlık çekimi, metin yazımı) için taşınan ek bilgi.
    // kuyruk.mjs bunları okumaz; kayda geçmezler.
    _ek: {
      guven: s.guven,
      degerleme: k.degerleme?.deger ?? null,
      degerleme_birim: k.degerleme?.para_birimi ?? null,
      kesinlik: k.tutar?.kesinlik ?? null,
      ne_yapiyor: ki.ne_yapiyor_kaynak_cumle ?? null,
      llm_gerekli: !!ki.llm_gerekli,
      supheli: ki.supheli ?? [],
      domain_durum: domDurum,
      domain_iz: domIz,
    },
  };
}

// ── Ana akış ─────────────────────────────────────────────────────────────
export async function topla({ limit = Infinity, domainCoz = true, kaynaklar = KAYNAKLAR } = {}) {
  const adaylar = [], kaynakDurum = [];

  for (const kaynak of kaynaklar) {
    let items = [];
    try {
      items = rssAyristir(await cek(kaynak.url));
    } catch (e) {
      // Bir kaynağın ölmesi koşuyu düşürmez — ama sessizce de geçmez.
      kaynakDurum.push({ ...kaynak, item: 0, tur: 0, hata: e.message });
      continue;
    }

    let tur = 0;
    for (const item of items) {
      if (adaylar.length >= limit) break;
      try {
        const a = await adayUret(item, kaynak, { domainCoz });
        if (a) { adaylar.push(a); tur++; }
      } catch {
        // Tek bozuk item tüm koşuyu düşürmemeli.
      }
    }
    kaynakDurum.push({ ...kaynak, item: items.length, tur, hata: null });
  }

  return { adaylar, kaynakDurum };
}

// ── CLI ──────────────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const yaz = process.argv.includes("--yaz");
  const li = process.argv.indexOf("--limit");
  const limit = li > -1 ? Number(process.argv[li + 1]) || Infinity : Infinity;
  const domainCoz = !process.argv.includes("--domainsiz");

  const t0 = Date.now();
  const { adaylar, kaynakDurum } = await topla({ limit, domainCoz });

  console.log("KAYNAKLAR");
  for (const k of kaynakDurum) {
    console.log(k.hata
      ? `  ${k.ad.padEnd(14)} ÇEKİLEMEDİ — ${k.hata}`
      : `  ${k.ad.padEnd(14)} ${String(k.item).padStart(2)} item → ${k.tur} tur haberi`);
  }

  // Kaynakların TAMAMI düşerse bu sessiz bir arıza olur: koşu "başarılı" görünür,
  // kuyruk büyümez ve kimse fark etmez. Actions'ın kırmızı yanması için hata kodu.
  if (kaynakDurum.every((k) => k.hata)) {
    console.error("\nHATA: hiçbir kaynak çekilemedi.");
    process.exit(1);
  }

  const s = isle(adaylar, { yaz });
  console.log(`\n${adaylar.length} aday → ${s.gruplar} grup → ${s.yeni.length} kuyruk kaydı, ${s.atlanan.length} atlandı (${((Date.now() - t0) / 1000).toFixed(1)} sn)`);

  for (const k of s.yeni) {
    const u = k.kunye;
    const tutar = u.tutar.deger ? `${u.tutar.deger} ${u.tutar.birim}` : "tutar yok";
    console.log(`  ${String(k.puan).padStart(3)}  ${(u.sirket ?? "?").padEnd(22)} ${tutar.padEnd(16)} ${(u.tur_tipi ?? "-").padEnd(10)} ${u.domain ?? "domain yok"}`);
  }
  for (const a of s.atlanan) console.log(`  ---  ${a.id}: ${a.neden}`);

  if (!yaz) console.log("\n(kuru koşu — yazmak için --yaz)");
}
