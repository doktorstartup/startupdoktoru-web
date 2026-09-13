"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Check,
  BookOpen,
  ArrowRight,
  ChevronLeft,
} from "lucide-react";
import CheckoutForm from "../../../../components/CheckoutForm";
import { useHref, useT } from "../../../../lib/i18n-client";

export default function EBookLanding() {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const all = useT();
  const t = all.ebookPage;
  const href = useHref();


  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-primary relative overflow-hidden flex flex-col justify-between">
      
      {/* Background gradients */}
      <div className="absolute top-0 right-1/4 -z-10 h-96 w-96 rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-10 left-1/4 -z-10 h-96 w-96 rounded-full bg-accent/5 blur-[120px]" />

      {/* Header */}
      <header className="w-full border-b border-border/40 bg-background/50 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8">
          <Link href={href("/")} className="flex items-center gap-2 group">
            <ChevronLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">{t.backHome}</span>
          </Link>
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-sd-beyaz.png" alt="Startup Doktoru" className="h-9 w-auto" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-16 px-6 sm:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-24">
          
          {/* Landing Context */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs text-primary font-semibold uppercase tracking-wider mb-6">
              <BookOpen className="h-3.5 w-3.5 animate-pulse" />
              {t.badge}
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold leading-[1.1] tracking-tight mb-8">
              {t.title}
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl">
              {t.intro}
            </p>

            <div className="space-y-4 mb-8">
              {t.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm text-foreground/90">
                  <Check className="h-4.5 w-4.5 text-primary shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-end gap-3">
                <span className="text-base text-muted-foreground/70 line-through font-mono mb-1.5">{all.prices.ebookOld}</span>
                <span className="text-5xl font-black text-primary font-mono leading-none tracking-tight">{all.prices.ebookNew}</span>
                <span className="inline-flex items-center rounded-full bg-primary/15 text-primary border border-primary/30 text-[11px] font-extrabold px-2.5 py-1 uppercase tracking-wide mb-1.5">
                  {t.discountBadge}
                </span>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(true)}
                className="btn btn-lg btn-primary cursor-pointer w-full sm:w-auto"
              >
                {t.cta}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Book Mockup Frame */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative h-96 w-72 rounded-2xl bg-gradient-to-br from-[#0F213A] to-background border border-primary/20 shadow-2xl p-8 flex flex-col justify-between overflow-hidden group">
              <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-primary/10 blur-2xl" />
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-primary font-mono tracking-widest uppercase">E-Book</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent">{t.cardTag}</span>
              </div>
              <div className="my-8">
                <h3 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground font-sans">
                  {t.cardTitleTop}<br />
                  <span className="text-primary font-bold">{t.cardTitleMid}</span><br />
                  {t.cardTitleBottom}
                </h3>
                <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                  {t.cardNote}
                </p>
              </div>
              <div className="flex justify-between items-center border-t border-border/40 pt-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">
                    SD
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Eser Memişoğlu</span>
                </div>
                <div className="text-lg font-bold font-mono text-accent">{all.prices.ebookNew}</div>
              </div>
            </div>
          </div>

        </div>

        {/* Chapters Section */}
        <section className="border-t border-border/40 pt-20">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-accent text-sm font-bold tracking-widest uppercase mb-2 block">{t.chaptersEyebrow}</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{t.chaptersTitle}</h2>
            <p className="text-muted-foreground mt-4">{t.chaptersLead}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.chapters.map((ch, idx) => (
              <div key={idx} className="glass-panel p-8 rounded-2xl border border-border/60 hover:border-primary/20 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 h-16 w-16 bg-primary/5 rounded-full blur-xl" />
                <span className="text-xs font-mono font-bold text-primary">{String(idx + 1).padStart(2, "0")}</span>
                <h3 className="text-xl font-bold mt-2 mb-3">{ch.t}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{ch.d}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center gap-3 mt-12">
            <div className="flex items-end gap-3">
              <span className="text-base text-muted-foreground/70 line-through font-mono mb-1.5">{all.prices.ebookOld}</span>
              <span className="text-4xl font-black text-primary font-mono leading-none tracking-tight">{all.prices.ebookNew}</span>
              <span className="inline-flex items-center rounded-full bg-primary/15 text-primary border border-primary/30 text-[11px] font-extrabold px-2.5 py-1 uppercase tracking-wide mb-1">
                {t.discountBadge}
              </span>
            </div>
            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="btn btn-lg btn-primary cursor-pointer"
            >
              {t.cta}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border/40 py-8 bg-black/10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>{all.footer.copyright}</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-primary transition-colors">{all.footer.privacy}</Link>
            <Link href="#" className="hover:text-primary transition-colors">{all.footer.terms}</Link>
          </div>
        </div>
      </footer>

      {/* ─── STRIPE ELEMENTS CHECKOUT ─── */}
      {isCheckoutOpen && (
        <CheckoutForm
          productId="ebook_13_steps"
          productTitle={t.title}
          productNote={t.checkoutNote}
          priceLabel={all.prices.ebookNew}
          comparePrice={all.prices.ebookOld}
          productQuery="ebook"
          onClose={() => setIsCheckoutOpen(false)}
        />
      )}

    </div>
  );
}
