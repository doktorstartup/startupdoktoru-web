// Temiz dudak senkronu cümlelerini kütüphaneye ekler (cümle cümle birleştirme için yeniden kullanım).
// Dudak kapanma testini (senkron-olc.py) geçenler girer. Sakal lekesi (yama-olc.py) etiketlenir:
// "temiz" ya da "sakal-lekesi". Eser'in onayı varsa (rapor "onay") "onayli" etiketi eklenir.
// Kayıt: kutuphane/<id>.mp4 = dudak videosu + o cümlenin sesi (ses.wav'dan, kurgudaki temizlenmiş hâli).
//   tur "dudak" · metin · kelimeler (klibe göre sn) · duygu · ref (hangi çekimin hangi saniyesi) · testler.
// dudak.mjs her çalışmanın sonunda bunu çağırır; elle: node dudak-kutuphane.mjs projeler/<ad>.json
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const KOK = dirname(fileURLToPath(import.meta.url));

export function kutuphaneyeEkle(projeDosya) {
  const proje = JSON.parse(readFileSync(projeDosya, "utf8"));
  const klasor = join(KOK, "public", proje.ad);
  const raporYolu = join(klasor, "dudak-rapor.json");
  if (!existsSync(raporYolu)) return 0;
  const rapor = JSON.parse(readFileSync(raporYolu, "utf8"));
  const kurgu = JSON.parse(readFileSync(join(klasor, "kurgu.json"), "utf8"));
  const indexYolu = join(KOK, "kutuphane", "index.json");
  const kutuphane = JSON.parse(readFileSync(indexYolu, "utf8"));
  let eklenen = 0;

  for (const [video, r] of Object.entries(rapor)) {
    const temiz = r.gecti; // senkron geçti
    const lekesiz = String(r.yama ?? "").includes("TEMİZ");
    const id = `dudak-${proje.ad.toLowerCase()}-${video.replace(/^dudak-|\.mp4$/g, "")}`;
    const eski = kutuphane.findIndex((x) => x.id === id);
    if (!temiz) {
      if (eski >= 0) kutuphane.splice(eski, 1); // artık temiz değilse kütüphanede durmasın
      continue;
    }
    const kaynak = join(klasor, video);
    if (!existsSync(kaynak)) continue;
    const sn = r.son - r.bas;
    const dosya = `${id}.mp4`;
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", kaynak, "-ss", `${r.bas}`, "-t", `${sn}`, "-i", join(klasor, "ses.wav"),
      "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", join(KOK, "kutuphane", dosya)]);
    const kelimeler = kurgu.kelimeler.filter((w) => w.s >= r.bas - 0.01 && w.s < r.son - 0.02).map((w) => ({ w: w.w, s: +(w.s - r.bas).toFixed(2), e: +(Math.min(w.e, r.son) - r.bas).toFixed(2) }));
    const refId = r.ref.split(" ").slice(0, -1).join(" ");
    const cekim = kutuphane.find((x) => x.tur === "cekim" && x.dosya.includes(refId));
    const kayit = {
      id,
      tur: "dudak",
      dosya,
      metin: kelimeler.map((w) => w.w).join(" "),
      kelimeler,
      sure: +sn.toFixed(2),
      duygu: cekim?.duygu ?? null,
      ref: r.ref,
      model: r.model,
      testler: { dudak: `${r.kapanan}/${r.toplam}`, yama: r.yama, sakal_onar: !!r.sakal_onar },
      onay: r.onay ?? null,
      ai: true,
      proje: proje.ad,
      etiket: ["dudak-senkron", lekesiz ? "temiz" : "sakal-lekesi", ...(r.onay ? ["onayli"] : []), "eser", "konuşuyor", ...(cekim?.duygu ? [cekim.duygu] : []), proje.ad.toLowerCase()],
      kaynak: "fal-ai/sync-lipsync",
      maliyet: +(sn * (String(r.model).includes("pro") ? 0.083 : 0.05)).toFixed(3),
      tarih: new Date().toISOString().slice(0, 10),
    };
    if (eski >= 0) kutuphane[eski] = kayit;
    else kutuphane.push(kayit);
    eklenen++;
    console.log(`✓ kütüphane: ${id} — "${kayit.metin}"`);
  }
  writeFileSync(indexYolu, JSON.stringify(kutuphane, null, 1));
  return eklenen;
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  const n = kutuphaneyeEkle(process.argv[2]);
  console.log(`${n} dudak cümlesi kütüphanede`);
}
