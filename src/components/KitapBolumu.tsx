"use client";

import Link from "next/link";
import Image from "next/image";
import { BookOpen, Check, ExternalLink, Sparkles, Download } from "lucide-react";
import { KITAP, KITAP_METIN as M } from "../lib/kitap";
import { useHref, useLang, useT } from "../lib/i18n-client";

// Basılı kitabın tanıtımı + dijital sürümle ilişkisi.
// Kitap girilmemişse ya da İngilizce taraftaysak bölüm hiç render edilmez.
export function KitapBolumu() {
  const lang = useLang();
  const all = useT();
  const href = useHref();

  if (!KITAP || !KITAP.yayinda || lang !== "tr") return null;
  const cikti = KITAP.durum === "cikti";

  return (
    <section id="kitap" className="py-20 md:py-32 bg-black/40 border-y border-border/10">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Kitap tanıtımı */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 flex justify-center">
            <Image
              src={KITAP.kapak}
              alt={`${KITAP.baslik} — kitap kapağı`}
              width={1000}
              height={1445}
              sizes="(max-width: 640px) 256px, 288px"
              className="w-64 sm:w-72 h-auto rounded-lg shadow-2xl ring-1 ring-border/40"
            />
          </div>

          <div className="lg:col-span-7 flex flex-col items-start">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/20 bg-accent/5 text-xs text-accent font-semibold uppercase tracking-wider mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              {cikti ? M.eyebrowCikti : M.eyebrowYakinda}
            </span>

            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-3">
              {KITAP.baslik}
            </h2>
            <p className="text-lg text-primary font-semibold mb-6">{KITAP.altBaslik}</p>

            <p className="text-muted-foreground leading-relaxed mb-6 text-base max-w-xl">{KITAP.ozet}</p>

            {KITAP.sorular.length > 0 && (
              <ul className="space-y-3 mb-8 max-w-xl">
                {KITAP.sorular.map((q) => (
                  <li key={q} className="flex items-start gap-3 text-sm text-foreground/90 leading-relaxed">
                    <span className="text-accent font-bold shrink-0">?</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            )}

            <p className="text-sm font-bold text-foreground mb-6">
              {cikti ? M.durumCikti : M.durumYakinda}
              {KITAP.fiyat && <span className="text-muted-foreground font-normal"> · {KITAP.fiyat}</span>}
            </p>

            {KITAP.saticilar.length > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  {M.satinAl}
                </span>
                {KITAP.saticilar.map((s) => (
                  <a
                    key={s.ad}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-secondary"
                  >
                    {s.ad} <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* İki format, aynı kitap — dijital sürüm huninin giriş kapısı */}
        <div className="mt-20 pt-16 border-t border-border/20">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{M.formatBaslik}</h3>
            <p className="text-muted-foreground mt-3">{M.formatLead}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Basılı */}
            <div className="glass-panel p-8 rounded-2xl border border-border/60 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-xl bg-secondary/40 border border-border/60 flex items-center justify-center text-muted-foreground shrink-0">
                  <BookOpen className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  {M.basiliEtiket}
                </span>
              </div>
              <h4 className="text-xl font-bold mb-3">{KITAP.baslik}</h4>
              <ul className="space-y-2 mb-6 flex-1">
                {M.basiliOzellikler.map((o) => (
                  <li key={o} className="flex items-start gap-2 text-xs text-foreground/85">
                    <Check className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
              {KITAP.fiyat && (
                <div className="mb-4 font-mono">
                  <span className="text-2xl font-extrabold text-foreground">{KITAP.fiyat}</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground text-center py-2.5 rounded-xl border border-border/40 bg-secondary/20">
                {cikti ? M.basiliCtaCikti : M.basiliCtaYakinda}
              </p>
            </div>

            {/* Dijital — birincil çağrı, e-posta burada yakalanıyor */}
            <div className="glass-panel p-8 rounded-2xl border border-primary/40 ring-1 ring-primary/20 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Download className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-primary uppercase tracking-widest">
                  {M.dijitalEtiket}
                </span>
              </div>
              <h4 className="text-xl font-bold mb-3">{M.dijitalBaslik}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">{M.dijitalOzet}</p>
              <ul className="space-y-2 mb-6 flex-1">
                {M.dijitalOzellikler.map((o) => (
                  <li key={o} className="flex items-start gap-2 text-xs text-foreground/85">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
              <div className="flex items-baseline gap-2 mb-4 font-mono">
                <span className="text-sm text-muted-foreground line-through">{all.prices.ebookOld}</span>
                <span className="text-2xl font-extrabold text-primary">{all.prices.ebookNew}</span>
              </div>
              <Link href={href("/ebook")} className="btn btn-primary w-full">
                {M.dijitalCta}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
