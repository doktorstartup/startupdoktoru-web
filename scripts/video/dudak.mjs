// Duyguya göre dudak senkronu: anlatımın bir bölümünü Eser'in KONUŞAN bir çekimiyle senkronlar.
// Sahne örnekleri:
//   { "ifade": "Asıl mesele", "tur": "yuz", "video": "dudak-asil.mp4", "dudak": "oto" }
//   { ..., "dudak": "oto", "dudak_kaynak": ["Sert Konuşma", "Uzun anlatım"] }  → bu çekimler tercih edilir
//   { ..., "dudak": "eser-sert-konusma", "dudak_bas": 0 }                     → elle seçim (eski usul)
//
// Neden "oto"? (E2VC_v2 dersleri, bkz. tasarimciV1.md §5 ve E2VC_v3 notu)
//   Kayma, referans penceresinde Eser SUSARKEN ("tam sizin için" → Gülme 3,4–5,5 sessiz) ya da başı
//   DÖNÜKKEN ("kapıyı çalmadan" → yaw −13°) oluyordu. "oto" analiz/yuz/*.json'dan şu pencereyi seçer:
//   yüz her karede var, önden (|yaw| ort. < 6°, en çok < 12°), gülümsemesiz, kesintisiz konuşma
//   (boşluk ≤ 0,35 sn), ağız gerçekten hareketli. Sahneler aynı pencereyi paylaşmaz.
// Bağlam payı: model çok kısa parçada ("Neden mi?" 0,6 sn) zorlanıyor → ses iki yandan PAY kadar
//   uzatılıp senkronlanır, sonra sahne kadarı kesilir.
// Sakal lekesi: model dudak altındaki kır sakalı beyaz lekeye çeviriyor; yama-olc.py ölçer (rapora yazılır).
//   UYARI: yama-olc kapı olarak KULLANILAMAZ — Eser'in lekesiz bulduğu ilk video da "LEKE" ölçülüyor (2026-11-10);
//   leke gözle (çene yakın planı) değerlendirilir.
//   --sakal: sakal-onar.py çene bölgesini gerçek çekimden geri koyar (Eser'e göre kaymayı artırdı → varsayılan kapalı).
// Kalite kapısı: her çıktı senkron-olc.py (dudak kapanma testi: b/m/p'de dudak kapanmalı) ile ölçülür;
//   geçmezse sıradaki referansla yeniden denenir (en çok --deneme, varsayılan 3), en iyisi tutulur.
//   Rapor: public/<ad>/dudak-rapor.json — geçmeyen sahne için kurguda J-cut / risksiz sahne kullan.
//
// fal.ai Sync lipsync-2 (~$0,05/sn) · --pro ya da projede "dudak_model": "pro" → lipsync-2-pro (~$0,083/sn).
// Dudak senkronlu video = yapay zekâ ile değiştirilmiş görüntü → projede "ai_beyan": true olmalı.
//
// Kullanım: node dudak.mjs projeler/<ad>.json [--yeniden] [--sadece dudak-x.mp4] [--deneme 3] [--pro] [--esik 0.85] [--sakal] [--aday]
//   --aday: üretmeden yalnız seçilecek referansları yazdırır (ücretsiz).
import { readFileSync, existsSync, readdirSync, copyFileSync, writeFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fal } from "@fal-ai/client";
import { kutuphaneyeEkle } from "./dudak-kutuphane.mjs";

const KOK = dirname(fileURLToPath(import.meta.url));
const arg = process.argv;
const secenek = (ad) => (arg.includes(ad) ? arg[arg.indexOf(ad) + 1] : undefined);
const proje = JSON.parse(readFileSync(arg[2], "utf8"));
const yeniden = arg.includes("--yeniden");
const sadece = secenek("--sadece");
const DENEME = Number(secenek("--deneme") ?? 3);
const yalnizAday = arg.includes("--aday");
const PRO = arg.includes("--pro") || proje.dudak_model === "pro";
const MODEL = PRO ? "fal-ai/sync-lipsync/v2/pro" : "fal-ai/sync-lipsync/v2";
const FIYAT = PRO ? 0.083 : 0.05;
const PAY = 0.35;
const SAKAL = arg.includes("--sakal");
const GECER = Number(secenek("--esik") ?? 0.85); // dudak kapanma skoru eşiği (gerçek çekimler 0,89–1,00); --esik 1 = hepsi kapanmalı

const klasor = join(KOK, "public", proje.ad);
const kurgu = JSON.parse(readFileSync(join(klasor, "kurgu.json"), "utf8"));
const kutuphane = JSON.parse(readFileSync(join(KOK, "kutuphane", "index.json"), "utf8"));
fal.config({ credentials: readFileSync(join(KOK, "../../.env.local"), "utf8").match(/^FAL_KEY=(.+)$/m)?.[1].trim() });
if (!proje.ai_beyan) console.warn('⚠ dudak senkronu var ama projede "ai_beyan": true değil');

// Sahne başları Video.tsx ile aynı: ifade sırayla aranır, "an" varsa o kullanılır.
const sade = (x) => x.toLocaleLowerCase("tr").replace(/[^\p{L}\p{N}]/gu, "");
const ifadeAni = (ifade, sonra) => {
  const p = ifade.split(/\s+/).map(sade);
  const w = kurgu.kelimeler;
  const i = w.findIndex((x, i) => x.s >= sonra && p.every((q, j) => w[i + j] && sade(w[i + j].w).startsWith(q)));
  if (i < 0) throw new Error(`İfade bulunamadı: "${ifade}"`);
  return w[i].s;
};
const baslar = [];
proje.gorsel.forEach((g, i) => {
  const onceki = baslar[i - 1] ?? 0;
  baslar.push(i === 0 ? 0 : g.an !== undefined ? Math.max(g.an, onceki) : ifadeAni(g.ifade, onceki));
});

// ---- Referans adayları (analiz/yuz + analiz/metin) ----
const analizler = readdirSync(join(KOK, "analiz", "yuz"))
  .filter((f) => f.endsWith(".json"))
  .map((f) => {
    const ad = f.replace(/\.json$/, "");
    const yuz = JSON.parse(readFileSync(join(KOK, "analiz", "yuz", f), "utf8"));
    const metin = join(KOK, "analiz", "metin", f);
    return { ad, video: yuz.video, kareler: yuz.kareler, kelimeler: existsSync(metin) ? JSON.parse(readFileSync(metin, "utf8")) : [] };
  });
const kullanilan = []; // {video, bas, son}
const ort = (x) => x.reduce((a, b) => a + b, 0) / x.length;
const std = (x) => Math.sqrt(ort(x.map((v) => (v - ort(x)) ** 2)));

function adaylar(L, kaynaklar) {
  const hepsi = [];
  for (const a of analizler) {
    const sure = a.kareler.at(-1).t;
    for (let t = 0; t + L <= sure; t = Math.round((t + 0.1) * 10) / 10) {
      const fr = a.kareler.filter((k) => k.t >= t && k.t < t + L);
      if (!fr.length || fr.some((k) => !k.yuz)) continue;
      const yaw = fr.map((k) => Math.abs(k.yaw));
      if (Math.max(...yaw) > 12 || ort(yaw) > 6) continue;
      const gul = ort(fr.map((k) => k.gulumseme));
      const kas = ort(fr.map((k) => k.kas_kalkik));
      if (gul > 0.25 || kas > 0.45) continue;
      const ws = a.kelimeler.filter((w) => w.e > t && w.s < t + L);
      if (!ws.length || ws.some((w) => /^h+m+/i.test(w.w))) continue; // "Hmmm" = ağız kapalı mırıltı
      // Kesintisiz konuşma: pencere başı/sonu dahil en uzun boşluk ≤ 0,35 sn.
      let bosluk = Math.max(ws[0].s - t, 0), kapsam = 0;
      ws.forEach((w, i) => {
        kapsam += Math.min(w.e, t + L) - Math.max(w.s, t);
        if (i) bosluk = Math.max(bosluk, w.s - ws[i - 1].e);
      });
      bosluk = Math.max(bosluk, t + L - ws.at(-1).e);
      if (bosluk > 0.35 || kapsam / L < 0.75) continue;
      if (std(fr.map((k) => k.agiz_acik)) < 0.012) continue;
      if (kullanilan.some((u) => u.video === a.video && t < u.son && t + L > u.bas)) continue;
      const puan = ort(yaw) + 15 * gul + 4 * kas + (kaynaklar && !kaynaklar.includes(a.ad) ? 3 : 0);
      hepsi.push({ ad: a.ad, video: a.video, bas: t, son: t + L, puan });
    }
  }
  // En iyiden başla; birbirine binen pencereleri ele (her deneme farklı bir an olsun).
  const secilen = [];
  for (const c of hepsi.sort((x, y) => x.puan - y.puan)) {
    if (secilen.some((s) => s.video === c.video && c.bas < s.son + 1 && c.son > s.bas - 1)) continue;
    secilen.push(c);
    if (secilen.length >= DENEME) break;
  }
  return secilen;
}

function olc(dosya, bas, son) {
  try {
    const cikti = execFileSync(join(KOK, ".venv-yuz/bin/python"), [join(KOK, "senkron-olc.py"), dosya, join(klasor, "kurgu.json"), "--bas", `${bas}`, "--son", `${son}`, "--kaydir", `${bas}`], { stdio: ["ignore", "pipe", "ignore"] }).toString();
    const m = cikti.match(/SKOR (\S+)\s+\((\d+)\/(\d+)/);
    const acik = cikti.split("\n").filter((x) => x.includes("AÇIK")).map((x) => x.trim().replace(/\s+/g, " "));
    const toplam = Number(m[3]);
    return { skor: toplam ? Number(m[2]) / toplam : 1, kapanan: Number(m[2]), toplam, acik };
  } catch (e) {
    return { skor: 0, kapanan: 0, toplam: 0, acik: [`ölçülemedi: ${e.message.slice(0, 80)}`] };
  }
}

function yamaOlc(dosya, ref, kaydir) {
  try {
    return execFileSync(join(KOK, ".venv-yuz/bin/python"), [join(KOK, "yama-olc.py"), dosya, ref, "--kaydir", `${kaydir}`], { stdio: ["ignore", "pipe", "ignore"] }).toString().trim().split("\n").at(-1);
  } catch {
    return "YAMA ölçülemedi";
  }
}

const yukle = (f, tur) => fal.storage.upload(new Blob([readFileSync(f)], { type: tur }));
const raporYolu = join(klasor, "dudak-rapor.json");
const rapor = existsSync(raporYolu) ? JSON.parse(readFileSync(raporYolu, "utf8")) : {};
let toplamSn = 0;

for (const [i, g] of proje.gorsel.entries()) {
  if (!g.dudak) continue;
  const hedef = join(klasor, g.video);
  const bas = baslar[i];
  const son = baslar[i + 1] ?? kurgu.sure;
  const sn = son - bas;
  // Ses: bağlam payıyla. Referans: sesten biraz uzun (cut_off sesi kısaltmasın).
  const sb = Math.max(0, bas - PAY), ss = Math.min(kurgu.sure, son + PAY);
  const L = ss - sb + 0.3;

  let refler;
  if (g.dudak === "oto") {
    refler = adaylar(L, g.dudak_kaynak);
    if (!refler.length) throw new Error(`${g.video}: ${L.toFixed(1)} sn'lik uygun referans yok`);
  } else {
    const c = kutuphane.find((x) => x.id === g.dudak && x.tur === "cekim");
    if (!c) throw new Error(`Kütüphanede konuşan çekim yok: ${g.dudak}`);
    const rb = c.aralik[0] + (g.dudak_bas ?? 0);
    refler = [{ ad: g.dudak, video: c.dosya.replace(/^~/, homedir()), bas: rb, son: rb + L, puan: 0 }];
  }
  refler.forEach((r) => kullanilan.push(r));

  const atla = (existsSync(hedef) && !yeniden && !sadece) || (sadece && sadece !== g.video);
  console.log(`\n${atla ? "=" : "→"} ${g.video}: "${g.ifade}…" ${sn.toFixed(2)} sn (${bas.toFixed(2)}–${son.toFixed(2)})`);
  refler.forEach((r, j) => console.log(`   ${j + 1}. ${r.ad} ${r.bas.toFixed(1)}–${r.son.toFixed(1)} sn  puan ${r.puan.toFixed(1)}`));
  if (atla || yalnizAday) continue;

  const ses = join(klasor, `_dudak-ses-${i}.wav`);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", `${sb}`, "-to", `${ss}`, "-i", join(klasor, "ses.wav"), ses]);
  const sesUrl = await yukle(ses, "audio/wav");
  let enIyi = null;
  for (const [j, r] of refler.entries()) {
    const ref = join(klasor, `_dudak-ref-${i}-${j}.mp4`);
    const ham = join(klasor, `_dudak-ham-${i}-${j}.mp4`);
    const aday = join(klasor, `_dudak-aday-${i}-${j}.mp4`);
    // Referans: HAM dikey kesit (renk düzeltmesi yok, ilk e2vc videosundaki gibi), sesi atılır.
    // Not (2026-11-10, E2VC_v4): süzgeci kaldırmak sakal lekesini GİDERMEDİ; leke modelin kendisinden.
    execFileSync("ffmpeg", [
      "-v", "error", "-y", "-ss", `${r.bas}`, "-t", `${L}`, "-i", r.video,
      "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30",
      "-an", "-c:v", "libx264", "-crf", "17", "-pix_fmt", "yuv420p", ref,
    ]);
    const res = await fal.subscribe(MODEL, {
      input: { video_url: await yukle(ref, "video/mp4"), audio_url: sesUrl, sync_mode: "cut_off", ...(PRO ? {} : { model: "lipsync-2" }) },
    });
    if (!res.data.video?.url) throw new Error("Video dönmedi: " + JSON.stringify(res.data).slice(0, 300));
    await writeFile(ham, Buffer.from(await (await fetch(res.data.video.url)).arrayBuffer()));
    toplamSn += ss - sb;
    // Bağlam payını at: yalnız sahne kadarı (kare doğru kesim için yeniden kodlanır).
    execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", `${bas - sb}`, "-t", `${sn}`, "-i", ham, "-an", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", `${aday}.kesik.mp4`]);
    // Sakal onarımı (yalnız --sakal): çene bölgesi gerçek çekimden. Eser'e göre kaymayı ARTIRDI (2026-11-10),
    // karşılaştırma sonucuna kadar varsayılan kapalı. Leke testi her zaman ölçülür ve rapora yazılır.
    if (SAKAL) execFileSync(join(KOK, ".venv-yuz/bin/python"), [join(KOK, "sakal-onar.py"), `${aday}.kesik.mp4`, ref, aday, "--kaydir", `${bas - sb}`], { stdio: ["ignore", "ignore", "ignore"] });
    else copyFileSync(`${aday}.kesik.mp4`, aday);
    const o = olc(aday, bas, son);
    o.yama = yamaOlc(aday, ref, bas - sb);
    console.log(`   deneme ${j + 1} (${r.ad} ${r.bas.toFixed(1)}): skor ${o.skor.toFixed(2)} (${o.kapanan}/${o.toplam}) · ${o.yama}${o.acik.length ? "  ⚠ " + o.acik.join(" | ") : ""}`);
    if (!enIyi || o.skor > enIyi.o.skor) enIyi = { aday, r, o, j };
    if (o.skor >= GECER) break;
  }
  copyFileSync(enIyi.aday, hedef);
  const gecti = enIyi.o.skor >= GECER;
  rapor[g.video] = { ifade: g.ifade, bas, son, ref: `${enIyi.r.ad} ${enIyi.r.bas.toFixed(1)}`, deneme: enIyi.j + 1, model: MODEL, ...enIyi.o, sakal_onar: SAKAL, gecti };
  console.log(gecti ? `   ✓ ${g.video} geçti` : `   ⚠ ${g.video} GEÇMEDİ — açık kalan b/m/p için J-cut / risksiz sahne kullan`);
  writeFileSync(raporYolu, JSON.stringify(rapor, null, 1));
}
if (!yalnizAday) kutuphaneyeEkle(arg[2]); // iki testi geçen cümleler kütüphaneye (tur "dudak")
console.log(toplamSn ? `\nharcama ≈ $${(toplamSn * FIYAT).toFixed(2)} (${toplamSn.toFixed(1)} sn, ${basename(MODEL)})` : "\nyeni dudak senkronu yok");
