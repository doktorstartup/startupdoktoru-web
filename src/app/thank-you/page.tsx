"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  ArrowRight,
  Download,
  Video,
  Calendar,
  Sparkles,
  ChevronLeft
} from "lucide-react";

function ThankYouContent() {
  const params = useSearchParams();
  const product = params.get("product"); // "ebook" | "course"

  const isEbook = product === "ebook";

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col">

      {/* Background */}
      <div className="absolute top-0 right-1/4 -z-10 h-96 w-96 rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-10 left-0 -z-10 h-96 w-96 rounded-full bg-accent/5 blur-[120px]" />

      {/* Header */}
      <header className="w-full border-b border-border/40 bg-background/50 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8">
          <Link href="/" className="flex items-center gap-2 group">
            <ChevronLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">Ana Sayfa</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-background font-bold text-sm">SD</div>
            <span className="text-base font-bold tracking-tight">STARTUP<span className="text-primary">DOKTORU</span></span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-20 px-6 sm:px-8">
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center text-center">

          {/* Success Badge */}
          <div className="h-24 w-24 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center text-[#10B981] mb-8 shadow-lg shadow-[#10B981]/10">
            <CheckCircle2 className="h-12 w-12" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#10B981]/20 bg-[#10B981]/5 text-xs text-[#10B981] font-semibold uppercase tracking-wider mb-4">
            Ödeme Başarılı
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-4">
            {isEbook
              ? "E-Kitabınız Hazır!"
              : "Eğitime Erişiminiz Açıldı!"}
          </h1>

          <p className="text-muted-foreground leading-relaxed text-base mb-10">
            {isEbook
              ? "13 Adımda Milyon Dolarlık Startup e-kitabınız başarıyla satın alındı. Aşağıdan indirmeye başlayabilirsiniz. İndirme linki aynı zamanda e-posta adresinize de iletildi."
              : "Yatırımcı Sunumu Hazırlama Eğitimi'ne tam erişiminiz açıldı. Öğrenci portalına giriş yaparak tüm modülleri izlemeye başlayabilirsiniz."}
          </p>

          {/* Primary Action Button */}
          <Link
            href={isEbook ? "/portal/ebook" : "/portal/course"}
            className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-primary px-8 text-base font-bold text-background hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:scale-[1.02] mb-16"
          >
            {isEbook ? (
              <><Download className="h-4 w-4" /> E-Kitabı İndir</>
            ) : (
              <><Video className="h-4 w-4" /> Eğitime Başla</>
            )}
          </Link>

          {/* ─── DYNAMIC UPSELL CTA ─── */}
          <div className="w-full p-8 rounded-3xl bg-gradient-to-r from-[#0F213A] to-[#0A192F] border border-primary/20 relative overflow-hidden shadow-2xl flex flex-col items-center">
            <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-primary/5 blur-2xl" />
            <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-accent/5 blur-2xl" />

            <div className="relative z-10 flex flex-col items-center">
              {isEbook ? (
                <>
                  {/* E-book buyers → upsell to Investor Training */}
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-accent" />
                    <span className="text-accent text-xs font-extrabold tracking-widest uppercase">Özel Teklifiniz Hazır</span>
                  </div>
                  <h2 className="text-2xl font-extrabold mb-4 leading-tight">
                    Şimdi Yatırımcı Sunumu<br />Eğitimine Geçin!
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-md mb-6">
                    E-kitabı satın alan girişimcilere özel: <strong className="text-foreground">5 modüllü Yatırımcı Sunumu Hazırlama Eğitimi'ni</strong> bugün sadece{" "}
                    <span className="text-primary font-bold font-mono">$39 USD</span> ile alın (normal fiyat $49 USD).
                  </p>
                  <Link
                    href="/investor-training"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-8 text-sm font-bold text-background hover:bg-primary/95 transition-all shadow-md shadow-primary/20 hover:scale-[1.01]"
                  >
                    Eğitime Geç ($39 USD — Sadece Bugün)
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </>
              ) : (
                <>
                  {/* Course buyers → upsell to Consulting */}
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4 text-accent" />
                    <span className="text-accent text-xs font-extrabold tracking-widest uppercase">Birebir Çalışma Fırsatı</span>
                  </div>
                  <h2 className="text-2xl font-extrabold mb-4 leading-tight">
                    Startup Check-Up ile<br />Büyüme Planınızı Kuralım
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-md mb-6">
                    Eğitimi tamamlayan girişimcilere özel: Eser Memişoğlu ile birebir{" "}
                    <strong className="text-foreground">Startup Check-Up ve Growth Danışmanlığı</strong> seansı için ön kayıt başlatın.
                  </p>
                  <Link
                    href="/#contact"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-8 text-sm font-bold text-background hover:bg-primary/95 transition-all shadow-md shadow-primary/20 hover:scale-[1.01]"
                  >
                    Ücretsiz Ön Kayıt Yap
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border/40 py-8 bg-black/10 mt-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>© 2026 Startup Doktoru. Tüm Hakları Saklıdır.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-primary transition-colors">Gizlilik Politikası</Link>
            <Link href="#" className="hover:text-primary transition-colors">Kullanım Şartları</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">
        Yükleniyor...
      </div>
    }>
      <ThankYouContent />
    </Suspense>
  );
}
