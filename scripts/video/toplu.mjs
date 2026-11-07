// Toplu üretim: gelen kutusundaki her ham video için proje açar, kes.mjs ile metne çevirip keser,
// kurgu (Claude, oturumda) biten videoyu kontrol edip teslim.mjs ile kuyruğa sokar.
// Kurguda Claude "kurgu_tamam"dan önce "ai_beyan": true|false yazar (kural: README "AI beyanı").
// İlerleme gelen kutusundaki .toplu-durum.json'da: tekrar çalıştırmak güvenlidir, kaldığı yerden sürer.
//
// Kullanım: node toplu.mjs [--gelen <klasör>] [--durum] [--dry-run] [--zorla]
//   --durum   hiçbir şey işlemeden tabloyu gösterir
//   --dry-run teslim.mjs'i --dry-run ile çağırır (veritabanı + Storage yok), kuyruğa giriş işaretlenmez
//   --zorla   açılış kontrolü uyarısına rağmen teslim eder
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, readSync, readdirSync, renameSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { acilisKontrol } from "./kontrol.mjs";

const KOK = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const secenek = (ad) => (argv.includes(ad) ? argv[argv.indexOf(ad) + 1] : undefined);
const GELEN = secenek("--gelen") || process.env.VIDEO_GELEN || join(homedir(), "Desktop", "Startup Doktoru Videolar", "_gelen");
const kuru = argv.includes("--dry-run");
const zorla = argv.includes("--zorla");
const DURUM = join(GELEN, ".toplu-durum.json");
const UZANTI = new Set([".mov", ".mp4", ".m4v"]);
const SAKIN_SN = 60; // Drive hâlâ yazıyor olabilir: bu kadar süredir değişmeyen dosya işlenir

mkdirSync(GELEN, { recursive: true });
const durum = existsSync(DURUM) ? JSON.parse(readFileSync(DURUM, "utf8")) : {};
const kaydet = () => {
  writeFileSync(`${DURUM}.tmp`, JSON.stringify(durum, null, 1));
  renameSync(`${DURUM}.tmp`, DURUM);
};

// Dosya adı değişse de aynı video tanınsın: boyut + ilk 1 MB.
const kimlik = (f) => {
  const b = Buffer.alloc(1024 * 1024);
  const fd = openSync(f, "r");
  const n = readSync(fd, b, 0, b.length, 0);
  closeSync(fd);
  return createHash("sha1").update(String(statSync(f).size)).update(b.subarray(0, n)).digest("hex").slice(0, 12);
};

const sadelestir = (s) =>
  s
    .toLocaleLowerCase("tr")
    .replace(/[çğıöşü]/g, (c) => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" })[c])
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const calistir = (betik, ...a) => execFileSync("node", [betik, ...a], { cwd: KOK, stdio: "inherit" });
const yeniMi = (a, b) => !existsSync(b) || statSync(a).mtimeMs > statSync(b).mtimeMs;

function isle(dosya, k) {
  const projeYolu = join(KOK, "projeler", `${k.ad}.json`);
  const kurguYolu = join(KOK, "public", k.ad, "kurgu.json");

  if (!existsSync(projeYolu)) {
    writeFileSync(projeYolu, JSON.stringify({ ad: k.ad, klipler: [{ dosya, goruntu: true }], duzelt: {}, kuyruk: 1.5, gorsel: [{ ifade: "", tur: "yuz" }] }, null, 2));
  }

  // Proje kurguda değiştiyse (kes, duzelt, gorsel) kes.mjs yeniden çalışır; metin önbellekte kalır.
  if (yeniMi(projeYolu, kurguYolu)) {
    k.asama = "metin";
    kaydet();
    calistir("kes.mjs", projeYolu);
  }

  const kurgu = JSON.parse(readFileSync(kurguYolu, "utf8"));
  k.sure = kurgu.sure;
  k.kontrol = acilisKontrol(kurgu);

  const proje = JSON.parse(readFileSync(projeYolu, "utf8"));
  if (!proje.kurgu_tamam) {
    k.asama = "kurgu_bekliyor";
    k.ozet = kurgu.kelimeler.slice(0, 12).map((w) => w.w).join(" ");
    return;
  }
  if (k.kontrol.length && !zorla) {
    k.asama = "kontrol_uyari";
    return;
  }

  k.asama = "teslim";
  kaydet();
  const video = join(KOK, "out", `${k.ad}.mp4`);
  const yeniden = yeniMi(projeYolu, video) ? ["--yeniden"] : [];
  calistir("teslim.mjs", projeYolu, ...yeniden, ...(kuru ? ["--dry-run"] : []));
  k.asama = kuru ? "dry_run_tamam" : "kuyrukta";
}

if (!argv.includes("--durum")) {
  const dosyalar = readdirSync(GELEN)
    .filter((f) => !f.startsWith(".") && UZANTI.has(extname(f).toLowerCase()))
    .sort();
  for (const ad of dosyalar) {
    const dosya = join(GELEN, ad);
    if (Date.now() - statSync(dosya).mtimeMs < SAKIN_SN * 1000) {
      console.log(`… ${ad}: hâlâ yazılıyor olabilir, sonraki çalıştırmada`);
      continue;
    }
    const id = kimlik(dosya);
    const k = (durum[id] ??= { dosya: ad, ad: `${sadelestir(basename(ad, extname(ad)))}-${id.slice(0, 4)}`, asama: "yeni" });
    if (k.asama === "kuyrukta") continue;
    console.log(`\n▶ ${ad} → ${k.ad}`);
    try {
      delete k.hata;
      isle(dosya, k);
    } catch (e) {
      k.hata = e.message.split("\n")[0];
      console.error(`✗ ${ad}: ${k.hata}`);
    }
    kaydet();
  }
}

console.log(`\nGelen kutusu: ${GELEN}`);
for (const k of Object.values(durum)) {
  console.log(`${k.asama.padEnd(15)} ${k.ad}${k.sure ? ` (${k.sure.toFixed(1)} sn)` : ""}${k.hata ? ` HATA: ${k.hata}` : ""}`);
  for (const u of k.kontrol || []) console.log(`                  ⚠ ${u}`);
  if (k.asama === "kurgu_bekliyor") console.log(`                  "${k.ozet}…" → projeler/${k.ad}.json + public/${k.ad}/kurgu.json`);
}
