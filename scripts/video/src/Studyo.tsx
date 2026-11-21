import { AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { FPS, SARI, TURKUAZ, ZEMIN, ifadeAni, type Gorsel, type Kurgu } from "./Video";

// Tek metin ya da satır listesi gelebilir (ust/vurgu/baslik eski tiplerle alan paylaşıyor).
const tek = (x?: string | string[]) => (Array.isArray(x) ? x.join(" ") : x);
const liste = (x?: string | string[]) => (x === undefined ? [] : Array.isArray(x) ? x : [x]);

// Hareketli zemin: koyu radyal degrade + yavaş kayan turkuaz ızgara.
export const Zemin = () => {
  const f = useCurrentFrame();
  const kay = (f * 0.6) % 120;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 40%, #0E2A3A 0%, ${ZEMIN} 72%)` }}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${TURKUAZ}14 2px, transparent 2px), linear-gradient(90deg, ${TURKUAZ}14 2px, transparent 2px)`,
          backgroundSize: "120px 120px",
          backgroundPosition: `0 ${kay}px`,
          maskImage: "radial-gradient(circle at 50% 45%, black 20%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(circle at 50% 45%, black 20%, transparent 75%)",
        }}
      />
    </AbsoluteFill>
  );
};

const Rozet = ({ metin, t }: { metin: string; t: number }) => (
  <div style={{ alignSelf: "center", fontSize: 40, fontWeight: 700, color: ZEMIN, background: TURKUAZ, padding: "14px 34px", borderRadius: 999, letterSpacing: 2, opacity: t, transform: `translateY(${(1 - t) * 20}px)`, boxShadow: `0 0 40px ${TURKUAZ}66` }}>
    {metin}
  </div>
);

// Başlık kartı: satırlar sırayla "çarparak" iner, kamera yavaşça yaklaşır.
export const Baslik = ({ g, ad, kare }: { g: Gorsel; ad: string; kare: number }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const kamera = interpolate(f, [0, kare], [1, 1.04], { extrapolateRight: "clamp" });
  const satirlar = liste(g.baslik);
  const vurgu = tek(g.vurgu);
  const ust = tek(g.ust);
  const carp = (i: number) => spring({ frame: f - 4 - i * 6, fps, config: { damping: 13, stiffness: 170 } });
  const arkaStil = { width: "100%", height: "100%", objectFit: "cover" as const, filter: "brightness(0.35) blur(6px)", transform: "scale(1.05)" };
  return (
    <AbsoluteFill>
      {g.arka ? (
        g.arka.endsWith(".mp4") ? <OffthreadVideo src={staticFile(`${ad}/${g.arka}`)} muted style={arkaStil} /> : <Img src={staticFile(`${ad}/${g.arka}`)} style={arkaStil} />
      ) : (
        <Zemin />
      )}
      <AbsoluteFill style={{ transform: `scale(${kamera})`, alignItems: "center", justifyContent: "center", top: 160, height: 990, paddingLeft: 60, paddingRight: 60 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, textAlign: "center" }}>
          {ust && <Rozet metin={ust} t={spring({ frame: f, fps, config: { damping: 15 } })} />}
          {satirlar.map((s, i) => {
            const p = carp(i);
            return (
              <div key={i} style={{ fontSize: 110, fontWeight: 700, lineHeight: 1.08, color: "white", opacity: Math.min(1, p), transform: `scale(${1.35 - 0.35 * p})`, textShadow: "0 8px 40px rgba(0,0,0,0.6)" }}>
                {s}
              </div>
            );
          })}
          {vurgu && (() => {
            const p = carp(satirlar.length);
            return (
              <div style={{ fontSize: 170, fontWeight: 700, lineHeight: 1.05, color: SARI, opacity: Math.min(1, p), transform: `scale(${1.35 - 0.35 * p})`, textShadow: `0 0 60px ${SARI}55` }}>{vurgu}</div>
            );
          })()}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Büyük sayaç: 0'dan sayar, bitişte küçük bir "darbe".
export const Sayi = ({ g }: { g: Gorsel }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bas = fps * 0.2;
  const bitis = bas + fps * 1.2;
  const deger = Math.round((g.sayi ?? 0) * interpolate(f, [bas, bitis], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }));
  const son = `${g.on ?? ""}${(g.sayi ?? 0).toLocaleString("tr-TR")}${g.son ?? ""}`;
  const boyut = Math.min(200, 960 / (son.length * 0.62));
  const darbe = f < bitis ? 1 : 1.08 - 0.08 * spring({ frame: f - bitis, fps, config: { damping: 12, stiffness: 200 } });
  const giris = spring({ frame: f, fps, config: { damping: 15 } });
  const ust = tek(g.ust);
  return (
    <AbsoluteFill>
      <Zemin />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", top: 160, height: 990, gap: 30 }}>
        {ust && <Rozet metin={ust} t={giris} />}
        <div style={{ fontSize: boyut, fontWeight: 700, lineHeight: 1, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums", opacity: giris, transform: `scale(${darbe})`, textShadow: `0 0 70px ${SARI}44` }}>
          <span style={{ color: TURKUAZ }}>{g.on}</span>
          <span style={{ color: SARI }}>{deger.toLocaleString("tr-TR")}</span>
          <span style={{ color: TURKUAZ }}>{g.son}</span>
        </div>
        {g.etiket && <div style={{ fontSize: 60, fontWeight: 700, color: "white", textAlign: "center", padding: "0 80px", opacity: giris }}>{g.etiket}</div>}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Yatırım aşamaları: alt alta hapcıklar, aktif olanlar sırayla turkuaz yanar.
export const Asama = ({ g }: { g: Gorsel }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const giris = spring({ frame: f, fps, config: { damping: 15 } });
  const baslik = tek(g.baslik);
  return (
    <AbsoluteFill>
      <Zemin />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", top: 160, height: 990, gap: 22 }}>
        {baslik && <div style={{ fontSize: 72, fontWeight: 700, color: "white", textAlign: "center", padding: "0 60px", marginBottom: 20, opacity: giris }}>{baslik}</div>}
        {(g.asamalar ?? []).map((a, i) => {
          const sira = (g.aktif ?? []).indexOf(i);
          const yan = sira < 0 ? 0 : spring({ frame: f - fps * (0.5 + 0.35 * sira), fps, config: { damping: 14, stiffness: 180 } });
          const el = spring({ frame: f - i * 3, fps, config: { damping: 15 } });
          return (
            <div
              key={i}
              style={{
                width: 860, height: 116, borderRadius: 58, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 60, fontWeight: 700,
                color: yan > 0.5 ? ZEMIN : "rgba(255,255,255,0.45)",
                background: yan > 0.01 ? `rgba(0,229,255,${Math.min(1, yan)})` : "rgba(255,255,255,0.07)",
                border: `3px solid ${yan > 0.01 ? TURKUAZ : "rgba(255,255,255,0.12)"}`,
                boxShadow: `0 0 ${60 * Math.min(1, yan)}px ${TURKUAZ}88`,
                opacity: el, transform: `translateX(${(1 - el) * -80}px) scale(${1 + 0.04 * Math.max(0, Math.min(1, yan))})`,
              }}
            >
              {a}
            </div>
          );
        })}
        {g.etiket && <div style={{ fontSize: 46, fontWeight: 700, color: SARI, textAlign: "center", padding: "0 60px", marginTop: 16, opacity: giris }}>{g.etiket}</div>}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Zaman çizelgesi: adımlar söylendikçe belirir, çizgi bir sonraki noktaya uzar (ölçümsüz: her blok kendi alt parçasını çizer).
export const Zaman = ({ g, kurgu, bas }: { g: Gorsel; kurgu: Kurgu; bas: number }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const adimlar = g.adimlar ?? [];
  const baslik = tek(g.baslik);
  const anlar = adimlar.map((a, i) => (a.ifade ? ifadeAni(kurgu.kelimeler, a.ifade, bas) - bas : 0.3 + 0.5 * i) * fps);
  const ARA = 56; // bloklar arası boşluk
  const NOKTA = 24; // nokta merkezi = ust satırının ortası
  return (
    <AbsoluteFill>
      <Zemin />
      {baslik && <div style={{ position: "absolute", top: 230, left: 60, right: 60, textAlign: "center", fontSize: 72, fontWeight: 700, color: "white", opacity: spring({ frame: f, fps, config: { damping: 15 } }) }}>{baslik}</div>}
      <div style={{ position: "absolute", top: baslik ? 360 : 240, left: 110, right: 60, display: "flex", flexDirection: "column", gap: ARA }}>
        {adimlar.map((a, i) => {
          const p = spring({ frame: f - anlar[i], fps, config: { damping: 13, stiffness: 170 } });
          const uza = i < adimlar.length - 1 ? interpolate(f, [anlar[i + 1] - 9, anlar[i + 1]], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
          return (
            <div key={i} style={{ position: "relative", display: "flex", gap: 36, opacity: Math.min(1, p), transform: `translateX(${(1 - p) * 60}px)` }}>
              {uza > 0 && <div style={{ position: "absolute", left: 14, top: NOKTA, width: 6, height: `calc(100% + ${ARA}px)`, background: TURKUAZ, borderRadius: 3, boxShadow: `0 0 20px ${TURKUAZ}88`, transform: `scaleY(${uza})`, transformOrigin: "top" }} />}
              <div style={{ position: "relative", width: 34, height: 34, marginTop: NOKTA - 17, flexShrink: 0, borderRadius: 17, background: a.vurgu ? SARI : TURKUAZ, boxShadow: `0 0 30px ${a.vurgu ? SARI : TURKUAZ}`, transform: `scale(${p})` }} />
              <div style={{ display: "flex", flexDirection: "column", maxWidth: 800 }}>
                <span style={{ fontSize: 38, lineHeight: "48px", fontWeight: 700, color: TURKUAZ, letterSpacing: 2 }}>{a.ust}</span>
                <span style={{ fontSize: a.vurgu ? 96 : 54, fontWeight: 700, color: a.vurgu ? SARI : "white", lineHeight: 1.15 }}>{a.metin}</span>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Grafik/görsel kartı: yuvarlak köşeli kart içinde yavaş Ken Burns.
export const Grafik = ({ g, ad, kare }: { g: Gorsel; ad: string; kare: number }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const giris = spring({ frame: f, fps, config: { damping: 15 } });
  const kb = interpolate(f, [0, kare], [1, 1.06], { extrapolateRight: "clamp" });
  const baslik = tek(g.baslik);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, #0B1B2B 0%, ${ZEMIN} 70%)` }}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", top: 160, height: 990, gap: 36 }}>
        {baslik && <div style={{ fontSize: 64, fontWeight: 700, color: "white", textAlign: "center", padding: "0 60px", opacity: giris }}>{baslik}</div>}
        <div style={{ borderRadius: 36, overflow: "hidden", border: "2px solid rgba(255,255,255,0.04)", boxShadow: "0 30px 80px rgba(0,0,0,0.6)", background: "#0E1726", opacity: giris, transform: `translateY(${(1 - giris) * 40}px)`, display: "flex" }}>
          <Img src={staticFile(`${ad}/${g.resim}`)} style={{ maxWidth: 960, maxHeight: 760, objectFit: "contain", transform: `scale(${kb})` }} />
        </div>
        {g.kaynak && <div style={{ fontSize: 30, color: "rgba(255,255,255,0.45)", opacity: giris }}>{g.kaynak}</div>}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Tepki balonu: sol üstte yuvarlak video, sahne başında yaylanır, son 6 karede söner.
export const Pip = ({ dosya, kare }: { dosya: string; kare: number }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = spring({ frame: f, fps, config: { damping: 12, stiffness: 180 } }) * interpolate(f, [kare - 6, kare], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 50, top: 170, width: 320, height: 320, borderRadius: 160, overflow: "hidden", border: `6px solid ${TURKUAZ}`, boxShadow: `0 0 50px ${TURKUAZ}88`, transform: `scale(${t})`, background: ZEMIN }}>
      <OffthreadVideo src={staticFile(dosya)} muted style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 30%" }} />
    </div>
  );
};

// Hook (kanca) başlığı: ilk karede ekranda yazı (ses kapalı izleyen de anlasın). Satırlar yaylanarak düşer,
// son satır sarı vurgu; sahne boyunca üstte kalır, son 8 karede söner.
export const Kanca = ({ satirlar, kare }: { satirlar: string[]; kare: number }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const son = interpolate(f, [kare - 8, kare], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: 210, left: 50, right: 50, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: son }}>
      {satirlar.map((s, i) => {
        const p = spring({ frame: f - i * 5, fps, config: { damping: 12, stiffness: 190 } });
        const vurgu = i === satirlar.length - 1;
        return (
          <div key={i} style={{ fontSize: vurgu ? 92 : 64, fontWeight: 700, lineHeight: 1.08, textAlign: "center", color: vurgu ? ZEMIN : "white", background: vurgu ? SARI : "transparent", padding: vurgu ? "6px 26px" : 0, borderRadius: 18, opacity: Math.min(1, p), transform: `translateY(${(1 - p) * -40}px) scale(${0.9 + 0.1 * p})`, WebkitTextStroke: vurgu ? undefined : "8px rgba(0,0,0,0.75)", paintOrder: "stroke fill", boxShadow: vurgu ? `0 10px 40px ${SARI}55` : undefined }}>
            {s}
          </div>
        );
      })}
    </div>
  );
};

// Türk bayrağı — resmî ölçüler (Türk Bayrağı Kanunu; 1200x800 = 1,5G x G): dış ay merkezi 425, r 200;
// iç ay 475, r 160; yıldız merkezi 483,33, çevrel çember r 100, bir ucu uçkura (sağa) bakar.
// Yapay zekâyla üretilmez (ay-yıldız bozuluyor); dilimlere bölünüp sinüsle dalgalandırılır.
const BayrakSvg = () => (
  <svg viewBox="0 0 1200 800" width="100%" height="100%" preserveAspectRatio="none">
    <rect width="1200" height="800" fill="#E30A17" />
    <circle cx="425" cy="400" r="200" fill="#fff" />
    <circle cx="475" cy="400" r="160" fill="#E30A17" />
    <path fill="#fff" d="M583.334 400 402.432 458.779 514.235 304.895v190.21L402.432 341.221z" />
  </svg>
);

// Zafer bayrağı: alttan yükselir, rüzgârda dalgalanır (dikey dilimler + ışık/gölge), sona kadar kalır.
export const Bayrak = ({ genislik = 760, ust = 1310 }: { genislik?: number; ust?: number }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const yuksel = spring({ frame: f, fps, config: { damping: 18, stiffness: 60, mass: 1.2 } });
  const boy = genislik / 1.5;
  // Çok ince, üst üste binen dilimler: dilim sınırı (dikey çizgi) görünmesin.
  const N = 160;
  const w = genislik / N;
  const t = f / fps;
  const dalga = (x: number) => 7 * x - t * 5.5; // dalga gönderden (sol) uca doğru ilerler
  const dy = (x: number) => Math.sin(dalga(x)) * (5 + x * 24);
  // Işık/gölge: dalgayla aynı fazda tam genişlik degrade; her dilim kendi parçasını gösterir (kesintisiz).
  const golge = `linear-gradient(90deg, ${Array.from({ length: 25 }, (_, k) => {
    const x = k / 24;
    const c = Math.cos(dalga(x)) * (0.18 + x * 0.25);
    return `${c > 0 ? `rgba(255,255,255,${c.toFixed(3)})` : `rgba(0,0,0,${(-c * 1.4).toFixed(3)})`} ${(x * 100).toFixed(1)}%`;
  }).join(", ")})`;
  return (
    <div style={{ position: "absolute", left: (1080 - genislik) / 2, top: ust + (1 - yuksel) * (1920 - ust + 80), width: genislik, height: boy, filter: "drop-shadow(0 18px 40px rgba(0,0,0,0.55))" }}>
      {Array.from({ length: N }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: i * w, top: dy(i / N), width: w + 2, height: boy, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: -i * w, top: 0, width: genislik, height: boy }}>
            <BayrakSvg />
            <div style={{ position: "absolute", inset: 0, background: golge }} />
          </div>
        </div>
      ))}
    </div>
  );
};

// İsim bandı (lower third): turkuaz çizgi açılır, ad ve unvan kayarak gelir, ~3 sn sonra çıkar.
export const IsimBandi = ({ satirlar, kare }: { satirlar: string[]; kare: number }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cik = Math.min(kare - 8, fps * 3.2);
  const ac = spring({ frame: f - 6, fps, config: { damping: 16, stiffness: 140 } }) * interpolate(f, [cik, cik + 8], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const yazi = (i: number) => spring({ frame: f - 12 - i * 5, fps, config: { damping: 15 } }) * ac;
  return (
    <div style={{ position: "absolute", left: 60, top: 250, display: "flex", gap: 22, alignItems: "stretch" }}>
      <div style={{ width: 10, borderRadius: 5, background: TURKUAZ, boxShadow: `0 0 30px ${TURKUAZ}`, transform: `scaleY(${ac})` }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 6, background: "rgba(5,11,20,0.72)", padding: "18px 30px", borderRadius: 18, clipPath: `inset(0 ${(1 - ac) * 100}% 0 0)` }}>
        {satirlar.map((s, i) => (
          <div key={i} style={{ fontSize: i ? 38 : 56, fontWeight: i ? 500 : 700, color: i ? TURKUAZ : "white", letterSpacing: i ? 2 : 0, opacity: yazi(i), transform: `translateX(${(1 - yazi(i)) * -40}px)` }}>{s}</div>
        ))}
      </div>
    </div>
  );
};

// Müzik yatağı (konuşurken kısılır) + tek seferlik ses efektleri.
export const Sesler = ({ kurgu }: { kurgu: Kurgu }) => {
  const bitis = (kurgu.sure + kurgu.kuyruk) * FPS;
  const m = kurgu.muzik;
  const konusma = (t: number) =>
    Math.max(0, ...kurgu.kelimeler.map((w) => (t < w.s - 0.35 || t > w.e + 0.45 ? 0 : interpolate(t, [w.s - 0.35, w.s - 0.15, w.e + 0.25, w.e + 0.45], [0, 1, 1, 0]))));
  return (
    <>
      {m && (
        <Audio
          src={staticFile(`${kurgu.ad}/${m.dosya}`)}
          loop
          volume={(f) => {
            const ses = m.ses ?? 0.22;
            const taban = ses + ((m.kisik ?? 0.07) - ses) * konusma(f / FPS);
            const sol = interpolate(f, [0, FPS * 0.5, bitis - FPS * 1.2, bitis], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return taban * sol;
          }}
        />
      )}
      {(kurgu.efektler ?? []).map((e, i) => {
        const an = e.an ?? ifadeAni(kurgu.kelimeler, e.ifade!) + (e.kaydir ?? 0);
        return (
          <Sequence key={i} from={Math.max(0, Math.round(an * FPS))}>
            <Audio src={staticFile(`${kurgu.ad}/${e.ses}`)} volume={e.seviye ?? 0.5} />
          </Sequence>
        );
      })}
    </>
  );
};

// Stüdyo bitişi: kare kare değişen film grenı + yumuşak vinyet.
export const Bitis = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ opacity: 0.06, mixBlendMode: "overlay" }}>
        <svg width="1080" height="1920">
          <filter id="gren">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={f} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#gren)" />
        </svg>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35) 100%)" }} />
    </AbsoluteFill>
  );
};
