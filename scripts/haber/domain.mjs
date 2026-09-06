// Haber toplayıcı — ŞİRKET DOMAIN ÇÖZÜMÜ + KİMLİK KAPISI.
// content:encoded HTML'inden şirketin kendi sitesini bulur, çeker ve kimliğini doğrular.
// Sistemin en pahalı hatası burada doğar: yanlış şirketin sitesinden içerik çekmek.
// Bu yüzden kapıyı geçemeyen aday SESSİZCE atılmaz — gerekçesiyle işaretlenir.
//
// Ölçülmüş tuzak: "HubX" için hubx.com bir ABD B2B portalı (<title>HUBX Portal</title>),
// "Midas" için midas.com.tr bir altın takı üreticisi (<title>... Takı Üreticisi - Midas</title>).
// İKİSİ DE "sayfada ad geçiyor" + "başlık eşleşiyor" sinyallerini GEÇER. Adı doğrulamak
// yetmez. Ayırt eden şey haberin o domaini ŞİRKETE bağlamış olmasıdır — yani çapa metninin
// ya da domain etiketinin şirket adını taşıması ("güçlü bağ"). Haberde geçen HERHANGİ bir
// linke güvenmek yetmez: ölçüldü, balderton.com ve indexventures.com ana sayfaları "Revolut"
// adını taşıyor ve zayıf bağla kapıyı geçiyorlardı.
//
// Sıfır bağımlılık (Node 22 yerleşikleri), sıfır API anahtarı, tarayıcı yok.
// Saf katman (metin → nesne) ile ağ katmanı ayrıdır; saf fonksiyonlar tek başına test edilir.
import dns from "node:dns/promises";

// ───────────────────────── saf katman ─────────────────────────

// Yayıncılar + sosyal + referans: bunlar hiçbir zaman "haberin şirketi" değil.
const EXCLUDED = new Set([
  // 4 kaynak yayıncı
  "tech.eu", "eu-startups.com", "webrazzi.com", "arcticstartup.com",
  // birbirine atıf veren diğer yayınlar
  "sifted.eu", "techcrunch.com", "startupticker.ch", "brutkasten.com",
  "oresundstartups.com", "elreferente.es", "reuters.com", "bloomberg.com",
  "cnbc.com", "theinformation.com", "ft.com", "wsj.com", "forbes.com",
  "businessinsider.com", "theverge.com", "wired.com", "time.com", "axios.com",
  // sosyal / video / yayın platformları
  "linkedin.com", "x.com", "twitter.com", "facebook.com", "instagram.com",
  "youtube.com", "youtu.be", "tiktok.com", "threads.net", "bsky.app",
  "medium.com", "substack.com", "t.me", "whatsapp.com", "reddit.com",
  // veri / arşiv / referans
  "crunchbase.com", "pitchbook.com", "dealroom.co", "wikipedia.org",
  "statista.com", "mckinsey.com", "hbr.org", "who.int", "gatesnotes.com",
  "web.archive.org", "docs.google.com", "eventbrite.com",
]);

// Kurum/kamu/akademi/STK: haber açılışındaki istatistik atıfları buradan gelir
// (ölçüldü: TidalSense haberi nihr.ac.uk ve asthmaandlung.org.uk ile açılıyor).
const EXCLUDED_SUFFIX = [".gov", ".gov.uk", ".edu", ".ac.uk", ".int", ".europa.eu", ".org.uk"];

// eTLD+1 için mini liste (tam PSL'e gerek yok, kaynakların ülkeleri yeter).
const MULTI_TLD = new Set([
  "com.tr", "co.uk", "org.uk", "ac.uk", "gov.uk", "com.au", "co.nz", "co.il",
  "com.br", "co.za", "co.jp", "com.mx", "com.es", "co.in", "com.sg", "com.ua",
]);

/** hostname → kayıt edilebilir kök domain (app.itoflow.ai → itoflow.ai). */
export function registrableDomain(hostname) {
  const h = String(hostname || "").toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  const p = h.split(".");
  if (p.length <= 2) return h;
  return MULTI_TLD.has(p.slice(-2).join(".")) ? p.slice(-3).join(".") : p.slice(-2).join(".");
}

export function isExcluded(hostname) {
  const h = String(hostname || "").toLowerCase().replace(/^www\./, "");
  if (EXCLUDED.has(h) || EXCLUDED.has(registrableDomain(h))) return true;
  return EXCLUDED_SUFFIX.some((s) => h.endsWith(s));
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', "#039": "'", "#8217": "’", nbsp: " " };
const decode = (s) => String(s).replace(/&(#?\w+);/g, (m, e) => ENTITIES[e] ?? m);
const stripTags = (h) => decode(String(h).replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();

/** content:encoded → [{url, host, anchor}], belgedeki sırayı korur. */
export function extractLinks(html) {
  const out = [];
  for (const m of String(html || "").matchAll(/<a\s[^>]*?href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const url = decode(m[1]).trim();
    if (!/^https?:/i.test(url)) continue;
    try {
      out.push({ url, host: new URL(url).hostname.replace(/^www\./, "").toLowerCase(), anchor: stripTags(m[2]) });
    } catch { /* bozuk URL — atla */ }
  }
  return out;
}

/** Aksan/noktalama sadeleştirme; karşılaştırmalar hep bunun üzerinden. */
const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Ad metinde KELİME SINIRIYLA geçiyor mu ("Motion" ≠ "promotion"). */
export function nameInText(text, name) {
  const n = norm(name);
  if (!n) return false;
  const pat = n.split(" ").map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[^a-z0-9]{0,3}");
  return new RegExp(`(^|[^a-z0-9])${pat}($|[^a-z0-9])`).test(norm(text));
}

/**
 * Ad domain etiketinin BAŞINDA mı: "volve" → volvetech.com ✓ ama norrskenevolve.vc ✗.
 * (Ortada geçmeyi saymak yatırımcı domainlerini şirket sanıyordu — ölçüldü.)
 */
export function nameInDomain(domain, name) {
  const n = norm(name).replace(/ /g, "");
  const d = registrableDomain(domain).split(".")[0].replace(/[^a-z0-9]/g, "");
  if (!n || !d) return false;
  // Adın kendisi domain olabilir ("os.energy") — noktalı hâli de karşılaştırılır.
  if (d === n || n === registrableDomain(domain).replace(/[^a-z0-9]/g, "")) return true;
  // Kısa taraf en az 4 harf olmalı. Yoksa "bit.ly" ~ "Bitpanda", "on.com" ~ "Onfido",
  // "se.com" ~ "SeeTrue" gibi kısaltıcı/rastgele domainler şirket sanılır (ölçüldü).
  const kisa = d.length < n.length ? d : n;
  if (kisa.length < 4) return false;
  return d.startsWith(n) || n.startsWith(d);
}

/**
 * Haber HTML'inden aday domainleri güçlüden zayıfa dizer:
 *  1) çapa metni şirket adıyla eşleşen link — "Certain Energy" → rfcpower.com (eski domain!)
 *  2) domain etiketi şirket adıyla başlayan link
 *  3) yayıncı-dışı ilk link (temel kural), sonra kalanlar
 */
export function pickCandidates(contentHtml, companyName) {
  const links = extractLinks(contentHtml).filter((l) => !isExcluded(l.host));
  const seen = new Set();
  const out = [];
  // bag: haber bu domaini ŞİRKETE mi bağladı (güçlü), yoksa yalnızca haberde mi geçiyor (zayıf)?
  const push = (l, why) => {
    const domain = registrableDomain(l.host);
    if (seen.has(domain)) return;
    seen.add(domain);
    const bag = (why === "capa-metni" || why === "domain-adi") ? "guclu" : "zayif";
    out.push({ domain, url: l.url, anchor: l.anchor, why, bag, fromArticle: true });
  };
  if (companyName) {
    for (const l of links) if (l.anchor && nameInText(l.anchor, companyName)) push(l, "capa-metni");
    for (const l of links) if (nameInDomain(l.host, companyName)) push(l, "domain-adi");
  }
  for (const [i, l] of links.entries()) push(l, i === 0 ? "ilk-link" : "sonraki-link");
  return out;
}

/** Haberdeki ilk LinkedIn şirket sayfası — arcticstartup şirket sitesine hiç link vermiyor. */
export function firstLinkedinCompany(contentHtml) {
  return extractLinks(contentHtml).find((l) => /(^|\.)linkedin\.com$/.test(l.host)
    && /\/company\//i.test(l.url))?.url ?? null;
}

// ───────────────────────── ağ katmanı ─────────────────────────

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0 Safari/537.36";

/**
 * Sayfayı çeker. Yönlendirme takip edilir ve NİHAİ domain döner
 * (ölçüldü: rfcpower.com → certainenergy.com; linkteki domain marka değişmiş olabilir).
 * HEAD kullanılmıyor: 29 domainde HEAD ve GET aynı sonucu verdi, kapı zaten gövdeyi
 * istiyor — ayrı HEAD isteği boşa gidiş-dönüş.
 *
 * reach: "ok" | "http" (4xx/5xx) | "dns-yok" | "ulasilamiyor"
 */
export async function fetchPage(url, timeoutMs = 12000) {
  const r0 = { ok: false, status: 0, reach: "ulasilamiyor", finalDomain: null, title: "", siteName: "", text: "", raw: "", error: null };
  let res;
  try {
    res = await fetch(url, {
      redirect: "follow",
      headers: { "user-agent": UA, accept: "text/html,*/*" },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    r0.error = e?.cause?.code || e?.code || e?.name || "ERR";
    // DNS ölümü ile "site ayakta değil"i AYIR: parked/ölü domainler çoğu zaman
    // A kaydı döndürüyor ama bağlantı zaman aşımına uğruyor ya da TLS sertifikası uymuyor
    // (ölçüldü: itoflow.com → CONNECT_TIMEOUT, volve.no → TLS_CERT_ALTNAME_INVALID; ikisi de DNS'te VAR).
    try { await dns.resolve4(new URL(url).hostname); } catch { r0.reach = "dns-yok"; }
    return r0;
  }
  let html;
  try { html = (await res.text()).slice(0, 500_000); }
  catch (e) { r0.error = e?.cause?.code || e?.name || "BODY_ERR"; return r0; }
  r0.status = res.status;
  r0.ok = res.ok;
  r0.reach = res.ok ? "ok" : "http";
  r0.finalDomain = registrableDomain(new URL(res.url).hostname);
  r0.title = stripTags((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [, ""])[1]);
  r0.siteName = decode((html.match(/<meta[^>]+og:site_name["'][^>]+content=["']([^"']*)["']/i) || [, ""])[1]).trim();
  r0.text = stripTags(html.replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, " ")).slice(0, 150_000);
  r0.raw = html; // JSON-LD gibi <script> içeriği text'te yok — LinkedIn "sameAs" buradan okunuyor
  return r0;
}

/**
 * LinkedIn şirket sayfasından resmi siteyi okur (JSON-LD "sameAs").
 * arcticstartup şirketin kendi sitesine link vermiyor, yalnız LinkedIn'e veriyor;
 * bu adım olmadan o kaynaktan hiç domain çıkmıyor (0/5 → 13/14 ölçüldü).
 * LinkedIn sayfasının kendi başlığı şirket adını doğrulamazsa sonuç kullanılmaz.
 */
export async function linkedinWebsite(linkedinUrl, companyName) {
  const p = await fetchPage(linkedinUrl, 15000);
  if (!p.ok) return null;
  const same = (p.title.match(/^(.*?)\s*\|\s*LinkedIn\s*$/) || [])[1];
  if (!same || !nameInText(same, companyName)) return null; // sayfa başka şirkete ait
  const site = (p.raw.match(/"sameAs":"(https?:\/\/[^"]+)"/) || [])[1];
  try { return site ? registrableDomain(new URL(site).hostname) : null; } catch { return null; }
}

// ───────────────────────── kimlik kapısı ─────────────────────────

/**
 * Üç sinyal:
 *  (a) çekilen sayfanın METNİNDE şirket adı geçiyor mu
 *  (b) og:site_name / <title> şirket adıyla eşleşiyor mu
 *  (c) HABER o domaini ŞİRKETE bağlamış mı
 *
 * "Üçten ikisi yeterli" kuralı TEK BAŞINA TUZAĞA DÜŞÜYOR: hubx.com ve midas.com.tr
 * gerçekten "HubX"/"Midas" adını taşıyor, ikisi de (a)+(b) = 2 sinyal veriyor ve
 * yanlış şirket olarak GEÇİYOR. Bu yüzden (c) ayrıcalıklı — ama (c) "haberde bu link var"
 * DEĞİL, "haber bu domaini şirkete bağladı" demektir (candidate.bag === "guclu": çapa metni,
 * domain adı ya da LinkedIn sameAs). Ölçüldü: "haberde geçen herhangi bir link" sayılınca
 * yatırımcı ana sayfaları (balderton.com/indexventures.com ~ "Revolut") kapıyı geçiyordu.
 *   - bağ güçlü ise: (a) veya (b) yeterli — yayıncı zaten o domaini şirkete bağlamış.
 *   - bağ zayıf/yok ise: (a) VE (b) VE haberden gelen bir bağlam kelimesi (yatırımcı/kurucu/
 *     şehir) sayfada geçmeli. Ad eşleşmesi tek başına asla yetmez.
 */
export function identityGate({ companyName, candidate, page, context = [] }) {
  // bag verilmemişse eski fromArticle alanından türetilir (geriye dönük uyum).
  const bag = candidate.bag ?? (candidate.fromArticle ? "guclu" : "yok");
  const a = page.ok && nameInText(page.text, companyName);
  const b = page.ok && (nameInText(page.siteName, companyName) || nameInText(page.title, companyName));
  const c = bag === "guclu";
  const hits = page.ok ? context.filter((t) => t && nameInText(page.text, t)) : [];
  const signals = { a, b, c, bag, baglam: hits };

  // Bot koruması 403 yerine 200 + meydan okuma sayfası da dönebiliyor: içerik şirketin değil.
  // Ad geçmediği için aşağıda "ad geçmiyor" diye elenirdi; oysa bu kanıt yokluğu (ölçüldü:
  // lovable.dev "Just a moment...", velatir.com "Vercel Security Checkpoint").
  const engel = page.ok && !a && !b
    && /just a moment|security checkpoint|attention required|checking your browser|enable javascript and cookies/i.test(page.title + " " + page.text.slice(0, 400));

  if (!page.ok || engel) {
    const reason = engel ? "bot korumasi sayfasi"
      : page.reach === "dns-yok" ? "DNS'te YOK"
      : page.reach === "http" ? `HTTP ${page.status}`
      : `ulasilamiyor (${page.error})`;
    // Sayfa açılmıyor olması "yanlış şirket" demek DEĞİL, yalnızca kanıt yokluğu.
    // Haber domaini ŞİRKETE bağlamışsa (güçlü bağ) domaini atmıyoruz — "dogrulanamadi" diyoruz.
    // DNS'te hiç olmayan domain bunun dışında: o domain ölü, kayda geçirilmez.
    const guclu = c && page.reach !== "dns-yok" && nameInDomain(candidate.domain, companyName);
    return { pass: false, dogrulanamadi: guclu, reason, signals };
  }
  if (!a && !b) return { pass: false, reason: "sayfada sirket adi hic gecmiyor", signals };
  if (c) return { pass: true, reason: "haber bu domaini sirkete baglamis + ad dogrulandi", signals };
  // bag "zayif" (haberde geçen rastgele link) ve "yok" (dış kaynak) aynı sıkı yoldan geçer:
  // ad eşleşmesi TEK BAŞINA yetmez. Ölçüldü: balderton.com ve indexventures.com ana sayfaları
  // "Revolut" adını taşıyor; hubx.com'un başlığı "HUBX Portal", midas.com.tr'ninki "...Midas".
  if (a && b && hits.length) return { pass: true, reason: `ad + baglam dogrulandi (${hits[0]})`, signals };
  return { pass: false, reason: `haber bu domaini sirkete baglamamis (bag: ${bag}), ad esmesi tek basina yetmez`, signals };
}

/**
 * Uçtan uca. Doğrulanmış domain yoksa null döner ve NEDEN elendiği `denenen` içinde durur.
 * @param {string} companyName  haberden çıkarılmış şirket adı (üst katmanın işi)
 * @param {string} contentHtml  RSS content:encoded
 * @param {string[]} context    doğrulama için yardımcı varlıklar (yatırımcı/kurucu/şehir)
 * @param {string[]} extra      haber dışı adaylar (ör. arama sonucu) — sıkı yoldan geçer
 */
export async function resolveCompanyDomain({ companyName, contentHtml, context = [], extra = [] }) {
  const cands = pickCandidates(contentHtml, companyName).slice(0, 3);

  // Haber şirketin sitesine link vermemişse LinkedIn şirket sayfasından siteyi al.
  const denenen = [];
  const li = firstLinkedinCompany(contentHtml);
  if (li && !cands.some((c) => c.bag === "guclu")) {
    const d = await linkedinWebsite(li, companyName);
    // Ret de kaydedilir: sessiz eleme bu modülün kendi ilkesine aykırı (ölçüldü: Sowilo haberi
    // ürün sayfası Catecut'a link veriyor; doğru reddediliyor ama izde hiç görünmüyordu).
    if (d) cands.unshift({ domain: d, url: `https://${d}`, why: "linkedin-sameAs", bag: "guclu", fromArticle: true });
    else denenen.push({ domain: null, why: "linkedin-sameAs", pass: false, reason: `LinkedIn sayfasindan site okunamadi (${li})` });
  }
  for (const d of extra) cands.push({ domain: registrableDomain(d), url: `https://${d}`, why: "dis-kaynak", bag: "yok", fromArticle: false });

  for (const cand of cands) {
    const page = await fetchPage(`https://${cand.domain}/`);
    const gate = identityGate({ companyName, candidate: cand, page, context });
    denenen.push({ domain: cand.domain, why: cand.why, pass: gate.pass, dogrulanamadi: gate.dogrulanamadi, reason: gate.reason, signals: gate.signals });
    if (gate.pass) {
      return {
        domain: page.finalDomain || cand.domain,        // yönlendirme sonrası NİHAİ domain
        linkedDomain: cand.domain,                       // haberin verdiği hâli (değişmiş olabilir)
        verified: true, durum: "dogrulandi", why: cand.why, signals: gate.signals, denenen,
      };
    }
  }
  const askida = denenen.find((d) => d.dogrulanamadi);
  if (askida) {
    return { domain: askida.domain, verified: false, durum: "dogrulanamadi", why: `${askida.why} — ${askida.reason}`, denenen };
  }
  return { domain: null, verified: false, durum: "elendi",
    why: cands.length ? "hicbir aday kapiyi gecemedi" : (denenen.length ? "aday reddedildi" : "aday link yok"), denenen };
}