// B-roll kütüphanesi: üretilmiş görsel/video/sesleri listeler ve arar (tekrar kullanmak için).
// Kullanım: node kutuphane.mjs            → hepsi
//           node kutuphane.mjs ara kapı   → id, etiket ya da tarifte geçenler
//           node kutuphane.mjs ekle <dosya> <id> [etiket ...]  → dışarıda (ör. Google Flow) üretileni ekle
import { readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const yol = join(dirname(fileURLToPath(import.meta.url)), "kutuphane", "index.json");
const liste = existsSync(yol) ? JSON.parse(readFileSync(yol, "utf8")) : [];
const [komut, ...kelime] = process.argv.slice(2);

if (komut === "ekle") {
  const [dosya, id, ...etiket] = kelime;
  if (!dosya || !id || !existsSync(dosya)) throw new Error("Kullanım: node kutuphane.mjs ekle <dosya> <id> [etiket ...]");
  const uzanti = extname(dosya).toLowerCase();
  const tur = { ".mp4": "video", ".mov": "video", ".jpg": "gorsel", ".jpeg": "gorsel", ".png": "gorsel", ".mp3": "ses", ".wav": "ses" }[uzanti];
  if (!tur) throw new Error(`Desteklenmeyen dosya: ${uzanti}`);
  const hedef = `${id}${{ video: ".mp4", gorsel: ".jpg", ses: ".mp3" }[tur]}`;
  const hedefYol = join(dirname(yol), hedef);
  // Videolar 1080x1920 H.264'e, görseller jpg'ye, sesler mp3'e çevrilir (Remotion tek biçim okusun).
  const donustur = {
    video: ["-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30", "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "aac"],
    gorsel: ["-q:v", "2"],
    ses: [],
  }[tur];
  if (uzanti === extname(hedef) && tur !== "video") copyFileSync(dosya, hedefYol);
  else execFileSync("ffmpeg", ["-v", "error", "-y", "-i", dosya, ...donustur, hedefYol]);
  const sure = tur === "gorsel" ? undefined : +(+execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", hedefYol]).toString()).toFixed(1);
  const kalan = liste.filter((x) => !(x.id === id && x.tur === tur));
  kalan.push({ id, tur, dosya: hedef, etiket, kaynak: "google-flow", sure, maliyet: 0, tarih: new Date().toISOString().slice(0, 10) });
  writeFileSync(yol, JSON.stringify(kalan, null, 1));
  console.log(`✓ ${tur} ${id} eklendi${sure ? ` (${sure} sn)` : ""}`);
  process.exit(0);
}
const aranan = komut === "ara" ? kelime.join(" ").toLocaleLowerCase("tr") : "";

const sonuc = liste.filter((x) => !aranan || [x.id, x.istem, ...(x.etiket ?? [])].join(" ").toLocaleLowerCase("tr").includes(aranan));
for (const x of sonuc) {
  console.log(`${x.tur.padEnd(6)} ${x.id.padEnd(28)} ${(x.etiket ?? []).join(", ")}${x.sure ? `  (${x.sure} sn)` : ""}`);
}
const toplam = liste.reduce((t, x) => t + (x.maliyet ?? 0), 0);
console.log(`\n${sonuc.length}/${liste.length} kayıt · kütüphanenin toplam üretim maliyeti ≈ $${toplam.toFixed(2)}`);
