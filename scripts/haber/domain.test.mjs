// Kimlik kapısı tuzak testi — ağ gerektirir, canlı sitelere bakar.
//   node scripts/news/company-domain.test.mjs
// Beklenti: yanlış şirket ELENİR, doğru şirket GEÇER. Bir satır bile ✘ ise kapı bozulmuştur.
import { fetchPage, identityGate } from "./domain.mjs";

// fromArticle: haber o domaine link vermiş mi (c sinyali).
const CASES = [
  // doğru şirket, haber link vermiş → geçmeli
  ["HubX", "hubx.co", true, ["Point72"], true],
  ["Motion", "motion.one", true, ["Extantia"], true],
  ["Volve", "volvetech.com", true, ["Skyfall"], true],
  ["Principle", "futureprinciple.com", true, ["SMRK"], true],
  // YANLIŞ şirket, adı gerçekten taşıyor, haber link VERMEMİŞ → elenmeli
  // (hubx.com = ABD B2B portalı, midas.com.tr = altın takı üreticisi)
  ["HubX", "hubx.com", false, ["Point72"], false],
  ["Midas", "midas.com.tr", false, ["Spark Capital", "brokerage"], false],
  // doğru şirket ama haber dışından geldi: bağlam kelimesi tutarsa geçmeli
  ["TidalSense", "tidalsense.com", false, ["Ameera Patel", "COPD"], true],
  // ulaşılamayan domainler → elenmeli (ikisi de DNS'te VAR, transport katmanında ölü)
  ["Volve", "volve.no", false, ["Skyfall"], false],
  ["Itoflow", "itoflow.com", false, ["Balderton"], false],
];

let hata = 0;
for (const [name, domain, fromArticle, context, beklenen] of CASES) {
  const page = await fetchPage(`https://${domain}/`);
  const g = identityGate({ companyName: name, candidate: { domain, fromArticle }, page, context });
  const ok = g.pass === beklenen;
  if (!ok) hata++;
  console.log(
    `${ok ? "✔" : "✘"} ${name.padEnd(11)} ${domain.padEnd(20)} link:${fromArticle ? "VAR" : "YOK"} ` +
    `a${+g.signals.a} b${+g.signals.b} c${+g.signals.c} → ${(g.pass ? "GEÇTİ" : "ELENDİ").padEnd(6)} ${g.reason}`
  );
}
console.log(hata ? `\n${hata} test BAŞARISIZ` : `\n${CASES.length}/${CASES.length} test geçti`);
process.exit(hata ? 1 : 0);
