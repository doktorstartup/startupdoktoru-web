// Yüz çekimi olmayan bir sahne için, kendi sesinle konuşan yüz videosu üretir (fal.ai).
// Ses gerçek kaydındır; yalnız görüntü üretilir. Paylaşırken platformda "AI" etiketi işaretlenmeli.
//
// Kullanım: node yuz-uret.mjs projeler/<ad>.json "<sahne ifadesi>" <lipsync|omnihuman> [referans.mp4]
//   lipsync   → referans yüz çekiminin ağzı sese uydurulur (en doğal; Sync lipsync-2, ~$0,05/sn).
//   omnihuman → referanstan tek kare alınır, konuşan insan üretilir (ByteDance OmniHuman 1.5).
//   referans  → varsayılan: projenin yüz çekimi (public/<ad>/goruntu0.mp4).
// Çıktı: public/<ad>/yuz-<yöntem>.mp4 → proje dosyasında sahneye "video" olarak verilir.
import { readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fal } from "@fal-ai/client";

const KOK = dirname(fileURLToPath(import.meta.url));
const [projeDosya, ifade, yontem = "lipsync", referansArg] = process.argv.slice(2);
const proje = JSON.parse(readFileSync(projeDosya, "utf8"));
const klasor = join(KOK, "public", proje.ad);
const kurgu = JSON.parse(readFileSync(join(klasor, "kurgu.json"), "utf8"));
const referans = referansArg ?? join(klasor, "goruntu0.mp4");

const env = readFileSync(join(KOK, "../../.env.local"), "utf8");
fal.config({ credentials: env.match(/^FAL_KEY=(.+)$/m)?.[1].trim() });

// Sahnenin konuşmadaki başı/sonu (Video.tsx ile aynı eşleştirme).
const sade = (x) => x.toLocaleLowerCase("tr").replace(/[^\p{L}\p{N}]/gu, "");
const ifadeAni = (ifade) => {
  const parca = ifade.split(/\s+/).map(sade);
  const k = kurgu.kelimeler;
  const i = k.findIndex((_, i) => parca.every((p, j) => k[i + j] && sade(k[i + j].w).startsWith(p)));
  if (i < 0) throw new Error(`İfade bulunamadı: "${ifade}"`);
  return k[i].s;
};
const si = proje.gorsel.findIndex((g) => g.ifade === ifade);
if (si < 0) throw new Error(`Sahne yok: "${ifade}"`);
const bas = ifadeAni(ifade);
const son = proje.gorsel[si + 1] ? ifadeAni(proje.gorsel[si + 1].ifade) : kurgu.sure;

const sesDosya = join(klasor, `yuz-ses.wav`);
execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", `${bas}`, "-to", `${son}`, "-i", join(klasor, "ses.wav"), sesDosya]);
console.log(`sahne ${bas.toFixed(2)}–${son.toFixed(2)} sn (${(son - bas).toFixed(1)} sn), yöntem: ${yontem}`);

const yukle = async (f, tur) => fal.storage.upload(new Blob([readFileSync(f)], { type: tur }));
const audio_url = await yukle(sesDosya, "audio/wav");

let model, input;
if (yontem === "lipsync") {
  model = "fal-ai/sync-lipsync/v2";
  input = { video_url: await yukle(referans, "video/mp4"), audio_url, model: "lipsync-2", sync_mode: "bounce" };
} else {
  // Ağzı kapalıya yakın, eli yüzünü kapatmayan bir kare.
  const kare = join(klasor, "yuz-kare.jpg");
  execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", "2.5", "-i", referans, "-frames:v", "1", "-q:v", "2", kare]);
  model = "fal-ai/bytedance/omnihuman/v1.5";
  input = { image_url: await yukle(kare, "image/jpeg"), audio_url, resolution: "1080p" };
}

let durum;
const sonuc = await fal.subscribe(model, {
  input,
  logs: false,
  onQueueUpdate: (u) => u.status !== durum && console.log((durum = u.status)),
});
const url = sonuc.data.video?.url;
if (!url) throw new Error("Video dönmedi: " + JSON.stringify(sonuc.data).slice(0, 300));
const cikti = join(klasor, `yuz-${yontem}.mp4`);
await writeFile(cikti, Buffer.from(await (await fetch(url)).arrayBuffer()));
console.log(`✓ ${cikti}`);
