// B-roll: projedeki "broll" sahnelerinin görsel/video/ses efektlerini hazırlar.
// Önce KÜTÜPHANEYE bakar (kutuphane/index.json): aynı id varsa yeniden kullanır, yoksa üretip ekler.
//   Görsel: Flux dev (~$0,036)   Hareket: Veo 3.1 Lite görselden videoya (~$0,05/sn, 4–8 sn)
//   Ses efekti: ElevenLabs SFX (~$0,003)
//
// Kullanım: node broll-uret.mjs projeler/<ad>.json          → eksikleri fal.ai ile otomatik üretir (ücretli, ~$0,20/klip)
//           node broll-uret.mjs projeler/<ad>.json --flow   → eksikleri Google Flow ile (abonelikle bedava, yarı otomatik)
// Flow'da ürettiğin videoyu ekle: node kutuphane.mjs ekle <dosya.mp4> <id> [etiket ...]
// Kare örneği:
//   { "ifade": "Kapı zili", "id": "kargocu-kapi-zil", "etiket": ["kapı", "kargo"],
//     "istem": "<görsel tarifi, İngilizce>", "hareket": "<hareket tarifi; yoksa durağan görsel>",
//     "ses": "zil-dingdong", "ses_istem": "<ses tarifi>" }
// Kütüphanede olan bir id için yalnız "id" (ve istenirse "hareket") yazmak yeter.
import { readFileSync, writeFileSync, existsSync, copyFileSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fal } from "@fal-ai/client";

const KOK = dirname(fileURLToPath(import.meta.url));
const KUT = join(KOK, "kutuphane");
const proje = JSON.parse(readFileSync(process.argv[2], "utf8"));
const klasor = join(KOK, "public", proje.ad);
fal.config({ credentials: readFileSync(join(KOK, "../../.env.local"), "utf8").match(/^FAL_KEY=(.+)$/m)?.[1].trim() });

// Tüm görsellerin ortak görünümü: sinematik, dikey, marka renklerine yakın.
const STIL = "cinematic photorealistic photo, vertical 9:16 composition, teal and dark navy color grade, shallow depth of field, no text, no watermark";

const indexYolu = join(KUT, "index.json");
const kutuphane = existsSync(indexYolu) ? JSON.parse(readFileSync(indexYolu, "utf8")) : [];
const bul = (id, tur) => kutuphane.find((x) => x.id === id && x.tur === tur);
const ekle = (kayit) => {
  kutuphane.push({ ...kayit, tarih: new Date().toISOString().slice(0, 10) });
  writeFileSync(indexYolu, JSON.stringify(kutuphane, null, 1));
};
const indir = async (url, dosya) => writeFile(dosya, Buffer.from(await (await fetch(url)).arrayBuffer()));
const sure = (f) => +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString();
let harcama = 0;

const gorsel = async (k) => {
  if (bul(k.id, "gorsel")) return;
  if (!k.istem) throw new Error(`"${k.id}" kütüphanede yok ve "istem" verilmemiş`);
  const r = await fal.subscribe("fal-ai/flux/dev", { input: { prompt: `${k.istem}, ${STIL}`, image_size: { width: 896, height: 1600 } } });
  await indir(r.data.images[0].url, join(KUT, `${k.id}.jpg`));
  ekle({ id: k.id, tur: "gorsel", dosya: `${k.id}.jpg`, istem: k.istem, etiket: k.etiket ?? [], kaynak: "fal-ai/flux/dev", maliyet: 0.036 });
  harcama += 0.036;
  console.log("✓ görsel", k.id);
};

// Görselden hareketli video (Veo 3.1 Lite). Süre: karenin süresine yetecek en kısa seçenek.
const video = async (k, gerekenSn) => {
  if (bul(k.id, "video")) return;
  const s = gerekenSn <= 4 ? 4 : gerekenSn <= 6 ? 6 : 8;
  const image_url = await fal.storage.upload(new Blob([readFileSync(join(KUT, `${k.id}.jpg`))], { type: "image/jpeg" }));
  const r = await fal.subscribe("fal-ai/veo3.1/lite/image-to-video", {
    input: { prompt: `${k.hareket}, slow cinematic camera movement, realistic motion`, image_url, aspect_ratio: "9:16", resolution: "720p", duration: `${s}s`, generate_audio: false },
  });
  await indir(r.data.video.url, join(KUT, `${k.id}.mp4`));
  ekle({ id: k.id, tur: "video", dosya: `${k.id}.mp4`, istem: k.hareket, etiket: k.etiket ?? bul(k.id, "gorsel")?.etiket ?? [], kaynak: "fal-ai/veo3.1/lite/image-to-video", sure: s, maliyet: 0.05 * s });
  harcama += 0.05 * s;
  console.log(`✓ video ${k.id} (${s} sn)`);
};

const ses = async (k) => {
  if (bul(k.ses, "ses")) return;
  if (!k.ses_istem) throw new Error(`"${k.ses}" sesi kütüphanede yok ve "ses_istem" verilmemiş`);
  const r = await fal.subscribe("fal-ai/elevenlabs/sound-effects/v2", { input: { text: k.ses_istem, duration_seconds: k.ses_sure ?? 1.5 } });
  await indir(r.data.audio.url, join(KUT, `${k.ses}.mp3`));
  ekle({ id: k.ses, tur: "ses", dosya: `${k.ses}.mp3`, istem: k.ses_istem, etiket: k.etiket ?? [], kaynak: "fal-ai/elevenlabs/sound-effects/v2", maliyet: 0.003 });
  harcama += 0.003;
  console.log("✓ ses", k.ses);
};

// Karenin süresi (video uzunluğunu seçmek için): sonraki karenin/sahnenin başına kadar.
const kurgu = JSON.parse(readFileSync(join(klasor, "kurgu.json"), "utf8"));
const sade = (x) => x.toLocaleLowerCase("tr").replace(/[^\p{L}\p{N}]/gu, "");
const an = (ifade, sonra = 0) => {
  const p = ifade.split(/\s+/).map(sade);
  const w = kurgu.kelimeler;
  const i = w.findIndex((x, i) => x.s >= sonra && p.every((q, j) => w[i + j] && sade(w[i + j].w).startsWith(q)));
  if (i < 0) throw new Error(`İfade bulunamadı: "${ifade}"`);
  return w[i].s;
};

// --flow (bedava): kütüphanede olmayan her klip için tarifi panoya kopyala, Google Flow'u aç,
// İndirilenler'e düşen yeni videoyu yakalayıp kütüphaneye ekle, sonrakine geç. Senin işin: yapıştır → üret → indir.
// (Flow'u robotla kullanmak Google şartlarına aykırı — tıklamalar senin, dosya işleri sistemin.)
if (process.argv.includes("--flow")) {
  const kareler = proje.gorsel.filter((g) => g.tur === "broll").flatMap((g) => g.kareler.filter((k) => k.id));
  const eksik = kareler.filter((k) => !bul(k.id, k.hareket ? "video" : "gorsel"));
  const INDIRILENLER = join(homedir(), "Downloads");
  const yeniVideo = async (sonra) => {
    for (;;) {
      const adaylar = readdirSync(INDIRILENLER)
        .filter((f) => /\.(mp4|mov)$/i.test(f))
        .map((f) => join(INDIRILENLER, f))
        .filter((f) => statSync(f).mtimeMs > sonra);
      if (adaylar.length) {
        const f = adaylar[0];
        const boyut = statSync(f).size;
        await new Promise((r) => setTimeout(r, 1500));
        if (statSync(f).size === boyut) return f; // indirme bitti
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
  };
  for (const [i, k] of eksik.entries()) {
    // Veo sesli üretir: ses tarifi yazılırsa ayrı ses efektine gerek kalmaz (karede "klip_sesi": 0.5).
    const tarif = [k.istem, k.hareket, "cinematic realistic video, vertical 9:16, teal and dark navy color grade, no text", k.ses_istem && `Sound: ${k.ses_istem}`]
      .filter(Boolean)
      .join(". ");
    execFileSync("pbcopy", { input: tarif });
    if (i === 0) execFileSync("open", ["https://flow.google.com"]);
    console.log(`\n[${i + 1}/${eksik.length}] ${k.id} — tarif panoda. Flow'da: yapıştır (⌘V) → 9:16 seç → üret → indir.`);
    console.log(`  ${tarif}`);
    const f = await yeniVideo(Date.now());
    execFileSync("node", [join(KOK, "kutuphane.mjs"), "ekle", f, k.id, ...(k.etiket ?? [])], { stdio: "inherit" });
    const kayit = JSON.parse(readFileSync(indexYolu, "utf8"));
    kutuphane.splice(0, kutuphane.length, ...kayit);
  }
  const eksikSes = kareler.filter((k) => k.ses && !bul(k.ses, "ses"));
  if (eksikSes.length) {
    console.log(`\nSes efekti eksik: ${eksikSes.map((k) => k.ses).join(", ")} — Flow videosunun kendi sesi için karede "ses" yerine "klip_sesi": 0.5 yaz, ya da --flow olmadan (fal.ai) üret.`);
    process.exit(1);
  }
}

const isler = [];
proje.gorsel.forEach((g, gi) => {
  if (g.tur !== "broll") return;
  const sahneSonu = proje.gorsel[gi + 1] ? an(proje.gorsel[gi + 1].ifade) : kurgu.sure;
  const baslar = g.kareler.map((k, i) => (i === 0 ? an(g.ifade) : an(k.ifade, an(g.ifade))));
  g.kareler.forEach((k, i) => {
    if (!k.id) return; // eski usul ("resim" ile) kare
    const gereken = (baslar[i + 1] ?? sahneSonu) - baslar[i];
    isler.push(
      (async () => {
        if (k.hareket && bul(k.id, "video")) return void (k.ses && (await ses(k)));
        await gorsel(k);
        if (k.hareket) await video(k, gereken);
        if (k.ses) await ses(k);
      })()
    );
  });
});
await Promise.all(isler);

// Projede kullanılanları public/<ad>/ altına kopyala (Remotion oradan okur).
for (const g of proje.gorsel.filter((g) => g.tur === "broll")) {
  for (const k of g.kareler.filter((k) => k.id)) {
    for (const ad of [k.hareket ? `${k.id}.mp4` : `${k.id}.jpg`, k.ses && `${k.ses}.mp3`].filter(Boolean)) {
      copyFileSync(join(KUT, ad), join(klasor, ad));
    }
    if (k.hareket) console.log(`  ${k.id}.mp4: ${sure(join(klasor, `${k.id}.mp4`)).toFixed(1)} sn`);
  }
}
console.log(harcama ? `harcama ≈ $${harcama.toFixed(2)}` : "hepsi kütüphaneden — harcama yok");
