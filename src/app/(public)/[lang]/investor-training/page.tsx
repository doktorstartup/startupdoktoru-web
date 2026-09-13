"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Check,
  ArrowRight,
  ChevronLeft,
  Video,
  Award,
  Users,
  TrendingUp,
  BarChart3,
  Sparkles
} from "lucide-react";
import CheckoutForm from "../../../../components/CheckoutForm";
import { BunnyEmbed } from "../../../../components/BunnyEmbed";
import { getTraining, trainingPoster } from "../../../../lib/trainings";
import { useHref, useLang, useT } from "../../../../lib/i18n-client";

export default function InvestorTraining() {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const lang = useLang();
  const all = useT();
  const d = all.investorTrainingPage;
  const tp = all.trainingPage;
  const href = useHref();

  // Modül kartlarının simgeleri sıraya göre; metin sözlükten gelir.
  const moduleIcons = [BarChart3, Sparkles, TrendingUp, Users, Award];


  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col">

      {/* Background blobs */}
      <div className="absolute top-0 right-1/4 -z-10 h-96 w-96 rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-10 left-1/4 -z-10 h-96 w-96 rounded-full bg-accent/5 blur-[120px]" />

      {/* Header */}
      <header className="w-full border-b border-border/40 bg-background/50 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8">
          <Link href={href("/")} className="flex items-center gap-2 group">
            <ChevronLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">{all.ebookPage.backHome}</span>
          </Link>
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-sd-beyaz.png" alt="Startup Doktoru" className="h-9 w-auto" />
          </div>
        </div>
      </header>

      <main className="flex-1 py-16 px-6 sm:px-8 max-w-7xl mx-auto">

        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-24">
          <div className="lg:col-span-7 flex flex-col items-start">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs text-primary font-semibold uppercase tracking-wider mb-6">
              <Video className="h-3.5 w-3.5" />
              {d.badge}
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold leading-[1.1] tracking-tight mb-6">
              {d.titleTop}<br />
              <span className="text-primary">{d.titleBottom}</span>
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl">
              {d.intro}
            </p>

            <div className="space-y-4 mb-10">
              {d.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm text-foreground/90">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <button
                onClick={() => setIsCheckoutOpen(true)}
                className="btn btn-lg btn-primary cursor-pointer"
              >
                {d.start}
                <ArrowRight className="h-4 w-4" />
              </button>
              {/* Değer merdiveni: daha ucuz giriş (e-kitap) ve daha kapsamlı seçenek (paket) */}
              <Link href={href("/ebook")} className="flex flex-col hover:opacity-80 transition-opacity">
                <span className="text-sm font-bold text-accent">{tp.ebookDiscount.replace("{price}", "35")}</span>
                <span className="text-xs text-muted-foreground">{tp.ebookDiscountNote}</span>
              </Link>
              <Link href={href("/egitimler")} className="flex flex-col hover:opacity-80 transition-opacity">
                <span className="text-sm font-bold text-primary">{tp.bundle.replace("{price}", "99")}</span>
                <span className="text-xs text-muted-foreground">{tp.bundleNote}</span>
              </Link>
            </div>
          </div>

          {/* 1 dakikalık ücretsiz önizleme videosu */}
          <div className="lg:col-span-5 flex flex-col items-center gap-3">
            <div className="w-full max-w-lg aspect-video rounded-3xl border border-border bg-[#0E1726]/40 overflow-hidden shadow-2xl">
              <BunnyEmbed
                videoId={getTraining("investor_training")?.previewVideo || ""}
                title={d.videoTitle}
                label={tp.watchPreview}
                poster={trainingPoster("investor_training", lang)}
              />
            </div>
            <span className="text-xs text-muted-foreground">{d.previewNote}</span>
          </div>
        </div>

        {/* Modules Grid */}
        <section className="border-t border-border/40 pt-20">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-accent text-sm font-bold tracking-widest uppercase mb-2 block">{d.curriculumEyebrow}</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{d.curriculumTitle}</h2>
            <p className="text-muted-foreground mt-4">{d.curriculumLead}</p>
          </div>

          <div className="space-y-4 max-w-4xl mx-auto mb-16">
            {d.modules.map((mod, idx) => {
              const Icon = moduleIcons[idx];
              return (
              <div key={idx} className="glass-panel p-6 rounded-2xl border border-border/60 hover:border-primary/20 transition-all flex items-start gap-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold font-mono text-primary uppercase tracking-widest">{d.modulePrefix} {String(idx + 1).padStart(2, "0")}</span>
                    <span className="text-xs font-mono text-muted-foreground px-2 py-0.5 rounded bg-secondary/30 border border-border">{mod.duration}</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">{mod.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{mod.desc}</p>
                </div>
              </div>
              );
            })}
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="btn btn-lg btn-primary cursor-pointer"
            >
              {d.startNow}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border/40 py-8 bg-black/10 mt-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>{all.footer.copyright}</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-primary transition-colors">{all.footer.privacy}</Link>
            <Link href="#" className="hover:text-primary transition-colors">{all.footer.terms}</Link>
          </div>
        </div>
      </footer>

      {/* Stripe Elements Checkout */}
      {isCheckoutOpen && (
        <CheckoutForm
          productId="investor_training"
          productTitle={d.checkoutTitle}
          productNote={d.checkoutNote}
          priceLabel={lang === "en" ? "$70" : "70 $"}
          productQuery="investor_training"
          onClose={() => setIsCheckoutOpen(false)}
        />
      )}

    </div>
  );
}
