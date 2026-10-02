// TÜRK GİRİŞİMİ GERİYE DÖNÜK TARAMA.
//
// NEDEN: turk.mjs'in sözcük dağarcığı zamanla genişliyor. Kayıt bir kez
// "yabancı" damgası yediğinde bir daha bakılmıyordu ve kalıp sonradan
// eklendiğinde o kayıt sessizce yanlış kalıyordu.
//
// Ölçülmüş bedel: 2 Ekim 2026'da iki Türk girişimi bu yüzden gözden kaçtı —
// M-Based ("Ankara'da ... faaliyet gösteren" kalıbı yoktu) ve Arcustin Games.
// Eser ikisini de dışarıdan görüp sordu; sistem haber vermedi.
//
// Bu betik Türk kaynaklı kayıtları yeniden okuyup işareti günceller. Haftada
// bir koşar (.github/workflows/turk-tara.yml). Bağımlılığı yoktur.
//
// Kullanım:
//   node scripts/haber/turk-tara.mjs            kuru koşu, yalnız rapor
//   node scripts/haber/turk-tara.mjs --yaz      işaretleri güncelle

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { makaleCek } from "./metin.mjs";
import { turkMu } from "./turk.mjs";

// Türk haberi yalnız Türk kaynaklarından gelir; diğerlerini okumaya gerek yok.
const TR_KAYNAK = /webrazzi\.com|swipeline\.co|egirisim\.com/i;
const GUN = 60;   // bu kadar günden eski kayıt zaten yayınlanmaz

export async function tara({ yaz = false } = {}) {
  const sinir = Date.now() - GUN * 86400_000;
  const kayitlar = readdirSync("kuyruk")
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => ({ f, k: JSON.parse(readFileSync(`kuyruk/${f}`, "utf8")) }))
    .filter(({ k }) => (k.kaynaklar ?? []).some((x) => TR_KAYNAK.test(x.url ?? "")))
    .filter(({ k }) => Date.parse(k.kunye?.tarih ?? 0) > sinir);

  const yeni = [];
  for (const { f, k } of kayitlar) {
    const url = (k.kaynaklar ?? []).find((x) => TR_KAYNAK.test(x.url ?? ""))?.url;
    let metin = "";
    try { metin = await makaleCek(url); } catch { continue; }
    const r = turkMu(metin, k.kunye?.domain);
    if (r.turk && k.kunye?.turk !== true) {
      yeni.push({ sirket: k.kunye.sirket, dosya: f, neden: r.neden });
      if (yaz) {
        k.kunye.turk = true;
        writeFileSync(`kuyruk/${f}`, JSON.stringify(k, null, 2) + "\n");
      }
    }
  }
  return { taranan: kayitlar.length, yeni };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const yaz = process.argv.includes("--yaz");
  const { taranan, yeni } = await tara({ yaz });
  console.log(`${taranan} Türk kaynaklı kayıt tarandı (son ${GUN} gün).`);
  if (!yeni.length) {
    console.log("Yeni Türk girişimi yok.");
    process.exit(0);
  }
  console.log(`\n🇹🇷  SONRADAN BULUNAN TÜRK GİRİŞİMİ: ${yeni.length}`);
  for (const y of yeni) console.log(`    ${y.sirket} — kuyruk/${y.dosya}  [${y.neden.join(" | ")}]`);
  if (!yaz) console.log("\n(kuru koşu — işaretlemek için --yaz)");
}
