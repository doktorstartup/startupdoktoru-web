"use client";

import { useEffect, useState } from "react";
import { GalleryHorizontal, Link2 } from "lucide-react";

// Kaydırmalı post kuyruğu (Instagram carousel + LinkedIn PDF belge) — salt okunur.
// Gönderimi 15 dk'lık tik yapar (lib/instagram-carousel.ts); bu bölüm yalnız durumu gösterir.

type Post = {
  id: string;
  baslik: string;
  yayin_at: string;
  durum: string;
  link: string | null;
  hata: string | null;
  gorsel: number;
  kapak: string | null;
  linkedin: boolean;
  linkedin_durum: string | null;
  linkedin_link: string | null;
  linkedin_hata: string | null;
};

const ETIKET: Record<string, { ad: string; cls: string }> = {
  bekliyor: { ad: "Bekliyor", cls: "bg-secondary/30 text-muted-foreground" },
  yuklendi: { ad: "İşleniyor", cls: "bg-amber-500/15 text-amber-300" },
  isleniyor: { ad: "İşleniyor", cls: "bg-amber-500/15 text-amber-300" },
  yayinda: { ad: "Yayında", cls: "bg-emerald-500/15 text-emerald-300" },
  atlandi: { ad: "Atlandı", cls: "bg-secondary/30 text-muted-foreground" },
  hata: { ad: "Hata", cls: "bg-red-500/15 text-red-300" },
};

const tarih = (s: string) => new Date(s).toLocaleString("tr-TR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function Durum({ ad, durum, link, hata }: { ad: string; durum: string; link: string | null; hata: string | null }) {
  const e = ETIKET[durum] || { ad: durum, cls: "bg-secondary/30 text-muted-foreground" };
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <span className="text-muted-foreground">{ad}</span>
      <span className={`px-2 py-0.5 rounded-md ${e.cls}`}>{e.ad}</span>
      {link && (
        <a href={link} target="_blank" rel="noreferrer" className="text-primary">
          <Link2 className="h-3 w-3" />
        </a>
      )}
      {hata && <span className="text-red-300">{hata}</span>}
    </span>
  );
}

export default function Carousel({ pw }: { pw: () => string }) {
  const [postlar, setPostlar] = useState<Post[] | null>(null);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/admin/paylasim/carousel?password=${encodeURIComponent(pw())}`);
      const d = await r.json().catch(() => ({}));
      if (!r.ok) return setHata(d.error || "Yüklenemedi.");
      setPostlar(d.postlar);
    })();
  }, [pw]);

  const [simdi] = useState(() => Date.now());
  const sirada = (postlar || []).filter((p) => p.durum === "bekliyor" && new Date(p.yayin_at).getTime() > simdi).length;

  return (
    <div className="glass-panel rounded-2xl border border-border/40 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-bold flex items-center gap-2">
          <GalleryHorizontal className="h-4 w-4 text-primary" /> Kaydırmalı postlar
        </h2>
        <span className="text-xs text-muted-foreground">{sirada} sırada · son 7 gün</span>
      </div>
      {hata && <p className="text-sm text-red-400">{hata}</p>}
      {postlar && postlar.length === 0 && <p className="text-sm text-muted-foreground">Kuyrukta kaydırmalı post yok.</p>}
      {(postlar || []).map((p) => (
        <div key={p.id} className="flex gap-3 rounded-xl border border-border/40 p-3">
          {p.kapak && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.kapak} alt="" className="h-20 w-16 rounded-lg object-cover shrink-0" />
          )}
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-bold">{p.baslik}</span>
              <span className="text-xs text-muted-foreground">
                {tarih(p.yayin_at)} · {p.gorsel} görsel
              </span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs">
              <Durum ad="Instagram" durum={p.durum} link={p.link} hata={p.hata} />
              {p.linkedin && <Durum ad="LinkedIn (PDF)" durum={p.linkedin_durum || "bekliyor"} link={p.linkedin_link} hata={p.linkedin_hata} />}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
