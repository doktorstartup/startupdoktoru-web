// Haber toplayıcı — CAROUSEL METİNLERİ.
//
// Carousel'in yorum slaytlarını (kuruluş / odak / ölçek) yazar. Rakamları YAZMAZ:
// tutar, yatırımcı adı ve tur tipi kuyruk kaydından carousel.mjs tarafından mekanik
// basılıyor. Modelin işi yalnız Türkçe yorum cümleleri kurmak.
//
// İKİ YOL, AYNI ÇIKTI (paketler/<slug>/metin.json):
//   1. Claude Code oturumu  → .claude/skills/haber-paketi (birincil, kaliteli, marjinal maliyet 0)
//   2. Bu dosya             → ücretsiz LLM (Gemini → Groq), Claude limiti dolduğunda
// Sonraki adımlar hangisinin yazdığını bilmez.
//
// TELİF: makale metni O AN çekilir, modele verilir ve ATILIR. Ne repoya ne pakete yazılır.
//
// Kullanım:
//   node scripts/haber/metin.mjs kuyruk/<kayit>.json            → ücretsiz LLM ile yaz
//   node scripts/haber/metin.mjs kuyruk/<kayit>.json --prompt   → promptu bas (Claude'a yapıştır)

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { duzMetin } from "./tur-haberi-mi.mjs";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

// ── Kaynak makaleyi taze çek ──────────────────────────────────────────────
export async function makaleCek(url) {
  const r = await fetch(url, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(20_000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const html = await r.text();
  // Gövdeyi kabaca ayıkla: script/style/nav dışarı, sonra düz metin.
  const govde = html
    .replace(/<(script|style|nav|header|footer|aside)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  return duzMetin(govde).slice(0, 12_000);
}

// ── Prompt ────────────────────────────────────────────────────────────────
export function promptYaz(kayit, makale) {
  const u = kayit.kunye;
  const olgular = [
    `şirket: ${u.sirket}`,
    u.domain && `site: ${u.domain}`,
    u.kurucular?.length && `kurucular: ${u.kurucular.join(", ")}`,
    u.ulke && `ülke: ${u.ulke}`,
  ].filter(Boolean).join("\n");

  return `Bir yatırım haberinden Instagram kaydırmalı postu için TÜRKÇE yorum cümleleri yazacaksın.

DOĞRULANMIŞ OLGULAR (kuyruk kaydından — bunları değiştirme):
${olgular}

KAYNAK MAKALE:
"""
${makale}
"""

GÖREVİN: aşağıdaki blokları yaz.

── OLGU BLOKLARI (yalnız kaynakta yazanı aktar, her biri 1-2 KISA cümle) ──
1. "kurulus"  — şirket kim tarafından, ne zaman, nerede kuruldu + tek cümlede ne yaptığı
2. "odak"     — hangi alanda çalışıyor, ürünü/hizmeti ne
3. "olcek"    — büyüklüğüne dair somut bir şey (kullanıcı sayısı, ülke sayısı, müşteri) VE
                daha önce yatırım alıp almadığı. Kaynakta yoksa BOŞ DİZİ bırak.

── YOL HARİTASI (kaynaktan, üç durak) ──
4. "yolharitasi" — üç nesne: [{"etiket":"...","baslik":"...","satirlar":["...","..."]}]
   · 1. durak = kuruluş: yıl + yer
   · 2. durak = bugün: en çarpıcı iki ölçek verisi
   · 3. durak = sırada: bu yatırımı NE İÇİN kullanacağı (kaynakta genelde yazar:
     "yatırımı ... için kullanacak"). Kaynakta yoksa 3. durağı ATLA, iki durak yaz.
   Her "satirlar" en fazla 2 kısa madde, madde başına 5-6 kelime.

── YORUM BLOĞU (Startup Doktoru'nun kendi yorumu — 3-4 cümle) ──
5. "yorum" — üç şeyi sırayla yap:
   (a) Bu iş modelinin ne olduğunu bir cümlede netleştir; yaygın bir yanılgıyı düzelt.
   (b) Bu modelin hangi tür şirketlerle iş birliğine açık olduğunu söyle ve NEDENİNİ ver.
       Sektörü genel adıyla yaz (medya, e-ticaret, eğitim, telekom, sağlık…).
   (c) Türkiye'deki bir kurucunun bu turdan çıkaracağı SOMUT dersle bitir.

   YORUM BLOĞUNUN KENDİ KURALLARI:
   - ŞİRKET ADI, KİŞİ ADI, MARKA ADI YAZMA (haberde geçen şirket ve yatırımcı hariç).
     Uydurma örnek şirket verme.
   - RAKAM YAZMA. Pazar büyüklüğü, oran, yüzde — hiçbiri.
   - ÜSLUP (Startup Doktoru'nun kendi e-postalarından çıkarıldı, birebir uy):
     · İkinci tekil, doğrudan hitap: "senin", "yaparsan", "bak".
     · Yanılgıyı düzelten giriş: "X teoride kolaydır. Zorluk, ... başladığında ortaya çıkar."
     · "Kurucuların en sık hatası ..." kalıbı serbest.
     · Kısa cümle. Sıfat yığını yok. Emoji yok. Ünlem yok.
     · Hype yasak: "devrim", "çığır açıyor", "oyunu değiştiriyor" YAZMA.
     · Somut ol: soyut övgü yerine mekanizmayı anlat.
     · Son cümle okuyucunun YAPACAĞI bir şey olsun.

MUTLAK KURALLAR
- RAKAM YAZMA. Yatırım tutarı, tur tipi ve değerleme başka bir slaytta MEKANİK basılıyor.
  Yalnızca kaynakta AÇIKÇA geçen kuruluş yılı, kullanıcı sayısı, ülke sayısı gibi
  şirketi tarif eden sayıları yazabilirsin — onlar da kaynakta birebir geçmeli.
- Kaynakta geçmeyen hiçbir ad, yer, tarih veya sayı yazma. Emin değilsen bloğu boş bırak.
  Uydurma bilgi, boş slayttan çok daha kötüdür.
- Kişi ve kurum adlarını kaynakta geçtiği TAM HÂLİYLE yaz. Kısaltma, uzatma, düzeltme yok.
- Taşıyıcı bilgiyi **iki yıldız** arasına al: **Cem Ortabaş**, **2022 yılında**, **İzmir**.
  Slaytta kalın görünecek. Her cümlede en fazla 2 vurgu.
- Sade, kısa Türkçe. Pazarlama dili yok, sıfat yığını yok, ünlem yok.
- Doğrudan bilgi ver, "bu girişim dikkat çekiyor" gibi doldurma cümle kurma.

YALNIZCA şu JSON'u döndür, başka hiçbir şey yazma:
{"kurulus":["...","..."],"odak":["..."],"olcek":["..."],
 "yolharitasi":[{"etiket":"2022","baslik":"Kuruldu","satirlar":["İzmir"]}],
 "yorum":["...","...","..."]}`;
}

// ── Doğrulama kapıları ────────────────────────────────────────────────────
// Modelin dürüstlüğüne değil METNE dayanır: yazdığı her sayı kaynakta geçmeli.
const norm = (s) => String(s ?? "").toLowerCase().replace(/\s+/g, " ").trim();

// YORUM bölümünde meşru olarak geçebilecek genel adlar. Bunlar bir "uydurma varlık"
// değil, coğrafya/sektör sözcüğü — kaynakta geçmese de reddedilmemeli.
// Liste DAR tutuldu: şirket/marka adı buraya girmez.
const GENEL_ADLAR = new Set([
  "türkiye", "türk", "avrupa", "amerika", "abd", "asya", "ortadoğu", "avrupa'da",
  "istanbul", "ankara", "izmir", "anadolu", "silikon", "avrupalı", "global",
]);

export function dogrula(metinler, makale, kayit) {
  const kaynak = norm(makale);
  const kunyeSayilari = new Set(
    [kayit.kunye?.tutar?.deger, kayit.kunye?.tutar?.usd]
      .filter(Number.isFinite).flatMap((n) => [String(n), String(n / 1e6), String(n / 1e9)])
  );

  const sorunlar = [];
  const temiz = {};

  for (const [alan, paragraflar] of Object.entries(metinler)) {
    if (!Array.isArray(paragraflar)) continue;

    // YOL HARİTASI nesne dizisidir, cümle değil. İçindeki her metin alanı aynı
    // kapılardan geçer ama durak yapısı korunur.
    if (alan === "yolharitasi") {
      const duraklar = [];
      for (const d of paragraflar) {
        if (!d || typeof d !== "object") continue;
        // Her alan AYRI denetlenir. Birleştirilirse "Kuruldu", "Bugün", "Sırada" gibi
        // etiketler cümle ortası sanılıp özel ad diye reddediliyordu — oysa hepsi
        // sıradan Türkçe sözcük ve her biri kendi metninin başında duruyor.
        const metinAlanlari = [d.etiket, d.baslik, ...(Array.isArray(d.satirlar) ? d.satirlar : [])]
          .filter((x) => typeof x === "string" && x.trim());
        let sorun = null;
        for (const alanMetni of metinAlanlari) {
          const r = kapidanGecir(alanMetni, kaynak, kunyeSayilari, alan, false);
          if (r.sorun) { sorun = r.sorun; break; }
        }
        if (sorun) { sorunlar.push(sorun); continue; }
        duraklar.push({
          etiket: String(d.etiket ?? "").slice(0, 24),
          baslik: String(d.baslik ?? "").slice(0, 40),
          satirlar: (Array.isArray(d.satirlar) ? d.satirlar : []).filter((x) => typeof x === "string").slice(0, 3),
        });
      }
      if (duraklar.length >= 2) temiz.yolharitasi = duraklar;
      else if (paragraflar.length) sorunlar.push("yolharitasi: 2 duraktan az kaldı — bölüm düşürüldü");
      continue;
    }

    const yorumMu = alan === "yorum";
    const kabul = [];
    for (const p of paragraflar) {
      if (typeof p !== "string" || !p.trim()) continue;
      const duz = p.replace(/\*\*/g, "");

      // Kapılar tek yerde: yorum bölümünde genel coğrafya/sektör adlarına izin var,
      // olgu bölümlerinde yok. Sayı kapısı her yerde aynı sertlikte.
      const { sorun } = kapidanGecir(duz, kaynak, kunyeSayilari, alan, yorumMu);
      if (sorun) { sorunlar.push(sorun); continue; }

      kabul.push(p.trim());
    }
    if (kabul.length) temiz[alan] = kabul;
  }
  return { metinler: temiz, sorunlar };
}

// Tek cümleyi kapılardan geçirir. `yorumMu` true ise genel coğrafya/sektör adlarına
// izin verilir — yorum kaynağın dışına ÇIKMAK zorundadır, uydurma VARLIK üretmeden.
function kapidanGecir(duz, kaynak, kunyeSayilari, alan, yorumMu) {
  const sayilar = duz.match(/\d[\d.,]*/g) ?? [];
  const uydurmaSayi = sayilar.filter((x) => {
    const sade = x.replace(/[.,]$/, "");
    if (sade.length < 2) return false;
    return !kaynak.includes(sade.toLowerCase()) && !kunyeSayilari.has(sade);
  });
  if (uydurmaSayi.length) return { sorun: `${alan}: kaynakta geçmeyen sayı ${uydurmaSayi.join(", ")} — düşürüldü` };

  const adlar = duz.match(/\b[A-ZÇĞİÖŞÜ][\wçğıöşü]+(?:\s+[A-ZÇĞİÖŞÜ][\wçğıöşü]+)+/g) ?? [];
  const uydurmaAd = adlar.filter((a) => !kaynak.includes(norm(a)) && !(yorumMu && GENEL_ADLAR.has(norm(a))));
  if (uydurmaAd.length) return { sorun: `${alan}: kaynakta geçmeyen ad "${uydurmaAd[0]}" — düşürüldü` };

  const cumleBasi = new Set();
  for (const m of duz.matchAll(/(?:^|[.!?]\s+)([A-ZÇĞİÖŞÜ][\wçğıöşü'’]*)/g)) cumleBasi.add(m[1]);
  for (const m of duz.matchAll(/\b([A-ZÇĞİÖŞÜ][\wçğıöşü]+(?:['’][\wçğıöşü]+)?)/g)) {
    const kelime = m[1];
    if (cumleBasi.has(kelime)) continue;
    const govde = kelime.split(/['’]/)[0];
    if (govde.length < 3) continue;
    if (kaynak.includes(norm(govde))) continue;
    if (yorumMu && GENEL_ADLAR.has(norm(govde))) continue;
    return { sorun: `${alan}: kaynakta geçmeyen özel ad "${kelime}" — düşürüldü` };
  }
  return { sorun: null };
}

// ── Ücretsiz LLM sağlayıcıları ────────────────────────────────────────────
// Sıra: Gemini (ücretsiz katman) → Groq (ücretsiz katman). İkisi de anahtarsız çalışmaz;
// anahtar yoksa Claude Code yolunu kullan (--prompt).
const SAGLAYICILAR = [
  {
    ad: "gemini",
    anahtar: () => process.env.GEMINI_API_KEY,
    async cagir(prompt, key) {
      const model = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        { method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, responseMimeType: "application/json" },
          }), signal: AbortSignal.timeout(60_000) });
      if (!r.ok) throw new Error(`gemini HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
      const d = await r.json();
      return d.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    },
  },
  {
    ad: "groq",
    anahtar: () => process.env.GROQ_API_KEY,
    async cagir(prompt, key) {
      const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, temperature: 0.3,
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: prompt }] }),
        signal: AbortSignal.timeout(60_000) });
      if (!r.ok) throw new Error(`groq HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
      const d = await r.json();
      return d.choices?.[0]?.message?.content ?? "";
    },
  },
];

function jsonAyikla(ham) {
  const s = String(ham ?? "").trim().replace(/^```(?:json)?|```$/g, "").trim();
  const bas = s.indexOf("{"), son = s.lastIndexOf("}");
  if (bas < 0 || son < 0) throw new Error("JSON bulunamadı");
  return JSON.parse(s.slice(bas, son + 1));
}

// ── Ana akış ──────────────────────────────────────────────────────────────
export async function metinUret(kayit, { paket } = {}) {
  const url = kayit.kaynaklar?.[0]?.url;
  if (!url) throw new Error("kayıtta kaynak URL yok");

  const makale = await makaleCek(url);
  const prompt = promptYaz(kayit, makale);

  const uygun = SAGLAYICILAR.filter((s) => s.anahtar());
  if (!uygun.length) {
    const e = new Error("ücretsiz LLM anahtarı yok (GEMINI_API_KEY veya GROQ_API_KEY)");
    e.prompt = prompt;
    throw e;
  }

  let sonHata;
  for (const s of uygun) {
    try {
      const ham = await s.cagir(prompt, s.anahtar());
      const { metinler, sorunlar } = dogrula(jsonAyikla(ham), makale, kayit);
      const cikti = { ...metinler, uretici: s.ad, uretim: new Date().toISOString() };
      if (paket) {
        mkdirSync(paket, { recursive: true });
        writeFileSync(join(paket, "metin.json"), JSON.stringify(cikti, null, 2) + "\n");
      }
      return { metinler: cikti, sorunlar, saglayici: s.ad };
    } catch (e) { sonHata = e; }
  }
  throw sonHata;
}

// ── CLI ───────────────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const dosya = process.argv[2];
  if (!dosya) {
    console.error("Kullanım: node scripts/haber/metin.mjs kuyruk/<kayit>.json [--prompt]");
    process.exit(1);
  }
  const kayit = JSON.parse(readFileSync(dosya, "utf8"));
  const paket = join(process.env.HABER_PAKET_DIR || "paketler", kayit.id);

  if (process.argv.includes("--prompt")) {
    // Claude Code yolu: promptu bas, oturumda yaz, çıktıyı metin.json'a kaydet.
    const makale = await makaleCek(kayit.kaynaklar[0].url);
    console.log(promptYaz(kayit, makale));
    process.exit(0);
  }

  try {
    const { metinler, sorunlar, saglayici } = await metinUret(kayit, { paket });
    console.log(`metin.json yazıldı (${saglayici}) → ${join(paket, "metin.json")}\n`);
    for (const [alan, p] of Object.entries(metinler)) {
      if (!Array.isArray(p)) continue;
      console.log(`  ${alan}:`);
      for (const x of p) console.log(`    ${x}`);
    }
    if (sorunlar.length) {
      console.log("\n⚠  doğrulama kapısı düşürdü:");
      for (const x of sorunlar) console.log(`   - ${x}`);
    }
  } catch (e) {
    console.error(`\nHATA: ${e.message}`);
    if (e.prompt) {
      console.error("\nÜcretsiz LLM anahtarı yok. İki seçenek:");
      console.error("  1) Claude Code oturumunda:  node scripts/haber/metin.mjs <kayit> --prompt");
      console.error("     çıktıyı Claude'a ver, dönen JSON'u paketler/<slug>/metin.json'a kaydet");
      console.error("  2) Ücretsiz anahtar al ve .env.local'a ekle:");
      console.error("     GEMINI_API_KEY=...   (aistudio.google.com)");
      console.error("     GROQ_API_KEY=...     (console.groq.com)");
    }
    process.exit(1);
  }
}
