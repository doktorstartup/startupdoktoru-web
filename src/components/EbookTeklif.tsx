"use client";

import { useState } from "react";
import { BookOpen, ArrowRight } from "lucide-react";
import CheckoutForm from "./CheckoutForm";
import { useLang, useT } from "../lib/i18n-client";

// 6 $'lık kitap teklifi — ödeme formu AYNI SAYFADA açılır (/ebook'a ikinci bir sıçrama yok).
// Ücretsiz akışların sonuna konur: Eylül'de bu adımlar yatırımcı profiline çevrilince
// siteden ödeme denemesi 8 haftada 1'e düştü (2026-11-21 incelemesi).
// Kitap Türkçe: /en tarafında satış yok → hiç görünmez.
export function EbookTeklif({ baslik, aciklama }: { baslik?: string; aciklama?: string }) {
  const all = useT();
  const t = all.ebookPage;
  const [acik, setAcik] = useState(false);
  if (useLang() === "en") return null;

  return (
    <div className="w-full rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/[0.10] via-[#0F213A] to-primary/[0.05] p-6 sm:p-8 flex flex-col items-center text-center shadow-lg">
      <div className="h-12 w-12 rounded-2xl bg-accent/15 border border-accent/25 flex items-center justify-center text-accent mb-3">
        <BookOpen className="h-6 w-6" />
      </div>
      <span className="text-accent text-[10px] font-extrabold tracking-widest uppercase mb-2">Bir sonraki adım</span>
      <h3 className="text-xl font-bold mb-2">{baslik ?? t.title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-lg mb-5">
        {aciklama ?? "Check-up, MVP geliştirme, funnel kurulumu ve büyüme otomasyonları — milyon dolarlık startup'ın yol haritası tek kitapta."}
      </p>
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-sm text-muted-foreground line-through font-mono">{all.prices.ebookOld}</span>
        <span className="text-3xl font-extrabold font-mono text-primary">{all.prices.ebookNew}</span>
      </div>
      <button type="button" onClick={() => setAcik(true)} className="btn btn-primary btn-lg cursor-pointer">
        {t.cta} <ArrowRight className="h-5 w-5" />
      </button>

      {acik && (
        <CheckoutForm
          productId="ebook_13_steps"
          productTitle={t.title}
          productNote={t.checkoutNote}
          priceLabel={all.prices.ebookNew}
          comparePrice={all.prices.ebookOld}
          productQuery="ebook"
          onClose={() => setAcik(false)}
        />
      )}
    </div>
  );
}
