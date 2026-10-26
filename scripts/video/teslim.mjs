// Teslim: bir videonun paylaşıma hazır her şeyini tek klasörde toplar ve Paylaşım sekmesine işler.
//   ~/Desktop/Startup Doktoru Videolar/<ad>/
//     video.mp4 · kapak.jpg (1080x1920) · thumbnail.jpg (1280x720) · broll/ · metinler.md
//   Paylaşım sekmesi (ds_paylasim): aynı başlıklı kayıt "Hazır" aşamasında, platform metinleriyle.
//
// Kullanım: node teslim.mjs projeler/<ad>.json   (video yoksa render eder; --yeniden ile her şeyi yeniden üretir)
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "../../node_modules/@supabase/supabase-js/dist/index.mjs";

const KOK = dirname(fileURLToPath(import.meta.url));
const proje = JSON.parse(readFileSync(process.argv[2], "utf8"));
const yeniden = process.argv.includes("--yeniden");
const p = proje.paylasim;
if (!p?.baslik) throw new Error('Proje dosyasında "paylasim" (baslik, instagram, shorts, linkedin) yok');
if (!proje.kapak) throw new Error('Proje dosyasında "kapak" ayarı yok');

const klasor = join(homedir(), "Desktop", "Startup Doktoru Videolar", proje.ad);
mkdirSync(join(klasor, "broll"), { recursive: true });
const props = JSON.stringify({ proje: proje.ad });
const remotion = (...a) => execFileSync("npx", ["remotion", ...a, "--props", props, "--log=error"], { cwd: KOK, stdio: "inherit" });

// 1) Video, kapak, thumbnail
const video = join(KOK, "out", `${proje.ad}.mp4`);
if (yeniden || !existsSync(video)) remotion("render", "src/index.ts", "Video", video, "--codec=h264", "--crf=18");
copyFileSync(video, join(klasor, "video.mp4"));
for (const [id, ad] of [["Kapak", "kapak.jpg"], ["Thumbnail", "thumbnail.jpg"]]) {
  remotion("still", "src/index.ts", id, join(klasor, ad), "--image-format=jpeg", "--jpeg-quality=92");
}

// 2) Kullanılan B-roll'lar (kütüphane id'leriyle)
const kareler = proje.gorsel.filter((g) => g.tur === "broll").flatMap((g) => g.kareler);
for (const k of kareler) {
  const dosyalar = k.id ? [k.hareket ? `${k.id}.mp4` : `${k.id}.jpg`, k.ses && `${k.ses}.mp3`] : [k.resim, k.ses];
  for (const d of dosyalar.filter(Boolean)) {
    const kaynak = join(KOK, "public", proje.ad, d);
    if (existsSync(kaynak)) copyFileSync(kaynak, join(klasor, "broll", d));
  }
}

// 3) Paylaşım metinleri
const aiVar = kareler.length > 0 || proje.gorsel.some((g) => g.video);
writeFileSync(
  join(klasor, "metinler.md"),
  `# ${p.baslik}\n\n## Instagram (Reels)\n\n${p.instagram}\n\n## YouTube Shorts\n\n${p.shorts}\n\n## LinkedIn\n\n${p.linkedin}\n` +
    (aiVar ? `\n---\n⚠️ Videoda yapay zekâ ile üretilmiş görüntü var: paylaşırken platformun "AI ile oluşturuldu / değiştirilmiş içerik" seçeneğini işaretle.\n` : "")
);

// 4) Paylaşım sekmesine işle (aynı başlık varsa güncelle; paylaşım işaretlerine/linklere dokunma)
const env = Object.fromEntries(
  readFileSync(join(KOK, "../../.env.local"), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")])
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// Videoda kullanılan efektler (Paylaşım sekmesindeki efekt listesinin adlarıyla).
const efektler = new Set(["kinetic captions"]);
for (const g of proje.gorsel) {
  if (g.tur === "yuz" && g.zoom) efektler.add("digital zoom");
  if (g.sayac || g.kareler?.some((k) => k.sayac)) efektler.add("chart grow");
  if (g.tur === "liste") efektler.add("checklist");
}
const kurgu = JSON.parse(readFileSync(join(KOK, "public", proje.ad, "kurgu.json"), "utf8"));

const { data: var_ } = await db.from("ds_paylasim").select("*").eq("baslik", p.baslik).maybeSingle();
const platformlar = { ...(var_?.platformlar ?? {}) };
for (const k of ["instagram", "shorts", "linkedin"]) platformlar[k] = { ...platformlar[k], metin: p[k] };
const kayit = {
  baslik: p.baslik,
  durum: var_?.durum === "paylasildi" ? "paylasildi" : "hazir",
  efektler: [...efektler],
  notlar: `Proje: ${proje.ad}\nKlasör: ${klasor}\n\n${kurgu.kelimeler.map((w) => w.w).join(" ")}`,
  platformlar,
  updated_at: new Date().toISOString(),
};
const { error } = var_
  ? await db.from("ds_paylasim").update(kayit).eq("id", var_.id)
  : await db.from("ds_paylasim").insert(kayit);
if (error) throw error;

console.log(`✓ ${klasor}\n✓ Paylaşım sekmesi: "${p.baslik}" ${var_ ? "güncellendi" : "eklendi"} (Hazır)`);
