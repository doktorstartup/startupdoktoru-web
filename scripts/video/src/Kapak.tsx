import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import { loadFont } from "@remotion/google-fonts/SpaceGrotesk";
import type { Props } from "./Video";

// Kapak (1080x1920: Reels/Shorts/LinkedIn) ve thumbnail (1280x720: YouTube/LinkedIn önizleme).
// Arka plan: yüz çekiminin en ifadeli anı. Kapakta yazı, Instagram ızgarasının 3:4 kırpmasında
// (ortadaki 1080x1440) kalacak şekilde yerleşir.
const { fontFamily } = loadFont("normal", { weights: ["700"], subsets: ["latin", "latin-ext"] });
const TURKUAZ = "#00E5FF";
const SARI = "#FACC15";

const Arka = ({ kurgu, konum }: { kurgu: NonNullable<Props["kurgu"]>; konum: string }) => (
  <OffthreadVideo
    src={staticFile(kurgu.sahneler.find((s) => s.goruntu)!.goruntu!)}
    startFrom={Math.round(kurgu.kapak!.arka_sn * 30)}
    muted
    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: konum }}
  />
);

const Rozet = ({ metin, boyut }: { metin: string; boyut: number }) => (
  <div style={{ alignSelf: "flex-start", fontSize: boyut, color: "#050B14", background: TURKUAZ, padding: `${boyut * 0.3}px ${boyut * 0.7}px`, borderRadius: 999 }}>{metin}</div>
);

const stroke = { WebkitTextStroke: "8px rgba(0,0,0,0.9)", paintOrder: "stroke fill", textShadow: "0 8px 30px rgba(0,0,0,0.7)" } as const;

export const Kapak = ({ kurgu }: Props) => {
  if (!kurgu?.kapak) return null;
  const k = kurgu.kapak;
  return (
    <AbsoluteFill style={{ fontFamily, fontWeight: 700 }}>
      <Arka kurgu={kurgu} konum="50% 30%" />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(5,11,20,0) 35%, rgba(5,11,20,0.75) 70%, rgba(5,11,20,0.9) 100%)" }} />
      <div style={{ position: "absolute", left: 70, right: 70, top: 1010, display: "flex", flexDirection: "column", gap: 18 }}>
        {k.rozet && <Rozet metin={k.rozet} boyut={46} />}
        {k.baslik.map((s, i) => (
          <div key={i} style={{ fontSize: 112, lineHeight: 1.02, color: "white", ...stroke }}>{s}</div>
        ))}
        <div style={{ fontSize: 190, lineHeight: 1, color: SARI, ...stroke }}>{k.vurgu}</div>
      </div>
      <div style={{ position: "absolute", bottom: 90, width: "100%", textAlign: "center", fontSize: 44, color: "white" }}>
        Startup<span style={{ color: TURKUAZ }}>Doktoru</span>
      </div>
    </AbsoluteFill>
  );
};

export const Thumbnail = ({ kurgu }: Props) => {
  if (!kurgu?.kapak) return null;
  const k = kurgu.kapak;
  return (
    <AbsoluteFill style={{ fontFamily, fontWeight: 700, background: "#050B14" }}>
      <div style={{ position: "absolute", right: 0, top: 0, width: 760, height: 720 }}>
        <Arka kurgu={kurgu} konum="50% 25%" />
      </div>
      <AbsoluteFill style={{ background: "linear-gradient(90deg, #050B14 38%, rgba(5,11,20,0.6) 60%, rgba(5,11,20,0) 80%)" }} />
      <div style={{ position: "absolute", left: 60, top: 120, width: 720, display: "flex", flexDirection: "column", gap: 12 }}>
        {k.rozet && <Rozet metin={k.rozet} boyut={30} />}
        {k.baslik.map((s, i) => (
          <div key={i} style={{ fontSize: 84, lineHeight: 1.02, color: "white" }}>{s}</div>
        ))}
        <div style={{ fontSize: 150, lineHeight: 1, color: SARI }}>{k.vurgu}</div>
        <div style={{ fontSize: 34, color: "white", marginTop: 18 }}>
          Startup<span style={{ color: TURKUAZ }}>Doktoru</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
