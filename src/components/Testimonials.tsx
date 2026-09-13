"use client";

import { Star, Quote } from "lucide-react";
import { YouTubeEmbed } from "./YouTubeEmbed";
import { BunnyEmbed } from "./BunnyEmbed";
import { TESTIMONIALS } from "../lib/socialproof";
import { useLang, useT } from "../lib/i18n-client";

// Öğrenci memnuniyet videoları. İçerik yoksa bölüm gizlenir.
export function Testimonials() {
  const t = useT().testimonials;
  const lang = useLang();

  if (TESTIMONIALS.length === 0) return null;

  return (
    <section id="testimonials" className="py-20 md:py-32 bg-black/30 border-y border-border/10">
      <div className="container-page">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <span className="text-primary text-sm font-bold tracking-widest uppercase mb-2 block">{t.eyebrow}</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">{t.title}</h2>
          <p className="text-muted-foreground text-lg mt-4">{t.lead}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((item, i) => {
            const quote = lang === "en" ? item.quoteEn : item.quote;
            return (
            <div key={i} className="glass-panel rounded-2xl border border-border/40 overflow-hidden flex flex-col">
              <div className="aspect-video bg-black/40 border-b border-border/40">
                {item.youTubeId ? (
                  <YouTubeEmbed
                    videoId={item.youTubeId}
                    title={`${item.name} — ${t.videoTitleSuffix}`}
                    label={t.watch}
                    poster={{ title: item.name, subtitle: item.role, accent: "cyan" }}
                  />
                ) : item.bunnyId ? (
                  <BunnyEmbed
                    videoId={item.bunnyId}
                    title={`${item.name} — ${t.videoTitleSuffix}`}
                    label={t.watch}
                    poster={{ title: item.name, subtitle: item.role, accent: "cyan" }}
                  />
                ) : null}
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="flex gap-0.5 mb-3 text-primary">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                {quote && (
                  <p className="text-sm text-foreground/90 leading-relaxed flex-1">
                    <Quote className="h-4 w-4 text-primary inline mr-1 -mt-1" />
                    {quote}
                  </p>
                )}
                <div className="mt-4">
                  <p className="text-sm font-bold">{item.name}</p>
                  {item.role && <p className="text-xs text-muted-foreground">{item.role}</p>}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
