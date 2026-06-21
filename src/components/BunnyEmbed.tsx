"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { BUNNY_LIBRARY } from "../lib/videos";

type Accent = "cyan" | "violet" | "amber";

type Poster = {
  title?: string;
  subtitle?: string;
  badge?: string; // ör. "Ücretsiz Önizleme"
  accent?: Accent;
};

type Props = {
  videoId: string; // Bunny video GUID
  title: string;
  label?: string;
  onPlay?: () => void; // ilk oynatmada tetiklenir (ör. ilgi tag'i)
  poster?: Poster; // markalı kapak (gradient + başlık). Boşsa eski sade görünüm.
};

// Kapak teması — accent'e göre renk/parıltı. Raster görsel yerine CSS kapak.
const ACCENTS: Record<Accent, { glow: string; from: string; ring: string }> = {
  cyan: { glow: "#22d3ee", from: "rgba(34,211,238,0.20)", ring: "rgba(34,211,238,0.35)" },
  violet: { glow: "#a78bfa", from: "rgba(167,139,250,0.20)", ring: "rgba(167,139,250,0.35)" },
  amber: { glow: "#fbbf24", from: "rgba(251,191,36,0.18)", ring: "rgba(251,191,36,0.35)" },
};

// Markalı kapak yüzeyi (gradient + parıltı + başlık). İçerik (play butonu) çağıran tarafından gelir.
function CoverSurface({ poster, children }: { poster: Poster; children: React.ReactNode }) {
  const a = ACCENTS[poster.accent || "cyan"];
  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center text-center overflow-hidden"
      style={{
        background: `radial-gradient(120% 120% at 50% 0%, ${a.from} 0%, rgba(5,11,20,0.92) 55%, #050B14 100%)`,
      }}
    >
      <div
        className="absolute -top-12 left-1/2 -translate-x-1/2 h-40 w-40 rounded-full blur-3xl pointer-events-none"
        style={{ background: a.glow, opacity: 0.25 }}
      />
      <div className="relative z-10 flex flex-col items-center justify-center gap-3 px-4">{children}</div>
      {poster.title && (
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4 text-left bg-gradient-to-t from-black/70 to-transparent">
          <p className="text-sm sm:text-base font-extrabold tracking-tight text-white leading-snug">{poster.title}</p>
          {poster.subtitle && <p className="text-[11px] text-white/70 mt-0.5">{poster.subtitle}</p>}
        </div>
      )}
    </div>
  );
}

// Tıkla-oynat (facade) Bunny.net gömme. videoId boşsa "Video yakında" placeholder.
export function BunnyEmbed({ videoId, title, label, onPlay, poster }: Props) {
  const [playing, setPlaying] = useState(false);
  const accentRing = ACCENTS[poster?.accent || "cyan"].ring;

  // Video henüz yok → markalı "Yakında" kapağı (poster varsa) ya da sade placeholder.
  if (!videoId) {
    if (poster) {
      return (
        <CoverSurface poster={poster}>
          <div
            className="h-16 w-16 rounded-full border flex items-center justify-center text-white/80"
            style={{ borderColor: accentRing, background: "rgba(255,255,255,0.06)" }}
          >
            <Play className="h-7 w-7 fill-current ml-1" />
          </div>
          <span className="text-[10px] font-mono text-white/60 uppercase tracking-widest">Video yakında</span>
        </CoverSurface>
      );
    }
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-center bg-black/60">
        <div className="h-20 w-20 rounded-full border border-primary/30 bg-primary/10 flex items-center justify-center text-primary">
          <Play className="h-8 w-8 fill-current ml-1" />
        </div>
        {label && <span className="text-sm font-bold text-foreground/80">{label}</span>}
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Video yakında</span>
      </div>
    );
  }

  if (playing) {
    return (
      <iframe
        className="w-full h-full"
        src={`https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY}/${videoId}?autoplay=true&preload=true&responsive=true`}
        title={title}
        loading="lazy"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
        allowFullScreen
      />
    );
  }

  // Markalı kapaklı idle görünüm
  if (poster) {
    return (
      <button
        type="button"
        onClick={() => {
          setPlaying(true);
          onPlay?.();
        }}
        className="group relative w-full h-full cursor-pointer"
        aria-label={`${title} videosunu oynat`}
      >
        <CoverSurface poster={poster}>
          {poster.badge && (
            <span
              className="text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full text-white"
              style={{ background: ACCENTS[poster.accent || "cyan"].glow }}
            >
              {poster.badge}
            </span>
          )}
          <div
            className="h-20 w-20 rounded-full border backdrop-blur flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300 shadow-xl"
            style={{ borderColor: accentRing, background: "rgba(255,255,255,0.10)" }}
          >
            <Play className="h-8 w-8 fill-current ml-1" />
          </div>
          {label && (
            <span className="px-3 py-1 rounded-full bg-black/40 text-xs font-bold text-white border border-white/10">
              {label}
            </span>
          )}
        </CoverSurface>
      </button>
    );
  }

  // Sade idle görünüm (poster yoksa — ör. portal ders oynatıcı)
  return (
    <button
      type="button"
      onClick={() => {
        setPlaying(true);
        onPlay?.();
      }}
      className="group relative w-full h-full cursor-pointer bg-black/70 flex flex-col items-center justify-center gap-3"
      aria-label={`${title} videosunu oynat`}
    >
      <div className="h-20 w-20 rounded-full border border-primary/30 bg-primary/20 backdrop-blur flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300 shadow-xl shadow-primary/25">
        <Play className="h-8 w-8 fill-current ml-1" />
      </div>
      {label && <span className="text-sm font-bold text-white">{label}</span>}
    </button>
  );
}
