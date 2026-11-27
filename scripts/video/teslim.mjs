// Teslim: bir videonun paylaşıma hazır her şeyini tek klasörde toplar ve Paylaşım sekmesine işler.
//   ~/Desktop/Startup Doktoru Videolar/<ad>/
//     video.mp4 · kapak.jpg (1080x1920) · thumbnail.jpg (1280x720) · broll/ · metinler.md
//   Paylaşım sekmesi (ds_paylasim): aynı başlıklı kayıt "Hazır" aşamasında, platform metinleriyle.
//   Kuyruk: video + kapak Supabase Storage'a yüklenir, video ilk boş güne yerleşir.
//
// Kullanım: node teslim.mjs projeler/<ad>.json   (video yoksa render eder; --yeniden ile her şeyi yeniden üretir)
//   --dry-run: klasörü ve yayın dosyasını üretir, veritabanına ve Storage'a dokunmaz.
//   VIDEO_TESLIM_KOK: teslim klasörünün kökü (varsayılan Masaüstü).
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "../../node_modules/@supabase/supabase-js/dist/index.mjs";
import { instagramMetinHatalari } from "../instagram-metin.mjs";

const KOK = dirname(fileURLToPath(import.meta.url));
const proje = JSON.parse(readFileSync(process.argv[2], "utf8"));
const yeniden = process.argv.includes("--yeniden");
const kuru = process.argv.includes("--dry-run");
const DOSYA_SINIRI = 45 * 1024 * 1024; // Supabase ücretsiz plan tek dosya sınırı 50 MB
const p = proje.paylasim;
if (!p?.baslik) throw new Error('Proje dosyasında "paylasim" (baslik, instagram, shorts, linkedin) yok');
if (!proje.kapak) throw new Error('Proje dosyasında "kapak" ayarı yok');
const metinHatasi = instagramMetinHatalari(p.instagram || "");
if (metinHatasi.length) throw new Error(`Instagram metni:\n  - ${metinHatasi.join("\n  - ")}`);

// Stüdyo kapısı: müzik, ses efekti ve açılış kancası olmadan video kuyruğa giremez — 2026-11-13'te
// eski bir proje üçü de olmadan yayına çıktı. Bilerek sade video için projeye "sade": true yazılır.
if (!proje.sade) {
  const eksik = [
    !proje.muzik?.dosya && '"muzik"',
    !proje.efektler?.length && '"efektler"',
    !proje.gorsel?.[0]?.kanca?.length && 'ilk sahnede "kanca"',
  ].filter(Boolean);
  if (eksik.length) throw new Error(`Stüdyo katmanı eksik: ${eksik.join(", ")}. Ekle ya da bilerek sade video ise projeye "sade": true yaz.`);
}

// Kapak ayarı kurguda yoksa Kapak/Thumbnail boş (siyah) çıkar — 2026-11-09'da iki videoda oldu. Projeden eşitle.
const kurguDosya = join(KOK, "public", proje.ad, "kurgu.json");
const kurguJson = JSON.parse(readFileSync(kurguDosya, "utf8"));
if (JSON.stringify(kurguJson.kapak) !== JSON.stringify(proje.kapak)) writeFileSync(kurguDosya, JSON.stringify({ ...kurguJson, kapak: proje.kapak }, null, 1));

// 1,7 sn kuralı (Eser, 2026-11-16): görsel ve işitsel bütün hook'lar ilk 1,7 saniyede verilir —
// ekranda kanca yazısı ilk sahnede (kare 0'dan), ilk konuşulan kelime ve ilk ses efekti ≤ 1,7 sn.
if (!proje.sade) {
  const SINIR = 1.7;
  const kel = kurguJson.kelimeler ?? [];
  const norm = (s) => s.toLocaleLowerCase("tr").replace(/[^\p{L}\p{N}]/gu, "");
  const ifadeAni = (ifade) => {
    const ilk = norm(ifade.split(/\s+/)[0]);
    return kel.find((w) => norm(w.w) === ilk)?.s ?? Infinity;
  };
  const efektAnlari = (kurguJson.efektler ?? []).map((e) => e.an ?? ifadeAni(e.ifade ?? "") + (e.kaydir ?? 0));
  const hata = [
    kel.length && kel[0].s > SINIR && `ilk kelime ${kel[0].s.toFixed(2)} sn'de`,
    !(Math.min(...efektAnlari) <= SINIR) && `ilk ses efekti ${Math.min(...efektAnlari).toFixed(2)} sn'de`,
  ].filter(Boolean);
  if (hata.length) throw new Error(`Hook'lar ilk ${SINIR} sn'de değil: ${hata.join(", ")}. Bütün görsel+işitsel hook'lar ${SINIR} sn içinde olmalı.`);

  // Asgari kalite (Eser onayı, 2026-11-16): hatali-basvuru seviyesinin altı teslim edilmez — bkz. tasarimciV1.md.
  // Sahne başı: "an" varsa o, yoksa ifadenin ilk kelimesi (bir önceki sahneden sonra aranır).
  const gorsel = kurguJson.gorsel ?? [];
  const baslar = [];
  for (const g of gorsel) {
    const once = baslar.at(-1) ?? 0;
    const ilk = norm((g.ifade ?? "").split(/\s+/)[0]);
    baslar.push(g.an ?? (baslar.length ? kel.find((w) => w.s >= once && norm(w.w) === ilk)?.s ?? Infinity : 0));
  }
  const sure = kurguJson.sure;
  const ortalama = sure / gorsel.length;
  const enUzun = Math.max(...baslar.map((b, i) => (baslar[i + 1] ?? sure) - b));
  const grafikTurleri = new Set(gorsel.map((g) => g.tur).filter((t) => !["yuz", "broll", "kapanis"].includes(t)));
  const araKanca = gorsel.slice(1).filter((g) => g.kanca?.length).length;
  const ciplakYuz = gorsel.filter((g) => g.tur === "yuz" && !g.zoom && !g.kanca && !g.isim).length;
  const sessizGecis = baslar.slice(1).filter((b) => !efektAnlari.some((a) => a >= b - 0.3 && a <= b + 0.15)).map((b) => b.toFixed(1));
  const eksik = [
    ortalama > 3.5 && `sahne başına ${ortalama.toFixed(1)} sn (en çok 3,5)`,
    enUzun > 7 && `${enUzun.toFixed(1)} sn hiç değişmeyen sahne (en çok 7)`,
    grafikTurleri.size < 3 && `${grafikTurleri.size} grafik türü (en az 3: liste/sayi/buyuk/grafik/ekran…)`,
    araKanca < 2 && `açılıştan sonra ${araKanca} kanca (en az 2)`,
    ciplakYuz && `${ciplakYuz} yüz sahnesinde zoom/kanca/isim yok`,
    efektAnlari.length < 20 && `${efektAnlari.length} ses efekti (en az 20)`,
    sessizGecis.length && `geçiş sesi olmayan kesimler: ${sessizGecis.join(", ")} sn`,
    !((kurguJson.muzik?.ses ?? 0) >= 0.14) && `müzik seviyesi ${kurguJson.muzik?.ses ?? 0} (en az 0,14)`,
    !proje.ses_filtre && '"ses_filtre" yok',
    gorsel.at(-1)?.tur !== "kapanis" && "son sahne kapanis değil",
    (sure < 25 || sure > 60) && `süre ${sure.toFixed(1)} sn (25–60)`,
  ].filter(Boolean);
  if (eksik.length) throw new Error(`Asgari kalitenin altında (referans: projeler/hatali-basvuru.json):\n  - ${eksik.join("\n  - ")}`);
}

const klasor = join(process.env.VIDEO_TESLIM_KOK || join(homedir(), "Desktop", "Startup Doktoru Videolar"), proje.ad);
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
// AI beyanı kurguda Claude'un kararı (README "AI beyanı"). Alan yoksa eski geniş kural: herhangi bir AI görüntü varsa beyan.
let aiVar = proje.ai_beyan;
if (typeof aiVar !== "boolean") {
  aiVar = kareler.length > 0 || proje.gorsel.some((g) => g.video);
  console.warn(`⚠️ Proje dosyasında "ai_beyan" yok: AI görüntü ${aiVar ? "var, beyan AÇIK" : "yok, beyan kapalı"} varsayıldı. Kurguda "ai_beyan": true|false yaz.`);
}
writeFileSync(
  join(klasor, "metinler.md"),
  `# ${p.baslik}\n\n## Instagram (Reels)\n\n${p.instagram}\n\n## YouTube Shorts\n\n${p.shorts}\n\n## LinkedIn\n\n${p.linkedin}\n` +
    (aiVar ? `\n---\n⚠️ Videoda gerçek sanılabilecek yapay zekâ görüntüsü var: paylaşırken platformun "AI ile oluşturuldu / değiştirilmiş içerik" seçeneğini işaretle.\n` : "")
);

// 4) Yayın dosyası: moov başta (Instagram şartı); sınırı aşarsa bit hızını düşür.
const yayinDosyasi = join(klasor, "yayin.mp4");
const ff = (...a) => execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", join(klasor, "video.mp4"), ...a, yayinDosyasi]);
ff("-c", "copy", "-movflags", "+faststart");
if (statSync(yayinDosyasi).size > DOSYA_SINIRI) {
  const sure = parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", yayinDosyasi]).toString());
  const kbps = Math.floor(((DOSYA_SINIRI * 8) / 1000 / sure) * 0.92) - 128;
  ff("-c:v", "libx264", "-preset", "medium", "-b:v", `${kbps}k`, "-maxrate", `${kbps}k`, "-bufsize", `${kbps * 2}k`, "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-ar", "48000", "-movflags", "+faststart");
}
const mb = statSync(yayinDosyasi).size / 1024 / 1024;
if (mb > 50) throw new Error(`Yayın dosyası ${mb.toFixed(1)} MB, 50 MB sınırını aşıyor.`);
console.log(`yayın dosyası ${mb.toFixed(1)} MB`);

// 4b) Hikâye sürümü (Reels'ten 48 saat sonra Instagram hikâyesi olur): üstte videonun en vurucu cümlesi.
//     Projede "hikaye_sozu" yoksa hikâyeye videonun kendisi gider. Instagram hikâyesi en fazla 60 sn.
const hikayeDosyasi = join(klasor, "hikaye.mp4");
if (proje.hikaye_sozu) {
  const sharp = createRequire(join(KOK, "../../package.json"))("sharp");
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const satirlar = [];
  for (const k of proje.hikaye_sozu.split(/\s+/)) {
    const son = satirlar.at(-1);
    if (son && (son + " " + k).length <= 24) satirlar[satirlar.length - 1] = son + " " + k;
    else satirlar.push(k);
  }
  const F = 64, SATIR = 80, Y0 = 290, kutuY = 230, kutuH = satirlar.length * SATIR + 100;
  const maskot = await sharp(join(KOK, "../../public/brand/kapsul-ikon.svg"), { density: 300 }).resize({ height: 120 }).png().toBuffer();
  const katman = await sharp(Buffer.from(`<svg width="1080" height="1920" xmlns="http://www.w3.org/2000/svg">
<rect x="60" y="${kutuY}" width="960" height="${kutuH}" rx="36" fill="#F5EFDA" opacity=".96"/>
${satirlar.map((s, i) => `<text x="540" y="${Y0 + 20 + i * SATIR + F * 0.35}" text-anchor="middle" font-family="Avenir Next" font-weight="700" font-size="${F}" fill="#26304A">${esc(s)}</text>`).join("")}
</svg>`))
    .composite([{ input: maskot, left: 950, top: kutuY + kutuH - 80 }])
    .png()
    .toBuffer();
  const katmanDosyasi = join(klasor, "hikaye-katman.png");
  writeFileSync(katmanDosyasi, katman);
  execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", yayinDosyasi, "-i", katmanDosyasi, "-filter_complex", "[0:v][1:v]overlay=0:0", "-t", "59.5",
    "-c:v", "libx264", "-crf", "23", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", hikayeDosyasi]);
  console.log(`hikâye sürümü: ${(statSync(hikayeDosyasi).size / 1024 / 1024).toFixed(1)} MB`);
} else {
  console.warn('⚠️ Projede "hikaye_sozu" yok: 48 saat sonraki hikâyeye videonun kendisi gider.');
}

if (kuru) {
  console.log(`✓ ${klasor}\n(dry-run: veritabanı ve Storage atlandı)`);
  process.exit(0);
}

// 5) Paylaşım sekmesine işle (aynı başlık varsa güncelle; paylaşım işaretlerine/linklere dokunma)
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
  ai_icerik: aiVar,
  ig_deneme: !!proje.ig_deneme, // Deneme Reels (migration 0058)
  updated_at: new Date().toISOString(),
};
const { data: satir, error } = var_
  ? await db.from("ds_paylasim").update(kayit).eq("id", var_.id).select().single()
  : await db.from("ds_paylasim").insert(kayit).select().single();
if (error) throw error;
console.log(`✓ ${klasor}\n✓ Paylaşım sekmesi: "${p.baslik}" ${var_ ? "güncellendi" : "eklendi"} (Hazır)`);

// 6) Kuyruk: yayını başlamış videonun dosyasına dokunma; iptal edilen kendiliğinden geri girmez.
if (satir.durum === "paylasildi" || (satir.yayin_at && new Date(satir.yayin_at) <= new Date())) {
  console.log("Kuyruk atlandı: yayını başlamış veya paylaşılmış.");
} else {
  const yol = `${satir.id}/video.mp4`;
  const yukle = async (ad, dosya, contentType) => {
    const r = await db.storage.from("paylasim-video").upload(`${satir.id}/${ad}`, readFileSync(dosya), { contentType, upsert: true });
    if (r.error) throw r.error;
  };
  await yukle("video.mp4", yayinDosyasi, "video/mp4");
  await yukle("kapak.jpg", join(klasor, "kapak.jpg"), "image/jpeg");
  if (proje.hikaye_sozu) await yukle("hikaye.mp4", hikayeDosyasi, "video/mp4");
  const { error: e2 } = await db.from("ds_paylasim").update({ video_yol: yol }).eq("id", satir.id);
  if (e2) throw e2;
  if (satir.iptal_at) {
    console.log("Video yüklendi. Daha önce iptal edilmiş: kuyruğa Paylaşım sekmesinden al.");
  } else {
    const { data: an, error: e3 } = await db.rpc("paylasim_kuyruga_al", { p_id: satir.id });
    if (e3) throw e3;
    console.log(`✓ Kuyruk: ${new Date(an).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}`);
  }
}
