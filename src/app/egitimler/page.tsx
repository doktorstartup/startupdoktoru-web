"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ArrowRight, Sparkles, Layers, BookOpen } from "lucide-react";
import CheckoutForm from "../../components/CheckoutForm";
import { BunnyEmbed } from "../../components/BunnyEmbed";
import { YouTubeEmbed } from "../../components/YouTubeEmbed";
import { SiteHeader } from "../../components/SiteHeader";
import { SiteFooter } from "../../components/SiteFooter";
import { TRAININGS, BUNDLE, trainingPoster } from "../../lib/trainings";

type Checkout = {
  productId: string;
  productTitle: string;
  productNote: string;
  priceLabel: string;
  productQuery: string;
};

export default function EgitimlerPage() {
  const [checkout, setCheckout] = useState<Checkout | null>(null);

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      <SiteHeader />

      <main className="container-page py-16 md:py-24">
        {/* Hero */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <span className="text-primary text-sm font-bold tracking-widest uppercase mb-2 block">Eğitimler</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Yatırım Yolculuğunun Her Adımı İçin Video Eğitimler
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Tek tek seç ya da paketle hepsine sahip ol. Her eğitim uygulanabilir, sahadan örneklerle dolu.
          </p>
        </div>

        {/* E-kitap nudge */}
        <Link
          href="/ebook"
          className="flex items-center justify-center gap-3 text-base sm:text-lg font-bold text-center mb-12 mx-auto max-w-3xl px-6 py-5 rounded-2xl border border-accent/40 bg-accent/10 text-accent hover:bg-accent/15 transition-all"
        >
          <BookOpen className="h-6 w-6 shrink-0" />
          <span>6 $&apos;lık e-kitabı alan herkes tüm eğitimleri <strong className="text-accent">%50 indirimle (35 $)</strong> alır →</span>
        </Link>

        {/* Bundle highlight */}
        <div className="relative rounded-3xl gradient-panel border border-primary/30 ring-1 ring-primary/20 shadow-2xl p-8 md:p-10 mb-12 overflow-hidden">
          <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute top-0 right-0 bg-primary text-background font-bold text-[10px] px-4 py-1.5 rounded-bl-xl tracking-wider uppercase">
            En Avantajlı
          </div>
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Layers className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-extrabold tracking-tight">{BUNDLE.title}</h2>
              </div>
              <p className="text-sm text-muted-foreground max-w-md">{BUNDLE.tagline}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4">
                {TRAININGS.map((t) => (
                  <span key={t.id} className="flex items-center gap-1.5 text-xs text-foreground/80">
                    <Check className="h-3.5 w-3.5 text-primary" /> {t.title}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-muted-foreground line-through font-mono">210 $</span>
                <span className="text-4xl font-extrabold font-mono text-primary">${BUNDLE.price}</span>
              </div>
              <button
                onClick={() =>
                  setCheckout({
                    productId: BUNDLE.id,
                    productTitle: BUNDLE.title,
                    productNote: "3 eğitimin tamamı",
                    priceLabel: `$${BUNDLE.price}.00`,
                    productQuery: BUNDLE.productQuery,
                  })
                }
                className="btn btn-lg btn-primary cursor-pointer"
              >
                Paketi Al (99 $)
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tek tek eğitimler */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {TRAININGS.map((t) => (
            <div key={t.id} className="glass-panel rounded-2xl border border-border/40 flex flex-col overflow-hidden">
              <div className="aspect-video bg-black/40 border-b border-border/40">
                {t.previewYouTube ? (
                  <YouTubeEmbed videoId={t.previewYouTube} title={`${t.title} — Tanıtım`} label="Tanıtımı İzle" poster={trainingPoster(t.id)} />
                ) : (
                  <BunnyEmbed videoId={t.previewVideo} title={`${t.title} — Tanıtım`} label="Tanıtımı İzle" poster={trainingPoster(t.id)} />
                )}
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-lg font-bold mb-2">{t.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{t.tagline}</p>
                <ul className="space-y-2 mb-6 flex-1">
                  {t.topics.map((topic) => (
                    <li key={topic} className="flex items-start gap-2 text-xs text-foreground/85">
                      <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{topic}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-2xl font-extrabold font-mono text-foreground">${t.price}</span>
                  <button
                    onClick={() =>
                      setCheckout({
                        productId: t.id,
                        productTitle: t.title,
                        productNote: "Video eğitim · ömür boyu erişim",
                        priceLabel: `$${t.price}.00`,
                        productQuery: t.productQuery,
                      })
                    }
                    className="btn btn-primary cursor-pointer"
                  >
                    Satın Al
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Alt nudge */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Sparkles className="h-4 w-4 text-primary" />
            Henüz emin değil misin? Önce ücretsiz eğitimle başla.
          </div>
          <div>
            <Link href="/free-training" className="btn btn-lg btn-secondary">
              12 Dakikalık Ücretsiz Eğitime Katıl
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />

      {checkout && (
        <CheckoutForm
          productId={checkout.productId}
          productTitle={checkout.productTitle}
          productNote={checkout.productNote}
          priceLabel={checkout.priceLabel}
          productQuery={checkout.productQuery}
          onClose={() => setCheckout(null)}
        />
      )}
    </div>
  );
}
