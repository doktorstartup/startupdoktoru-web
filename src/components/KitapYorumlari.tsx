"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

// Kitap satış sayfasında okur yorumları: yalnız admin onaylı + okurun yayın
// izni verdiği yorumlar. Hiç yorum yoksa bölüm render edilmez.
// Yalnız Türkçe tarafta kullanılır (kitap Türkçe) — metinler bu yüzden burada.
type Yorum = { ad: string | null; meslek: string | null; puan: number; yorum: string };

export function KitapYorumlari() {
  const [yorumlar, setYorumlar] = useState<Yorum[]>([]);

  useEffect(() => {
    fetch("/api/ebook/yorum?yayinda=1")
      .then((r) => r.json())
      .then((d) => setYorumlar(d.yorumlar || []))
      .catch(() => {});
  }, []);

  if (yorumlar.length === 0) return null;

  return (
    <section className="max-w-5xl mx-auto px-6 sm:px-8 py-16">
      <span className="text-primary text-xs font-bold font-mono tracking-widest uppercase">Okur Yorumları</span>
      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 mb-8">İlk okurlar ne diyor?</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {yorumlar.map((y, i) => (
          <figure key={i} className="glass-panel rounded-2xl border border-border/40 p-6 flex flex-col gap-3">
            <div className="flex gap-0.5" aria-label={`${y.puan} / 5`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} className={`h-4 w-4 ${n <= y.puan ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
              ))}
            </div>
            <blockquote className="text-sm leading-relaxed whitespace-pre-wrap">“{y.yorum}”</blockquote>
            <figcaption className="text-xs text-muted-foreground mt-auto">
              <span className="font-semibold text-foreground">{y.ad || "Okur"}</span>
              {y.meslek && <> · {y.meslek}</>}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
