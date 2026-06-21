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
    { num: "01", t: "İnovasyon Nedir? Doğru İnovasyonun Formülü", d: "'Yeni fikir' değil 'faydalı fikir': inovasyonun gerçek tanımı ve startup fikrini güçlendiren formül." },
    { num: "02", t: "Over-Engineering: Mühendis Hastalığı", d: "Kullanıcının istemediği özellikleri eklemeye devam etmek startup'ı nasıl batırır — ve aşırı mühendislikten kurtulma." },
    { num: "03", t: "MVP Nedir? En Az Özellikle Pazara Çıkmak", d: "Mükemmeliyetçilik tuzağına düşmeden, en hızlı ve en ucuz MVP ile pazara çıkma." },
    { num: "04", t: "Problem Doğrulama & Ürün-Pazar Uyumu", d: "Müşterinin gerçekten para ödediği problemi bulmak ve ürün-pazar uyumunu (product-market fit) yakalamak." },
    { num: "05", t: "Marka Konumlandırma & Rakip Analizi", d: "İnsanların sizi nasıl gördüğünü belirlemek ve rakip analiziyle pazarda doğru yeri almak." },
    { num: "06", t: "Startup'ta Ekip Kurma: CEO, COO, CFO", d: "C-level rolleri, ekipteki boşlukları doğru kişilerle doldurmak ve doğru zamanda işe almak." },
    { num: "07", t: "Nakit Akışı Yönetimi: Startup'ı Öldüren Hata", d: "'Nakit akışı öldürür' — startup'ların en çok battığı yer ve finansal modeli ayakta tutma." },
    { num: "08", t: "Şirket Değerleme Nedir? Hangi Yöntem Ne Zaman", d: "Yatırımcıya gitmeden önce şirketinin değerini kendin bil: değerleme bir hayal değil, bağlam işi." },
    { num: "09", t: "Berkus Yöntemi ile Değerleme", d: "Geliri olmayan (pre-revenue) startup'lar için melek yatırımcı Dave Berkus'un değerleme yöntemi." },
    { num: "10", t: "Puan Kartı (Scorecard) Değerleme Yöntemi", d: "Startup değerlemesinde puan kartı yöntemiyle nicel ve nitel kriterleri birlikte değerlendirmek." },
    { num: "11", t: "DCF ve Risk Faktörleri ile Değerleme", d: "İndirgenmiş Nakit Akışı (DCF) ve risk faktörü düzeltmesiyle gerçekçi değerleme hesabı." },
    { num: "12", t: "Melek Yatırımcı & Yatırımcıyla Pazarlık", d: "Melek yatırımcı kimdir, yatırım turları ve masada güçlü oturmanın pazarlık taktikleri." },
    { num: "13", t: "Yatırımcı Sunumu: 4 Dakikada Milyon Dolar", d: "Yatırım almış gerçek bir sunum üzerinden, yatırımcıyı ikna eden pitch'in püf noktaları." }
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
                "İnovasyon ve over-engineering: startup'ı batıran hataları önle",
                "Şirket değerleme: Berkus, Puan Kartı (Scorecard) ve DCF yöntemleri",
                "Melek yatırımcı bulma ve yatırımcıyla pazarlık taktikleri",
                "Yatırım almış gerçek bir yatırımcı sunumunun püf noktaları"
              ].map((feat, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm text-foreground/90">
                  <Check className="h-4.5 w-4.5 text-primary shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-end gap-3">
                <span className="text-base text-muted-foreground/70 line-through font-mono mb-1.5">12 $</span>
                <span className="text-5xl font-black text-primary font-mono leading-none tracking-tight">6 $</span>
                <span className="inline-flex items-center rounded-full bg-primary/15 text-primary border border-primary/30 text-[11px] font-extrabold px-2.5 py-1 uppercase tracking-wide mb-1.5">
                  %50 indirim
                </span>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(true)}
                className="btn btn-lg btn-primary cursor-pointer w-full sm:w-auto"
              >
                Hemen 6 $&apos;a Sahip Ol
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
                <div className="text-lg font-bold font-mono text-accent">6 $</div>
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

          <div className="flex flex-col items-center gap-3 mt-12">
            <div className="flex items-end gap-3">
              <span className="text-base text-muted-foreground/70 line-through font-mono mb-1.5">12 $</span>
              <span className="text-4xl font-black text-primary font-mono leading-none tracking-tight">6 $</span>
              <span className="inline-flex items-center rounded-full bg-primary/15 text-primary border border-primary/30 text-[11px] font-extrabold px-2.5 py-1 uppercase tracking-wide mb-1">
                %50 indirim
              </span>
            </div>
            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="btn btn-lg btn-primary cursor-pointer"
            >
              Hemen 6 $&apos;a Sahip Ol
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
          priceLabel="6 $"
          comparePrice="12 $"
          productQuery="ebook"
          onClose={() => setIsCheckoutOpen(false)}
        />
      )}

    </div>
  );
}
