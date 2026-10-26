// Ham çekimleri temizler: sessizlikleri kısaltır, elle işaretlenen takılmaları keser,
// kelime zamanlarını yeni (kesilmiş) zamana taşır. Çıktı Remotion'ın public/ klasörüne gider.
//
// Kullanım: node kes.mjs projeler/<ad>.json
// Proje dosyası:
//   { "ad": "...", "klipler": [ { "dosya": "/yol/v1.mov", "goruntu": true, "kes": [[bas, son], ...] } ],
//     "duzelt": { "yanlış": "doğru" } }   ("" → kelimeyi at, "+ek" → önceki kelimeye ekle)
//   goruntu: true → bu klibin görüntüsü de kullanılır (yüz çekimi); değilse yalnız sesi.
//   kes: ham videonun saniyeleri — takılma, tekrar gibi elle atılacak yerler.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KOK = dirname(fileURLToPath(import.meta.url));
const ESIK_DB = -32; // bunun altı sessizlik
const MIN_SESSIZLIK = 0.2; // bundan kısa duraklamalara dokunma
const PAY = 0.08; // kesimin iki yanında bırakılan nefes payı (sn)

const proje = JSON.parse(readFileSync(process.argv[2], "utf8"));
const cikti = join(KOK, "public", proje.ad);
mkdirSync(cikti, { recursive: true });

const ff = (...a) => execFileSync("ffmpeg", ["-hide_banner", "-y", ...a], { stdio: ["ignore", "pipe", "pipe"] });

const sure = (f) =>
  parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString());

// ffmpeg silencedetect sonucu stderr'e yazar.
const sessizlikLogu = (f) =>
  spawnSync("ffmpeg", ["-hide_banner", "-i", f, "-af", `silencedetect=noise=${ESIK_DB}dB:d=${MIN_SESSIZLIK}`, "-f", "null", "-"], { encoding: "utf8" }).stderr;

// Konuşulan aralıklar = tüm süre − sessizlikler − elle kesilenler (PAY kadar nefes bırakılır).
const tutulacak = (f, kes = []) => {
  const toplam = sure(f);
  const log = sessizlikLogu(f);
  const bas = [...log.matchAll(/silence_start: ([\d.]+)/g)].map((m) => +m[1]);
  const son = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((m) => +m[1]);
  const atilan = bas.map((b, i) => [b === 0 ? 0 : b + PAY, (son[i] ?? toplam) >= toplam ? toplam : son[i] - PAY]);
  atilan.push(...kes);
  atilan.sort((a, b) => a[0] - b[0]);
  const aralik = [];
  let t = 0;
  for (const [a, b] of atilan) {
    if (a > t + 0.05) aralik.push([t, a]);
    t = Math.max(t, b);
  }
  if (toplam > t + 0.05) aralik.push([t, toplam]);
  return aralik;
};

// Ham zamanı kesilmiş zamana çevirir (atılmış yere düşen kelime null döner).
const tasi = (aralik, kayma) => (x) => {
  let birikim = 0;
  for (const [a, b] of aralik) {
    if (x >= a && x <= b) return kayma + birikim + (x - a);
    birikim += b - a;
  }
  return null;
};

const sesParcalari = [];
const kelimeler = [];
const sahneler = [];
let kayma = 0;

for (const [i, k] of proje.klipler.entries()) {
  const yaziJson = join(cikti, `klip${i}.json`);
  if (!existsSync(yaziJson)) execFileSync(join(KOK, ".venv/bin/python"), [join(KOK, "yazi.py"), k.dosya, yaziJson], { stdio: "inherit" });

  const aralik = tutulacak(k.dosya, k.kes);
  const uzunluk = aralik.reduce((t, [a, b]) => t + (b - a), 0);

  // Ses: her aralık 10 ms yumuşak geçişle (tık sesi olmasın) uç uca.
  const sesF = aralik
    .map(([a, b], j) => `[0:a]atrim=${a}:${b},asetpts=PTS-STARTPTS,afade=t=in:d=0.01,afade=t=out:st=${(b - a - 0.01).toFixed(3)}:d=0.01[a${j}]`)
    .join(";");
  const sesDosya = join(cikti, `ses${i}.wav`);
  ff("-i", k.dosya, "-filter_complex", `${sesF};${aralik.map((_, j) => `[a${j}]`).join("")}concat=n=${aralik.length}:v=0:a=1[a]`, "-map", "[a]", "-ar", "48000", sesDosya);
  sesParcalari.push(sesDosya);

  if (k.goruntu) {
    // Görüntü: aynı kesimler, dikey 1080x1920 H.264 (iPhone HEVC/döndürme sorunsuz okunsun).
    const vF = aralik.map(([a, b], j) => `[0:v]trim=${a}:${b},setpts=PTS-STARTPTS[v${j}]`).join(";");
    ff("-i", k.dosya, "-filter_complex",
      `${vF};${aralik.map((_, j) => `[v${j}]`).join("")}concat=n=${aralik.length}:v=1:a=0,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30[v]`,
      "-map", "[v]", "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", "-an", join(cikti, `goruntu${i}.mp4`));
  }

  const t = tasi(aralik, kayma);
  for (const w of JSON.parse(readFileSync(yaziJson, "utf8"))) {
    // Kelimenin korunan sesle örtüşmesi 60 ms'den azsa kesilmiştir.
    const ortusme = aralik.reduce((top, [a, b]) => top + Math.max(0, Math.min(b, w.e) - Math.max(a, w.s)), 0);
    if (ortusme < 0.06) continue;
    const ilk = aralik.find(([, b]) => b > w.s);
    const s = t(Math.max(w.s, ilk[0]));
    const e = t(w.e) ?? s + ortusme;
    const metin = proje.duzelt?.[w.w] ?? w.w;
    if (!metin) continue;
    // "+..." düzeltmesi önceki kelimeye eklenir (ör. "startup" + "doktoru.com'a").
    if (metin.startsWith("+") && kelimeler.length) {
      const onceki = kelimeler[kelimeler.length - 1];
      onceki.w += metin.slice(1);
      onceki.e = +e.toFixed(3);
      continue;
    }
    kelimeler.push({ w: metin, s: +s.toFixed(3), e: +Math.max(e, s + 0.08).toFixed(3) });
  }
  sahneler.push({ klip: i, bas: kayma, son: kayma + uzunluk, goruntu: k.goruntu ? `${proje.ad}/goruntu${i}.mp4` : null });
  console.log(`klip${i}: ${sure(k.dosya).toFixed(1)} sn → ${uzunluk.toFixed(1)} sn (${aralik.length} parça)`);
  kayma += uzunluk;
}

ff(...sesParcalari.flatMap((f) => ["-i", f]), "-filter_complex", `${sesParcalari.map((_, j) => `[${j}:a]`).join("")}concat=n=${sesParcalari.length}:v=0:a=1,loudnorm=I=-14:TP=-1.5[a]`, "-map", "[a]", "-ar", "48000", join(cikti, "ses.wav"));
writeFileSync(join(cikti, "kurgu.json"), JSON.stringify({ ad: proje.ad, sure: kayma, kuyruk: proje.kuyruk ?? 1.5, gorsel: proje.gorsel, kapak: proje.kapak, kelimeler, sahneler }, null, 1));
console.log(`toplam ${kayma.toFixed(1)} sn → public/${proje.ad}/`);
