// Projede kullanılan kütüphane çekimlerini (tur "cekim": kendi tepki/duygu görüntülerin) hazırlar:
// aralığı keser, dikey 1080x1920 H.264'e çevirir, hafif renk düzeltmesi yapar → public/<ad>/<id>.mp4.
// Sahnede "video": "<id>.mp4" ya da "pip": "<id>.mp4" olarak geçen ve kütüphanede çekim olan her id işlenir.
//
// Kullanım: node cekim.mjs projeler/<ad>.json
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KOK = dirname(fileURLToPath(import.meta.url));
const proje = JSON.parse(readFileSync(process.argv[2], "utf8"));
const klasor = join(KOK, "public", proje.ad);
mkdirSync(klasor, { recursive: true });
const kutuphane = JSON.parse(readFileSync(join(KOK, "kutuphane", "index.json"), "utf8"));

const istenen = new Set(proje.gorsel.flatMap((g) => [g.video, g.pip]).filter(Boolean).map((v) => v.replace(/\.mp4$/, "")));
for (const id of istenen) {
  const c = kutuphane.find((x) => x.id === id && x.tur === "cekim");
  if (!c) continue; // çekim değil (ör. dudak senkronu videosu)
  const kaynak = c.dosya.replace(/^~/, homedir());
  if (!existsSync(kaynak)) throw new Error(`Çekim dosyası yok: ${kaynak}`);
  const [a, b] = c.aralik;
  execFileSync("ffmpeg", [
    "-v", "error", "-y", "-ss", `${a}`, "-to", `${b}`, "-i", kaynak,
    // Hafif "stüdyo" görünümü: kontrast/doygunluk biraz yukarı, hafif sıcaklık.
    "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,eq=contrast=1.06:saturation=1.08:gamma=0.98,colorbalance=rs=0.02:bs=-0.02",
    "-an", "-c:v", "libx264", "-crf", "17", "-pix_fmt", "yuv420p", join(klasor, `${id}.mp4`),
  ]);
  console.log(`✓ ${id} (${c.duygu}, ${(b - a).toFixed(1)} sn)`);
}
