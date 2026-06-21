"use client";

import { useState } from "react";
import { Play } from "lucide-react";

type Accent = "cyan" | "violet" | "amber" | "emerald";

type Poster = {
  title?: string;
  subtitle?: string;
  badge?: string; // ör. "ÜCRETSİZ"
  accent?: Accent;
};

type Props = {
  videoId: string;
  title: string;
  label?: string; // kapakta gösterilecek metin (ör. "1 Dakikalık Önizleme")
  poster?: Poster; // markalı kapak (gradient + başlık). Boşsa sade YouTube küçük resmi.
  onPlay?: () => void; // ilk oynatmada tetiklenir (ör. ilgi tag'i)
};

const ACCENTS: Record<Accent, { glow: string; from: string; ring: string }> = {
  cyan: { glow: "#22d3ee", from: "rgba(34,211,238,0.22)", ring: "rgba(34,211,238,0.4)" },
  violet: { glow: "#a78bfa", from: "rgba(167,139,250,0.22)", ring: "rgba(167,139,250,0.4)" },
  amber: { glow: "#fbbf24", from: "rgba(251,191,36,0.20)", ring: "rgba(251,191,36,0.4)" },
  emerald: { glow: "#10b981", from: "rgba(16,185,129,0.22)", ring: "rgba(16,185,129,0.45)" },
};

// Tıkla-oynat (facade) YouTube gömme: önce kapak + play, tıklayınca iframe yükler.
// videoId boşsa markalı "Video yakında" placeholder'ı gösterir.
export function YouTubeEmbed({ videoId, title, label, poster, onPlay }: Props) {
  const [playing, setPlaying] = useState(false);
  const a = ACCENTS[poster?.accent || "cyan"];
  const start = () => {
    setPlaying(true);
    onPlay?.();
  };

  if (!videoId) {
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
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  // Markalı kapak: YouTube küçük resmi arkada bulanık, üstünde gradient + başlık + play.
  if (poster) {
    return (
      <button
        type="button"
        onClick={start}
        className="group relative w-full h-full cursor-pointer overflow-hidden"
        aria-label={`${title} videosunu oynat`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-[2px] opacity-50"
        />
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(120% 120% at 50% 0%, ${a.from} 0%, rgba(5,11,20,0.85) 60%, rgba(5,11,20,0.95) 100%)` }}
        />
        <div
          className="absolute -top-10 left-1/2 -translate-x-1/2 h-40 w-40 rounded-full blur-3xl pointer-events-none"
          style={{ background: a.glow, opacity: 0.3 }}
        />
        <div className="relative z-10 h-full w-full flex flex-col items-center justify-center gap-3 px-6 text-center">
          {poster.badge && (
            <span className="text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full text-white" style={{ background: a.glow }}>
              {poster.badge}
            </span>
          )}
          <div
            className="h-20 w-20 rounded-full border backdrop-blur flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300 shadow-2xl"
            style={{ borderColor: a.ring, background: "rgba(255,255,255,0.12)" }}
          >
            <Play className="h-9 w-9 fill-current ml-1" />
          </div>
          {poster.title && <p className="text-lg sm:text-xl font-extrabold tracking-tight text-white leading-snug max-w-md">{poster.title}</p>}
          {(poster.subtitle || label) && <p className="text-xs sm:text-sm text-white/75">{poster.subtitle || label}</p>}
        </div>
      </button>
    );
  }

  // Sade görünüm (poster yoksa)
  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="group relative w-full h-full cursor-pointer"
      aria-label={`${title} videosunu oynat`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
        alt={title}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-3 group-hover:bg-black/30 transition-colors">
        <div className="h-20 w-20 rounded-full border border-primary/30 bg-primary/20 backdrop-blur flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300 shadow-xl shadow-primary/25">
          <Play className="h-8 w-8 fill-current ml-1" />
        </div>
        {label && <span className="text-sm font-bold text-white">{label}</span>}
      </div>
    </button>
  );
}
