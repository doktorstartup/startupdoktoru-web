"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Check,
  BookOpen,
  ArrowRight,
  ChevronLeft,
} from "lucide-react";
import CheckoutForm from "../../components/CheckoutForm";

export default function EBookLanding() {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const chapters = [
    { num: "01", t: "Startup Zihniyeti", d: "Plansız kervan kurma alışkanlığını kırıp yerine stratejik temeller atmak." },
    { num: "02", t: "Problem Doğrulama", d: "Müşterinin 'gerçekten acı çeken' ve para ödemeye hazır olduğu problemi bulmak." },
    { num: "03", t: "MVP Geliştirme", d: "Over-engineering yapmadan, en az özellik ve en az maliyetle pazara çıkma." },
    { num: "04", t: "İlk Müşteriyi Bulma", d: "Hiç reklam bütçesi harcamadan ilk 10 ve 100 müşteriye ulaşma taktikleri." },
    { num: "05", t: "Ürün-Pazar Uyumu", d: "Ürününüzün pazarla tam örtüştüğünü gösteren matematiksel metrikler." },
    { num: "06", t: "Büyüme (Growth) Sistemleri", d: "Düşük bütçelerle katlanarak büyümeyi sağlayacak büyüme motorları." },
    { num: "07", t: "Funnel (Huni) Kurulumu", d: "Ziyaretçiyi adım adım sadık müşteriye dönüştüren otomasyonlar." },
    { num: "08", t: "KPI ve Görev Yönetimi", d: "Ekip içi kaosu engelleyecek, gerçekçi ve ölçülebilir KPI çerçeveleri." },
    { num: "09", t: "Operasyon Sistemleri", d: "Kurucudan bağımsız çalışan, kendi kendini yöneten iş süreçleri." },
    { num: "10", t: "Delegasyon Metotları", d: "Hangi görevi, kime, ne zaman ve nasıl devredeceğinizin altın kuralları." },
    { num: "11", t: "Yapay Zeka Kullanımı", d: "Gündelik iş süreçlerinizi AI ile 10 kat hızlandırma yöntemleri." },
    { num: "12", t: "Yatırımcı Hazırlığı", d: "Değerleme hesapları ve yatırımcının karşısına çıkma kontrol listeleri." },
    { num: "13", t: "Ölçeklenme", d: "Local bir startup'tan global bir işletmeye geçiş yolları." }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-primary relative overflow-hidden flex flex-col justify-between">
      
      {/* Background gradients */}
      <div className="absolute top-0 right-1/4 -z-10 h-96 w-96 rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-10 left-1/4 -z-10 h-96 w-96 rounded-full bg-accent/5 blur-[120px]" />

      {/* Header */}
      <header className="w-full border-b border-border/40 bg-background/50 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8">
          <Link href="/" className="flex items-center gap-2 group">
            <ChevronLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">Ana Sayfa</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-background font-bold text-sm">
              SD
            </div>
            <span className="text-base font-bold tracking-tight text-foreground">
              STARTUP<span className="text-primary">DOKTORU</span>
            </span>
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
              Milyon Dolarlık Startup Rehberi
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold leading-[1.1] tracking-tight mb-8">
              13 Adımda Milyon Dolarlık Startup
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl">
              10 yıllık startup kuruculuğu, inovasyon ve yatırım yönetimi tecrübesinin damıtılmış tek kitabı. Girişiminizi bir 'kaos yığını' olmaktan çıkarıp, otomatik işleyen kârlı bir büyüme makinesine dönüştürün.
            </p>

            <div className="space-y-4 mb-8">
              {[
                "13 kritik adımda otonom startup kurma rehberi",
                "Plansız büyüme ve over-engineering engelleme formülleri",
                "Hiç reklam harcamadan ilk 100 müşteriye ulaşma taktikleri",
                "Supabase veritabanıyla CRM & LMS entegrasyon şablonları"
              ].map((feat, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm text-foreground/90">
                  <Check className="h-4.5 w-4.5 text-primary shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-6">
              <button 
                onClick={() => setIsCheckoutOpen(true)}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-primary px-8 text-base font-bold text-background hover:bg-primary/95 transition-all shadow-lg shadow-primary/20 hover:scale-[1.01] cursor-pointer"
              >
                E-Kitabı Edin ($6.00 USD)
                <ArrowRight className="h-4 w-4" />
              </button>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground line-through">$12.00 USD</span>
                <span className="text-sm font-bold text-accent font-mono">%50 İndirimli Sürüm</span>
              </div>
            </div>
          </div>

          {/* Book Mockup Frame */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative h-96 w-72 rounded-2xl bg-gradient-to-br from-[#0F213A] to-background border border-primary/20 shadow-2xl p-8 flex flex-col justify-between overflow-hidden group">
              <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-primary/10 blur-2xl" />
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-primary font-mono tracking-widest uppercase">E-Book</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent">PDF Sürüm</span>
              </div>
              <div className="my-8">
                <h3 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground font-sans">
                  13 Adımda<br />
                  <span className="text-primary font-bold">Milyon Dolarlık</span><br />
                  Startup
                </h3>
                <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                  Plansız kervan kurmaya son veren dijital el kitabı.
                </p>
              </div>
              <div className="flex justify-between items-center border-t border-border/40 pt-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">
                    SD
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Eser Memişoğlu</span>
                </div>
                <div className="text-lg font-bold font-mono text-accent">$6.00</div>
              </div>
            </div>
          </div>

        </div>

        {/* Chapters Section */}
        <section className="border-t border-border/40 pt-20">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-accent text-sm font-bold tracking-widest uppercase mb-2 block">İçindekiler</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Kitap Bölümleri ve Müfredat</h2>
            <p className="text-muted-foreground mt-4">Kitap boyunca derinlemesine inceleyeceğimiz ve girişiminizde uygulayacağınız 13 bölüm:</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chapters.map((ch, idx) => (
              <div key={idx} className="glass-panel p-8 rounded-2xl border border-border/60 hover:border-primary/20 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 h-16 w-16 bg-primary/5 rounded-full blur-xl" />
                <span className="text-xs font-mono font-bold text-primary">{ch.num}</span>
                <h3 className="text-xl font-bold mt-2 mb-3">{ch.t}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{ch.d}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-12">
            <button 
              onClick={() => setIsCheckoutOpen(true)}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-primary px-8 text-base font-bold text-background hover:bg-primary/95 transition-all shadow-lg shadow-primary/20 cursor-pointer"
            >
              Kitabı Hemen Satın Al ($6.00 USD)
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border/40 py-8 bg-black/10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>© 2026 Startup Doktoru. Tüm Hakları Saklıdır.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-primary transition-colors">Gizlilik Politikası</Link>
            <Link href="#" className="hover:text-primary transition-colors">Kullanım Şartları</Link>
          </div>
        </div>
      </footer>

      {/* ─── STRIPE ELEMENTS CHECKOUT ─── */}
      {isCheckoutOpen && (
        <CheckoutForm
          productId="ebook_13_steps"
          productTitle="13 Adımda Milyon Dolarlık Startup"
          productNote="Anında PDF İndirme Erişimi"
          priceLabel="$6.00"
          productQuery="ebook"
          onClose={() => setIsCheckoutOpen(false)}
        />
      )}

    </div>
  );
}
