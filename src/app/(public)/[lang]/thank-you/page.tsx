"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  ArrowRight,
  Download,
  Video,
  Calendar,
  Sparkles,
  ChevronLeft,
  Check,
  Layers,
} from "lucide-react";
import CheckoutForm from "../../../../components/CheckoutForm";
import { TRAININGS, BUNDLE, trainingText, bundleText, EBOOK_DISCOUNT_CODE, DISCOUNTED_TRAINING_PRICE } from "../../../../lib/trainings";
import { useHref, useLang, useT } from "../../../../lib/i18n-client";
import { track } from "../../../../lib/track";
import { fill } from "../../../../lib/i18n";

type Checkout = {
  productId: string;
  productTitle: string;
  productNote: string;
  priceLabel: string;
  comparePrice?: string;
  productQuery: string;
  discountCode?: string;
};

function ThankYouContent() {
  const params = useSearchParams();
  const product = params.get("product");
  const isEbook = product === "ebook";

  const [checkout, setCheckout] = useState<Checkout | null>(null);

  // Satış olayı: hangi kanalın para getirdiğini ancak burada ölçebiliyoruz —
  // Stripe webhook'u sunucuda koştuğu için oturum ve referrer bilgisi taşımıyor.
  // Ciro gerçeği ds_orders'ta; burada amount göndermiyoruz (indirimli fiyat
  // istemciden güvenilir okunamaz), amaç yalnız kanal atfı.
  useEffect(() => {
    if (!product) return;
    const anahtar = `ds_purchase_tracked_${product}`;
    try {
      if (sessionStorage.getItem(anahtar)) return; // sayfa yenilenince tekrar sayma
      sessionStorage.setItem(anahtar, "1");
    } catch {
      /* sessionStorage yoksa yine de gönder */
    }
    track("purchase", { product_id: product });
  }, [product]);

  const lang = useLang();
  const all = useT();
  const d = all.thankYouPage;
  const href = useHref();
  const bundle = bundleText(lang);

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col">
      <div className="absolute top-0 right-1/4 -z-10 h-96 w-96 rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-10 left-0 -z-10 h-96 w-96 rounded-full bg-accent/5 blur-[120px]" />

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

      <main className="flex-1 flex items-center justify-center py-20 px-6 sm:px-8">
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center text-center">

          <div className="h-24 w-24 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center text-[#10B981] mb-8 shadow-lg shadow-[#10B981]/10">
            <CheckCircle2 className="h-12 w-12" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#10B981]/20 bg-[#10B981]/5 text-xs text-[#10B981] font-semibold uppercase tracking-wider mb-4">
            {d.badge}
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-4">
            {isEbook ? d.titleEbook : d.titleCourse}
          </h1>

          <p className="text-muted-foreground leading-relaxed text-base mb-10">
            {isEbook ? d.bodyEbook : d.bodyCourse}
          </p>

          <Link href={href(isEbook ? "/portal/ebook" : "/portal/course")} className="btn btn-lg btn-primary mb-16">
            {isEbook ? (
              <><Download className="h-4 w-4" /> {d.ctaEbook}</>
            ) : (
              <><Video className="h-4 w-4" /> {d.ctaCourse}</>
            )}
          </Link>

          {/* ─── UPSELL ─── */}
          {isEbook ? (
            <div className="w-full p-8 rounded-3xl gradient-panel border border-primary/20 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-primary/5 blur-2xl" />

              <div className="relative z-10 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <span className="text-accent text-xs font-extrabold tracking-widest uppercase">{d.upsellEyebrow}</span>
                </div>
                <h2 className="text-2xl font-extrabold mb-3 leading-tight">{d.upsellTitle}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-md mb-8">
                  {d.upsellBodyBefore}<strong className="text-foreground">{d.upsellBodyStrong}</strong>{d.upsellBodyAfter}
                </p>

                {/* Seçenek 1: bir eğitim seç $35 */}
                <div className="w-full text-left mb-8">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">{d.option1}</p>
                  <div className="grid gap-2.5">
                    {TRAININGS.map((t) => (
                      <button
                        key={t.id}
                        onClick={() =>
                          setCheckout({
                            productId: t.id,
                            productTitle: trainingText(t, lang).title,
                            productNote: d.noteDiscounted,
                            priceLabel: lang === "en" ? `$${DISCOUNTED_TRAINING_PRICE}` : `${DISCOUNTED_TRAINING_PRICE} $`,
                            comparePrice: lang === "en" ? `$${t.price}` : `${t.price} $`,
                            productQuery: t.productQuery,
                            discountCode: EBOOK_DISCOUNT_CODE,
                          })
                        }
                        className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-border/60 bg-secondary/15 hover:border-primary/30 transition-all cursor-pointer text-left"
                      >
                        <span className="text-sm font-bold text-foreground">{trainingText(t, lang).title}</span>
                        <span className="flex items-baseline gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground line-through font-mono">{lang === "en" ? `$${t.price}` : `${t.price} $`}</span>
                          <span className="text-base font-extrabold text-primary font-mono">{lang === "en" ? `$${DISCOUNTED_TRAINING_PRICE}` : `${DISCOUNTED_TRAINING_PRICE} $`}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Seçenek 2: hepsi $99 */}
                <div className="w-full text-left">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">{d.option2}</p>
                  <div className="relative rounded-2xl border border-primary/40 ring-1 ring-primary/20 bg-primary/5 p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                        <Layers className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{bundle.title}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Check className="h-3 w-3 text-primary" /> {d.bundleNote}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setCheckout({
                          productId: BUNDLE.id,
                          productTitle: bundle.title,
                          productNote: d.bundleNote,
                          priceLabel: lang === "en" ? `$${BUNDLE.price}` : `${BUNDLE.price} $`,
                          comparePrice: d.bundleOldPrice,
                          productQuery: BUNDLE.productQuery,
                        })
                      }
                      className="btn btn-primary cursor-pointer shrink-0"
                    >
                      {fill(d.bundleCta, { price: BUNDLE.price })}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full p-8 rounded-3xl gradient-panel border border-primary/20 relative overflow-hidden shadow-2xl flex flex-col items-center">
              <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-primary/5 blur-2xl" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-accent" />
                  <span className="text-accent text-xs font-extrabold tracking-widest uppercase">{d.consultEyebrow}</span>
                </div>
                <h2 className="text-2xl font-extrabold mb-4 leading-tight">
                  {d.consultTitleTop}<br />{d.consultTitleBottom}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-md mb-6">
                  {d.consultBodyBefore}
                  <strong className="text-foreground">{d.consultBodyStrong}</strong>{d.consultBodyAfter}
                </p>
                <Link href={`${href("/")}#contact`} className="btn btn-primary">
                  {d.consultCta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}

        </div>
      </main>

      <footer className="w-full border-t border-border/40 py-8 bg-black/10 mt-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>{all.footer.copyright}</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-primary transition-colors">{all.footer.privacy}</Link>
            <Link href="#" className="hover:text-primary transition-colors">{all.footer.terms}</Link>
          </div>
        </div>
      </footer>

      {checkout && (
        <CheckoutForm
          productId={checkout.productId}
          productTitle={checkout.productTitle}
          productNote={checkout.productNote}
          priceLabel={checkout.priceLabel}
          comparePrice={checkout.comparePrice}
          productQuery={checkout.productQuery}
          discountCode={checkout.discountCode}
          onClose={() => setCheckout(null)}
        />
      )}
    </div>
  );
}

function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">
      {useT().thankYouPage.loading}
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ThankYouContent />
    </Suspense>
  );
}
