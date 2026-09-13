"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ArrowRight, ChevronLeft, Video, Play } from "lucide-react";
import CheckoutForm from "./CheckoutForm";
import { BunnyEmbed } from "./BunnyEmbed";
import { YouTubeEmbed } from "./YouTubeEmbed";
import { getTraining, trainingPoster, trainingText, lessonTitle, BUNDLE, DISCOUNTED_TRAINING_PRICE } from "../lib/trainings";
import { useHref, useLang, useT } from "../lib/i18n-client";
import { fill } from "../lib/i18n";

// Tek eğitim için özel satış+ödeme sayfası. İçerik eğitim kataloğundan (trainings.ts) gelir.
// /investor-training elle yazılmış bir sayfa; bu bileşen diğer eğitimleri aynı düzende üretir.
export function TrainingSalesPage({ trainingId }: { trainingId: string }) {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const lang = useLang();
  const all = useT();
  const d = all.trainingPage;
  const href = useHref();
  const t = getTraining(trainingId);
  if (!t) return null;

  const text = trainingText(t, lang);
  const lessonCount = t.lessons.length;
  const priceLabel = lang === "en" ? `$${t.price}` : `${t.price} $`;

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col">
      {/* Background blobs */}
      <div className="absolute top-0 right-1/4 -z-10 h-96 w-96 rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-10 left-1/4 -z-10 h-96 w-96 rounded-full bg-accent/5 blur-[120px]" />

      {/* Header */}
      <header className="w-full border-b border-border/40 bg-background/50 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8">
          <Link href={href("/egitimler")} className="flex items-center gap-2 group">
            <ChevronLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">{d.allTrainings}</span>
          </Link>
          <Link href={href("/")} className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-sd-beyaz.png" alt="Startup Doktoru" className="h-9 w-auto" />
          </Link>
        </div>
      </header>

      <main className="flex-1 py-16 px-6 sm:px-8 max-w-7xl mx-auto">
        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-24">
          <div className="lg:col-span-7 flex flex-col items-start">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs text-primary font-semibold uppercase tracking-wider mb-6">
              <Video className="h-3.5 w-3.5" />
              {fill(d.badge, { n: lessonCount })}
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold leading-[1.1] tracking-tight mb-6">
              {text.title}
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl">
              {text.tagline}
            </p>

            <div className="space-y-4 mb-10">
              {text.topics.map((topic) => (
                <div key={topic} className="flex items-center gap-3 text-sm text-foreground/90">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  <span>{topic}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <button onClick={() => setIsCheckoutOpen(true)} className="btn btn-lg btn-primary cursor-pointer">
                {fill(d.start, { price: t.price })}
                <ArrowRight className="h-4 w-4" />
              </button>
              {/* Değer merdiveni: daha ucuz giriş (e-kitap) ve daha kapsamlı seçenek (paket) */}
              <Link href={href("/ebook")} className="flex flex-col hover:opacity-80 transition-opacity">
                <span className="text-sm font-bold text-accent">{fill(d.ebookDiscount, { price: DISCOUNTED_TRAINING_PRICE })}</span>
                <span className="text-xs text-muted-foreground">{d.ebookDiscountNote}</span>
              </Link>
              <Link href={href("/egitimler")} className="flex flex-col hover:opacity-80 transition-opacity">
                <span className="text-sm font-bold text-primary">{fill(d.bundle, { price: BUNDLE.price })}</span>
                <span className="text-xs text-muted-foreground">{d.bundleNote}</span>
              </Link>
            </div>
          </div>

          {/* Ücretsiz önizleme */}
          <div className="lg:col-span-5 flex flex-col items-center gap-3">
            <div className="w-full max-w-lg aspect-video rounded-3xl border border-border bg-[#0E1726]/40 overflow-hidden shadow-2xl">
              {t.previewYouTube ? (
                <YouTubeEmbed videoId={t.previewYouTube} title={`${text.title} — ${d.previewSuffix}`} label={d.watchPreview} poster={trainingPoster(t.id, lang)} />
              ) : (
                <BunnyEmbed videoId={t.previewVideo} title={`${text.title} — ${d.previewSuffix}`} label={d.watchPreview} poster={trainingPoster(t.id, lang)} />
              )}
            </div>
            <span className="text-xs text-muted-foreground">{fill(d.previewNote, { n: lessonCount, price: t.price, discount: DISCOUNTED_TRAINING_PRICE })}</span>
          </div>
        </div>

        {/* Müfredat */}
        <section className="border-t border-border/40 pt-20">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-accent text-sm font-bold tracking-widest uppercase mb-2 block">{d.curriculumEyebrow}</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{d.curriculumTitle}</h2>
            <p className="text-muted-foreground mt-4">{fill(d.curriculumLead, { n: lessonCount })}</p>
          </div>

          <div className="space-y-4 max-w-4xl mx-auto mb-16">
            {t.lessons.map((lesson, idx) => (
              <div key={lesson.id} className="glass-panel p-6 rounded-2xl border border-border/60 hover:border-primary/20 transition-all flex items-center gap-6">
                <span className="text-xs font-bold font-mono text-primary px-2.5 py-1 rounded bg-primary/10 border border-primary/25 shrink-0">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <h3 className="text-base font-bold flex-1">{lessonTitle(lesson, lang)}</h3>
                <Play className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <button onClick={() => setIsCheckoutOpen(true)} className="btn btn-lg btn-primary cursor-pointer">
              {fill(d.startNow, { price: t.price })}
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
            <Link href={href("/egitimler")} className="hover:text-primary transition-colors">{d.allTrainings}</Link>
            <Link href={href("/ebook")} className="hover:text-primary transition-colors">{d.ebook}</Link>
          </div>
        </div>
      </footer>

      {isCheckoutOpen && (
        <CheckoutForm
          productId={t.id}
          productTitle={text.title}
          productNote={fill(d.checkoutNote, { n: lessonCount })}
          priceLabel={priceLabel}
          productQuery={t.productQuery}
          onClose={() => setIsCheckoutOpen(false)}
        />
      )}
    </div>
  );
}
