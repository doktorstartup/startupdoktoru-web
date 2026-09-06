// Tur haberi sınıflandırıcısının regresyon ölçümü. Ağ yok, bağımlılık yok.
//   node scripts/haber/tur-haberi-mi.test.mjs
// test-verisi.json: 4 kaynaktan 90 canlı RSS item'ı, ELLE etiketlenmiş (etiket=true → tur haberi).
// "ayar" = sınıflandırıcının ayarlandığı 60 item. "oos" = ayarda hiç görülmemiş 30 item.
import { readFileSync } from "node:fs";
import { turHaberiMi } from "./tur-haberi-mi.mjs";

const veri = JSON.parse(readFileSync(new URL("./test-verisi.json", import.meta.url), "utf8"));

function olc(items) {
  let tp = 0, fp = 0, fn = 0, tn = 0; const hata = [];
  for (const it of items) {
    const g = turHaberiMi(it.baslik, it.metin);
    if (g.evet && it.etiket) tp++;
    else if (g.evet && !it.etiket) { fp++; hata.push(["YANLIŞ POZİTİF", it, g]); }
    else if (!g.evet && it.etiket) { fn++; hata.push(["yanlış negatif", it, g]); }
    else tn++;
  }
  const kesinlik = tp / (tp + fp || 1), duyarlilik = tp / (tp + fn || 1);
  return { tp, fp, fn, tn, kesinlik, duyarlilik, hata };
}

let kirik = 0;
for (const ad of ["ayar", "oos", "hepsi"]) {
  const s = olc(ad === "hepsi" ? veri : veri.filter((x) => x.set === ad));
  console.log(`\n[${ad}] N=${s.tp + s.fp + s.fn + s.tn}  TP=${s.tp} FP=${s.fp} FN=${s.fn} TN=${s.tn}` +
    `  kesinlik=%${(100 * s.kesinlik).toFixed(1)} duyarlılık=%${(100 * s.duyarlilik).toFixed(1)}`);
  for (const [tip, it, g] of s.hata) console.log(`  ${tip}: [${it.kaynak}] ${it.baslik.slice(0, 80)}\n     → ${g.gerekce}`);
  if (ad === "hepsi") kirik = s.fp; // yanlış pozitif = pahalı hata; sıfır olmalı
}
if (kirik > 0) { console.error(`\n❌ ${kirik} yanlış pozitif — eşik/veto gevşemiş.`); process.exit(1); }
console.log("\n✅ Yanlış pozitif yok.");
