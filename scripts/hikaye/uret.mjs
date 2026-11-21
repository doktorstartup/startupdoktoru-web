// Haftalık söz hikâyesi üretimi: her söz için o söze özel karakalem sahne + maskot (Kapsül), yazılar bizden.
//   Çizim: fal.ai nano-banana/edit (~4 sent/görsel), maskot referansı public/brand/kapsul-ikon-acik-zemin.svg.
//   Kontrol: Gemini (ücretsiz) çizime bakar; maskotta kol/bacak/ağız ya da izinsiz yazı varsa yeniden çizilir (en fazla 3 deneme).
//   Yazılar (başlık, sonuç, vurgu) sharp ile basılır: yapay zekâ Türkçe harfleri bozuyor.
//
// Kullanım: node scripts/hikaye/uret.mjs scripts/hikaye/hafta/<dosya>.json
//   Dosya: [{ "ad": "kisa-ad", "soz": "tam söz", "ust": "başlık", "alt1": "sonuç ilk satır", "alt2": "vurgulu son satır",
//             "sahne": "İngilizce sahne tarifi", "yazi": "çizimde izin verilen yazı (isteğe bağlı, sayı gibi)",
//             "linkedin": "LinkedIn gönderi metni (isteğe bağlı; varsa görsel 08:30 TR'de LinkedIn'de de paylaşılır)" }]
// Çıktı: ~/Desktop/hikaye-ornekleri/<dosya adı>/NN-ad.jpg — onaydan sonra: node scripts/hikaye/kuyruga-al.mjs --klasor <o klasör>
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KOK = join(dirname(fileURLToPath(import.meta.url)), "../..");
const sharp = createRequire(join(KOK, "package.json"))("sharp");
const { fal } = createRequire(join(KOK, "scripts/video/package.json"))("@fal-ai/client");
const env = readFileSync(join(KOK, ".env.local"), "utf8");
const anahtar = (ad) => env.match(new RegExp(`^${ad}=(.+)$`, "m"))?.[1].trim().replace(/^"|"$/g, "");
fal.config({ credentials: anahtar("FAL_KEY") });

const girdi = process.argv[2];
const sozler = JSON.parse(readFileSync(girdi, "utf8"));
const cikti = join(homedir(), "Desktop", "hikaye-ornekleri", basename(girdi, ".json"));
mkdirSync(cikti, { recursive: true });

const STIL = `Hand-drawn graphite pencil sketch illustration on warm off-white paper, monochrome grey; the ONLY color in the whole image is the turquoise of the mascot. Vertical 3:4. The scene is large and fills the middle 70% of the frame. Faceless simple sketched human figures.
The mascot is the character in the attached image: a tilted vertical medicine capsule, top half turquoise, bottom half white, navy outline, two white vertical pill-shaped eyes on the turquoise half. It is ONLY a capsule shape with two eyes: absolutely no mouth, no arms, no hands, no legs, no feet, nothing attached, exactly like the attached image. It never stands or walks: it FLOATS slightly in the air with a small soft shadow on the ground beneath it (wherever the scene says it stands or sits, draw it hovering there). Draw it clearly visible, not tiny.
Keep the top 12% and bottom 12% as empty paper.`;

const maskotUrl = await fal.storage.upload(
  new Blob([await sharp(join(KOK, "public/brand/kapsul-ikon-acik-zemin.svg"), { density: 300 }).resize(800).flatten({ background: "#ffffff" }).png().toBuffer()], { type: "image/png" }),
);

async function ciz(s) {
  const yazi = s.yazi ? `The only text allowed in the image: ${s.yazi}.` : "Absolutely NO text, letters, words or numbers anywhere; no logo, no watermark.";
  const r = await fal.subscribe("fal-ai/nano-banana/edit", { input: { prompt: `${STIL}\nScene: ${s.sahne}\n${yazi}`, image_urls: [maskotUrl], aspect_ratio: "3:4", num_images: 1 } });
  return Buffer.from(await (await fetch(r.data.images[0].url)).arrayBuffer());
}

// Gemini'ye sorar: maskot kuralı ve izinsiz yazı. Cevap alınamazsa "kontrol edilemedi" döner (sessizce geçmez).
async function denetle(png, s) {
  const istem = `This is a pencil illustration with a turquoise capsule mascot. Answer ONLY JSON {"uzuv": boolean, "yazi": boolean, "maskot_yok": boolean}.
uzuv: true if the capsule mascot has any arms, hands, legs, feet or a mouth.
yazi: true if the image contains any written words or letters${s.yazi ? ` other than: ${s.yazi}` : ""}.
maskot_yok: true if the turquoise capsule mascot is missing.`;
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": anahtar("GEMINI_API_KEY") },
    body: JSON.stringify({ contents: [{ parts: [{ text: istem }, { inline_data: { mime_type: "image/png", data: png.toString("base64") } }] }], generationConfig: { responseMimeType: "application/json" } }),
  });
  const cevap = await r.json();
  // Ücretsiz katmanın dakika sınırı: bekleyip bir kez daha sor.
  if (cevap.error?.code === 429 && !s._tekrar) {
    await new Promise((t) => setTimeout(t, 60000));
    return denetle(png, { ...s, _tekrar: true });
  }
  try {
    const d = JSON.parse(cevap.candidates[0].content.parts.find((p) => p.text).text);
    return [d.uzuv && "maskotta uzuv", d.yazi && "izinsiz yazı", d.maskot_yok && "maskot yok"].filter(Boolean);
  } catch {
    return [`kontrol edilemedi (${cevap.error?.message?.slice(0, 80) || "cevap okunamadı"})`];
  }
}

const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
async function birlestir(png, s, dosya) {
  const W = 1080, H = 1920, gen = 1060, yuk = Math.round((gen * 1184) / 864), ust = Math.round((H - yuk) / 2) + 20;
  const maske = await sharp(Buffer.from(`<svg width="${gen}" height="${yuk}" xmlns="http://www.w3.org/2000/svg"><defs><filter id="b"><feGaussianBlur stdDeviation="30"/></filter></defs><rect x="45" y="45" width="${gen - 90}" height="${yuk - 90}" fill="#fff" filter="url(#b)"/></svg>`)).png().toBuffer();
  const cizim = await sharp(png).resize(gen, yuk).ensureAlpha().composite([{ input: maske, blend: "dest-in" }]).png().toBuffer();
  const boy = (t, f) => t.length * f * 0.56; // Avenir Next kalın için yaklaşık genişlik
  const f1 = s.ust.length > 26 ? 58 : s.ust.length > 22 ? 64 : 76, f2 = s.alt1.length > 26 ? 52 : 58, f3 = s.alt2.length > 20 ? 64 : 74;
  // Çizim yazının altına taşarsa yazı okunur kalsın: başlık ve sonucun arkasına yumuşak kâğıt zemin.
  const yazi = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs><filter id="z"><feGaussianBlur stdDeviation="24"/></filter></defs>
<rect x="-40" y="230" width="${W + 80}" height="140" fill="#F5EFDA" opacity=".9" filter="url(#z)"/>
<rect x="-40" y="1470" width="${W + 80}" height="230" fill="#F5EFDA" opacity=".9" filter="url(#z)"/>
<text x="540" y="330" text-anchor="middle" font-family="Avenir Next" font-weight="700" font-size="${f1}" fill="#1d1d1f">${esc(s.ust)}</text>
<text x="540" y="1530" text-anchor="middle" font-family="Avenir Next" font-weight="600" font-size="${f2}" fill="#1d1d1f">${esc(s.alt1)}</text>
<rect x="${540 - boy(s.alt2, f3) / 2 - 22}" y="1568" width="${boy(s.alt2, f3) + 44}" height="92" rx="14" fill="#1BA1C4" opacity=".28"/>
<text x="540" y="1638" text-anchor="middle" font-family="Avenir Next" font-weight="700" font-size="${f3}" fill="#1d1d1f">${esc(s.alt2)}</text>
<text x="540" y="1750" text-anchor="middle" font-family="Avenir Next" font-weight="600" font-size="32" fill="#26304A" opacity=".7">@startupdoktoru</text>
</svg>`);
  await sharp({ create: { width: W, height: H, channels: 3, background: "#F5EFDA" } }).composite([{ input: cizim, left: 10, top: ust }, { input: yazi }]).jpeg({ quality: 92 }).toFile(dosya);
}

const ozet = [];
// Aynı anda en fazla 2 söz: Gemini ücretsiz katmanının dakika sınırına takılmasın.
const sira = sozler.map((s, i) => [s, i]);
const isci = async () => {
  for (let x; (x = sira.shift()); ) await tek(...x);
};
await Promise.all([isci(), isci()]);
async function tek(s, i) {
  {
    const dosya = join(cikti, `${String(i + 1).padStart(2, "0")}-${s.ad}.jpg`);
    if (existsSync(dosya)) return ozet.push({ i, ad: s.ad, not: "zaten var, atlandı" });
    let png, sorun = [];
    for (let deneme = 1; deneme <= 3; deneme++) {
      png = await ciz(s);
      writeFileSync(join(cikti, `.${s.ad}-ham-${deneme}.png`), png);
      sorun = await denetle(png, s);
      if (!sorun.length) break;
      console.log(`${s.ad}: deneme ${deneme} — ${sorun.join(", ")}`);
    }
    await birlestir(png, s, dosya);
    ozet.push({ i, ad: s.ad, not: sorun.length ? `KONTROL ET: ${sorun.join(", ")}` : "temiz" });
  }
}
writeFileSync(join(cikti, "sozler.json"), JSON.stringify(sozler, null, 1));
for (const o of ozet.sort((a, b) => a.i - b.i)) console.log(`${String(o.i + 1).padStart(2, "0")} ${o.ad}: ${o.not}`);
console.log(`\n${cikti}`);
