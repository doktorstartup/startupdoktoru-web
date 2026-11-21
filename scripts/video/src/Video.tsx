import { AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/SpaceGrotesk";
import { Asama, Baslik, Bayrak, Bitis, Grafik, IsimBandi, Kanca, Pip, Sayi, Sesler, Zaman, Zemin } from "./Studyo";

// Site markası: koyu lacivert zemin, turkuaz vurgu, sarı dönüşüm rengi, Space Grotesk.
const { fontFamily } = loadFont("normal", { weights: ["500", "700"], subsets: ["latin", "latin-ext"] });
export const ZEMIN = "#050B14";
export const TURKUAZ = "#00E5FF";
export const SARI = "#FACC15";
export const FPS = 30;

type Kelime = { w: string; s: number; e: number };
export type Gorsel = {
  ifade: string;
  an?: number; // mutlak başlangıç (sn); verilirse ifade aranmaz (sessiz boşlukta başlayan sahne)
  tur: "yuz" | "ekran" | "liste" | "buyuk" | "kapanis" | "broll" | "baslik" | "sayi" | "asama" | "zaman" | "grafik";
  resim?: string;
  zoom?: string;
  sayac?: { sayi: number; metin: string; ifade?: string; on?: string }[];
  maddeler?: { metin: string; ifade: string }[];
  vurgu?: string[] | string; // buyuk: liste; baslik: tek sarı satır
  metin?: string;
  ust?: string[] | string; // kapanis: satırlar; baslik/sayi: rozet metni
  video?: string; // yuz: hazır yüz videosu (ör. yuz-uret.mjs çıktısı), sahne başından oynar
  senkron?: boolean; // yuz+video: video tüm konuşma boyunca (dudak senkronu), sahnenin kendi saniyesinden oynar
  isik?: boolean; // yuz+video: hafif renk düzeltmesi
  pip?: string; // her sahne: sol üstte tepki balonu (mp4)
  kanca?: string[]; // her sahne: üstte hook başlığı (son satır sarı vurgu), ör. ["Bugün yeni bir", "KURTULUŞ SAVAŞI var"]
  isim?: string[]; // her sahne: sol üstte isim bandı (lower third), ör. ["Eser Memişoğlu", "STARTUP DOKTORU"]
  baslik?: string[] | string; // baslik: satırlar; asama/zaman/grafik: üst başlık
  arka?: string; // baslik: arka plan (mp4/jpg/png), yoksa hareketli zemin
  sayi?: number; // sayi
  on?: string;
  son?: string;
  etiket?: string; // sayi/asama: alt satır
  asamalar?: string[]; // asama
  aktif?: number[];
  adimlar?: { ust: string; metin: string; ifade?: string; vurgu?: boolean }[]; // zaman
  kaynak?: string; // grafik: kaynak satırı
  tik?: boolean; // liste: kırmızı ✕ yerine yeşil ✓
  // broll: id → kütüphane dosyası (<id>.jpg, hareket varsa <id>.mp4); resim/ses dosya adı da verilebilir (eski usul)
  // klip_sesi: videonun kendi sesi (Veo/Flow sesli üretir), 0–1; verilmezse sessiz
  kareler?: { ifade: string; id?: string; resim?: string; hareket?: string; ses?: string; klip_sesi?: number; sayac?: { sayi: number; on?: string } }[];
};
export type KapakAyari = { arka_sn: number; rozet?: string; baslik: string[]; vurgu: string };
export type Kurgu = {
  ad: string;
  kapak?: KapakAyari;
  sure: number;
  kuyruk: number;
  gorsel: Gorsel[];
  kelimeler: Kelime[];
  sahneler: { bas: number; son: number; goruntu: string | null }[];
  muzik?: { dosya: string; ses?: number; kisik?: number }; // müzik yatağı, konuşurken kısılır
  efektler?: { ses: string; ifade?: string; an?: number; kaydir?: number; seviye?: number }[]; // tek seferlik efektler
  studyo?: boolean; // gren + vinyet bitişi
  bayrak?: { ifade?: string; an?: number; genislik?: number; ust?: number }; // alttan yükselen dalgalı Türk bayrağı, sona kadar
};
export type Props = { proje: string; kurgu?: Kurgu; boylar?: Record<string, number> };

const sade = (x: string) => x.toLocaleLowerCase("tr").replace(/[^\p{L}\p{N}]/gu, "");

// Konuşmada bir ifadenin geçtiği an (sn). Sahneler kelimeye bağlı: kesim değişse de senkron kalır.
export const ifadeAni = (kelimeler: Kelime[], ifade: string, sonra = 0) => {
  const parca = ifade.split(/\s+/).map(sade);
  for (let i = 0; i < kelimeler.length; i++) {
    if (kelimeler[i].s < sonra) continue;
    if (parca.every((p, j) => kelimeler[i + j] && sade(kelimeler[i + j].w).startsWith(p))) return kelimeler[i].s;
  }
  throw new Error(`İfade bulunamadı: "${ifade}"`);
};

export const Video = ({ kurgu, boylar = {} }: Props) => {
  if (!kurgu) return null;
  const bitis = kurgu.sure + kurgu.kuyruk;
  // Sıralı arama: her sahne bir öncekinden sonra aranır (tekrarlanan cümlede ikinci geçiş bulunur).
  const baslar: number[] = [];
  kurgu.gorsel.forEach((g, i) => baslar.push(i === 0 ? 0 : g.an !== undefined ? Math.max(g.an, baslar[i - 1]) : ifadeAni(kurgu.kelimeler, g.ifade, baslar[i - 1])));
  const sahneler = kurgu.gorsel.map((g, i) => ({ g, bas: baslar[i], son: baslar[i + 1] ?? bitis }));

  return (
    <AbsoluteFill style={{ backgroundColor: ZEMIN, fontFamily }}>
      {sahneler.map(({ g, bas, son }, i) => (
        // Sonraki sahne bunun üstünde belirsin diye 8 kare uzatılır (kesimde koyu zemine düşmesin);
        // ilk sahne belirmeden, ilk karede tam görünür başlar (1,7 sn hook kuralı).
        <Sequence key={i} from={Math.round(bas * FPS)} durationInFrames={Math.round((son - bas) * FPS) + (i < sahneler.length - 1 ? 8 : 0)}>
          <Giris ilk={i === 0}>
            {g.tur === "yuz" && <Yuz kurgu={kurgu} bas={bas} video={g.video} senkron={g.senkron} isik={g.isik} zoom={g.zoom ? ifadeAni(kurgu.kelimeler, g.zoom, bas) - bas : null} />}
            {g.tur === "ekran" && <Ekran resim={`${kurgu.ad}/${g.resim}`} boy={boylar[g.resim!.replace(".png", "")] ?? 1920} sure={son - bas} />}
            {g.tur === "ekran" && g.sayac && <Sayaclar sayac={g.sayac} kurgu={kurgu} bas={bas} />}
            {g.tur === "liste" && <Liste g={g} kurgu={kurgu} bas={bas} />}
            {g.tur === "buyuk" && <Buyuk kelimeler={kurgu.kelimeler.filter((k) => k.s >= bas && k.s < son)} bas={bas} vurgu={[g.vurgu ?? []].flat()} />}
            {g.tur === "kapanis" && <Kapanis g={g} ad={kurgu.ad} />}
            {g.tur === "broll" && <Broll g={g} kurgu={kurgu} bas={bas} son={son} />}
            {g.tur === "baslik" && <Baslik g={g} ad={kurgu.ad} kare={Math.round((son - bas) * FPS)} />}
            {g.tur === "sayi" && <Sayi g={g} />}
            {g.tur === "asama" && <Asama g={g} />}
            {g.tur === "zaman" && <Zaman g={g} kurgu={kurgu} bas={bas} />}
            {g.tur === "grafik" && <Grafik g={g} ad={kurgu.ad} kare={Math.round((son - bas) * FPS)} />}
          </Giris>
          {g.pip && <Pip dosya={`${kurgu.ad}/${g.pip}`} kare={Math.round((son - bas) * FPS)} />}
          {g.kanca && <Kanca satirlar={g.kanca} kare={Math.round((son - bas) * FPS)} />}
          {g.isim && <IsimBandi satirlar={g.isim} kare={Math.round((son - bas) * FPS)} />}
        </Sequence>
      ))}
      {kurgu.bayrak && (
        <Sequence from={Math.round((kurgu.bayrak.an ?? ifadeAni(kurgu.kelimeler, kurgu.bayrak.ifade!)) * FPS)}>
          <Bayrak genislik={kurgu.bayrak.genislik} ust={kurgu.bayrak.ust} />
        </Sequence>
      )}
      {kurgu.studyo && <Bitis />}
      <Altyazi kelimeler={kurgu.kelimeler} gizli={sahneler.filter((s) => s.g.tur === "buyuk")} zemin={sahneler.filter((s) => s.g.tur === "ekran")} />
      <Audio src={staticFile(`${kurgu.ad}/ses.wav`)} />
      <Sesler kurgu={kurgu} />
    </AbsoluteFill>
  );
};

// Sahne girişi: kısa yakınlaşarak belirme (zoom-through geçiş hissi).
const Giris = ({ children, ilk = false }: { children: React.ReactNode; ilk?: boolean }) => {
  const f = useCurrentFrame();
  const t = ilk ? 1 : interpolate(f, [0, 8], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return <AbsoluteFill style={{ opacity: t, transform: `scale(${1.12 - 0.12 * t})` }}>{children}</AbsoluteFill>;
};

// Yüz çekimi + "digital zoom": belirtilen kelimede ani yakınlaşma.
const Yuz = ({ kurgu, bas, zoom, video, senkron, isik }: { kurgu: Kurgu; bas: number; zoom: number | null; video?: string; senkron?: boolean; isik?: boolean }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sahne = video ? null : kurgu.sahneler.find((s) => s.goruntu && bas >= s.bas - 0.01 && bas < s.son)!;
  const atlama = zoom === null ? 0 : spring({ frame: f - zoom * fps, fps, config: { damping: 14, stiffness: 180 } });
  const olcek = 1 + 0.03 * (f / (fps * 5)) + 0.22 * atlama;
  return (
    <AbsoluteFill style={{ transform: `scale(${olcek})`, transformOrigin: "50% 35%" }}>
      <OffthreadVideo
        src={staticFile(video ? `${kurgu.ad}/${video}` : sahne!.goruntu!)}
        startFrom={sahne ? Math.round((bas - sahne.bas) * fps) : senkron ? Math.round(bas * fps) : 0}
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover", filter: isik && video ? "contrast(1.06) saturate(1.08) brightness(1.02)" : undefined }}
      />
    </AbsoluteFill>
  );
};

// Platform ekranı: tam sayfa görüntü yavaşça aşağı kayar; üst/alt karartma altyazıyı okunur kılar.
const Ekran = ({ resim, boy, sure, bulanik = false }: { resim: string; boy: number; sure: number; bulanik?: boolean }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mesafe = Math.max(0, Math.min(boy - 1920, sure * 160));
  const y = interpolate(f, [fps * 0.6, sure * fps], [0, -mesafe], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img src={staticFile(resim)} style={{ width: 1080, transform: `translateY(${y}px)`, filter: bulanik ? "blur(18px) brightness(0.45)" : undefined }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(5,11,20,0) 55%, rgba(5,11,20,0.85) 100%)" }} />
    </AbsoluteFill>
  );
};

// B-roll: üretilmiş görseller sözle eşzamanlı değişir, yavaşça yaklaşır/kayar (Ken Burns); ses efekti o anda çalar.
const Broll = ({ g, kurgu, bas, son }: { g: Gorsel; kurgu: Kurgu; bas: number; son: number }) => {
  const kareler = g.kareler!.map((k, i) => ({ k, kb: i === 0 ? bas : ifadeAni(kurgu.kelimeler, k.ifade, bas) }));
  return (
    <AbsoluteFill>
      {kareler.map(({ k, kb }, i) => {
        const ks = kareler[i + 1]?.kb ?? son;
        return (
          // Sonraki kare (ya da sonraki sahne) bunun üstünde belirsin diye 8 kare uzatılır (siyaha düşmeden geçiş).
          <Sequence key={i} from={Math.round((kb - bas) * FPS)} durationInFrames={Math.round((ks - kb) * FPS) + 8}>
            <Giris>
              {k.hareket ? (
                <AbsoluteFill>
                  <OffthreadVideo src={staticFile(`${kurgu.ad}/${k.id}.mp4`)} muted={!k.klip_sesi} volume={k.klip_sesi ?? 0} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(5,11,20,0) 55%, rgba(5,11,20,0.8) 100%)" }} />
                </AbsoluteFill>
              ) : (
                <KenBurns resim={`${kurgu.ad}/${k.resim ?? `${k.id}.jpg`}`} sure={ks - kb} yon={i % 2 ? -1 : 1} />
              )}
              {k.sayac && <Sayaclar sayac={[{ sayi: k.sayac.sayi, on: k.sayac.on, metin: "" }]} kurgu={kurgu} bas={kb} />}
            </Giris>
            {k.ses && <Audio src={staticFile(`${kurgu.ad}/${k.ses.endsWith(".mp3") ? k.ses : `${k.ses}.mp3`}`)} volume={0.55} />}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const KenBurns = ({ resim, sure, yon }: { resim: string; sure: number; yon: number }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = interpolate(f, [0, sure * fps], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img src={staticFile(resim)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.06 + 0.12 * t}) translateX(${yon * (t - 0.5) * 30}px)` }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(5,11,20,0) 55%, rgba(5,11,20,0.8) 100%)" }} />
    </AbsoluteFill>
  );
};

// "Chart grow": rakam sıfırdan sayarak gelir.
const Sayaclar = ({ sayac, kurgu, bas }: { sayac: NonNullable<Gorsel["sayac"]>; kurgu: Kurgu; bas: number }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ position: "absolute", top: 230, left: 60, right: 60, display: "flex", flexDirection: "column", gap: 28 }}>
      {sayac.map((s, i) => {
        const an = (s.ifade ? ifadeAni(kurgu.kelimeler, s.ifade, bas) - bas : 0.3) * fps;
        const giris = spring({ frame: f - an, fps, config: { damping: 15 } });
        const deger = Math.round(s.sayi * interpolate(f - an, [0, fps * 1.1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }));
        return (
          <div key={i} style={{ opacity: giris, transform: `translateY(${(1 - giris) * 40}px)`, background: "rgba(5,11,20,0.88)", border: `3px solid ${TURKUAZ}`, borderRadius: 36, padding: "28px 44px", display: "flex", alignItems: "baseline", gap: 24, boxShadow: `0 0 60px ${TURKUAZ}44` }}>
            <span style={{ color: i === 0 ? TURKUAZ : SARI, fontSize: 132, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{s.on}{deger.toLocaleString("tr-TR")}</span>
            <span style={{ color: "white", fontSize: 50, fontWeight: 500 }}>{s.metin}</span>
          </div>
        );
      })}
    </div>
  );
};

// "Checklist": eksikler söylendikçe tek tek düşer.
const Liste = ({ g, kurgu, bas }: { g: Gorsel; kurgu: Kurgu; bas: number }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      {g.resim ? <Ekran resim={`${kurgu.ad}/${g.resim}`} boy={1920} sure={1} bulanik /> : <Zemin />}
      {g.baslik && <div style={{ position: "absolute", top: 220, left: 60, right: 60, textAlign: "center", fontSize: 72, fontWeight: 700, color: "white", opacity: spring({ frame: f, fps, config: { damping: 15 } }) }}>{[g.baslik].flat().join(" ")}</div>}
      <div style={{ position: "absolute", top: g.baslik ? 400 : 380, left: 90, right: 90, display: "flex", flexDirection: "column", gap: 40 }}>
        {g.maddeler!.map((m, i) => {
          const an = (ifadeAni(kurgu.kelimeler, m.ifade, bas) - bas) * fps;
          const t = spring({ frame: f - an, fps, config: { damping: 13, stiffness: 160 } });
          return (
            <div key={i} style={{ opacity: t, transform: `translateX(${(1 - t) * -120}px)`, display: "flex", alignItems: "center", gap: 36, background: "rgba(14,23,38,0.92)", borderRadius: 32, padding: "34px 40px", border: "2px solid rgba(255,255,255,0.08)" }}>
              <span style={{ width: 92, height: 92, borderRadius: 46, background: g.tik ? "#22C55E" : "#EF4444", color: "white", fontSize: 60, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${t})` }}>{g.tik ? "✓" : "✕"}</span>
              <span style={{ color: "white", fontSize: 64, fontWeight: 700 }}>{m.metin}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Görüntüsüz, sözün kendisinin ekranı kapladığı sahne (büyük kinetik yazı).
const Buyuk = ({ kelimeler, bas, vurgu }: { kelimeler: Kelime[]; bas: number; vurgu: string[] }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = bas + f / fps;
  const cumleler = gruplara(kelimeler, 6);
  const aktif = cumleler.filter((c) => c[0].s <= t + 0.05).pop() ?? cumleler[0];
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, #0E2A3A 0%, ${ZEMIN} 70%)`, alignItems: "center", justifyContent: "center", padding: 80 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px 26px", textAlign: "center" }}>
        {aktif.map((k, i) => {
          const p = spring({ frame: f - (k.s - bas) * fps, fps, config: { damping: 12, stiffness: 200 } });
          const v = vurgu.some((x) => sade(k.w).startsWith(sade(x)));
          return (
            <span key={i} style={{ fontSize: (v ? 150 : 118) * Math.min(1, 11 / k.w.length), fontWeight: 700, lineHeight: 1.1, color: v ? SARI : "white", opacity: p, transform: `translateY(${(1 - p) * 50}px) scale(${0.7 + 0.3 * p})`, display: "inline-block" }}>
              {k.w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Kapanis = ({ g, ad }: { g: Gorsel; ad: string }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = spring({ frame: f - 4, fps, config: { damping: 14 } });
  const nabiz = 1 + 0.035 * Math.sin((f / fps) * Math.PI * 2.2);
  return (
    <AbsoluteFill>
      <Ekran resim={`${ad}/${g.resim ?? "anasayfa.png"}`} boy={1920} sure={1} bulanik />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 56, paddingBottom: 260 }}>
        {g.ust && (
          <div style={{ textAlign: "center", opacity: t, transform: `translateY(${(1 - t) * 30}px)`, marginBottom: 24 }}>
            {[g.ust].flat().map((satir, i, ust) => (
              <div key={i} style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.2, color: i === ust.length - 1 ? SARI : "white" }}>{satir}</div>
            ))}
          </div>
        )}
        <div style={{ fontSize: 112, fontWeight: 700, color: "white", opacity: t, transform: `scale(${0.8 + 0.2 * t})` }}>
          Startup<span style={{ color: TURKUAZ }}>Doktoru</span>
        </div>
        <div style={{ fontSize: 60, fontWeight: 700, color: ZEMIN, background: SARI, padding: "30px 60px", borderRadius: 999, opacity: t, transform: `scale(${nabiz * (0.8 + 0.2 * t)})`, boxShadow: `0 0 80px ${SARI}66` }}>
          {g.metin}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Kelime grupları: en fazla n kelime, noktalama ya da uzun duraklamada yeni grup.
const gruplara = (kelimeler: Kelime[], n: number) => {
  const gruplar: Kelime[][] = [];
  let g: Kelime[] = [];
  kelimeler.forEach((k, i) => {
    g.push(k);
    const sonraki = kelimeler[i + 1];
    if (g.length >= n || /[.,?!]$/.test(k.w) || !sonraki || sonraki.s - k.e > 0.4) {
      gruplar.push(g);
      g = [];
    }
  });
  return gruplar;
};

// "Kinetic captions": söylenen kelime turkuaz yanar, grup yaylanarak gelir.
// zemin: site ekranı gibi yazılı arka planda altyazı koyu yarı saydam plaka üstünde (yazılar üst üste binmesin).
const Altyazi = ({ kelimeler, gizli, zemin }: { kelimeler: Kelime[]; gizli: { bas: number; son: number }[]; zemin: { bas: number; son: number }[] }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  if (gizli.some((s) => t >= s.bas && t < s.son)) return null;
  const gruplar = gruplara(kelimeler, 3);
  const gi = gruplar.findIndex((g, i) => t >= g[0].s - 0.05 && t < (gruplar[i + 1]?.[0].s ?? g[g.length - 1].e + 0.6));
  if (gi < 0) return null;
  const g = gruplar[gi];
  const p = spring({ frame: f - (g[0].s - 0.05) * fps, fps, config: { damping: 14, stiffness: 220 } });
  const plaka = zemin.some((s) => t >= s.bas && t < s.son)
    ? { background: "rgba(5,11,20,0.94)", backdropFilter: "blur(16px)", borderRadius: 36, padding: "26px 40px", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }
    : {};
  return (
    <div style={{ position: "absolute", top: 1230, left: 60, right: 60, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 34px", transform: `scale(${0.85 + 0.15 * p})`, ...plaka }}>
      {g.map((k, i) => {
        const aktif = t >= k.s - 0.03 && t < (g[i + 1]?.s ?? k.e + 0.6);
        return (
          <span key={i} style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.15, color: aktif ? TURKUAZ : "white", transform: `scale(${aktif ? 1.04 : 1})`, display: "inline-block", WebkitTextStroke: "10px rgba(0,0,0,0.85)", paintOrder: "stroke fill", textShadow: "0 6px 24px rgba(0,0,0,0.6)" }}>
            {k.w}
          </span>
        );
      })}
    </div>
  );
};
