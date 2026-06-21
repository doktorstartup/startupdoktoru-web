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
import CheckoutForm from "../../components/CheckoutForm";
import { BunnyEmbed } from "../../components/BunnyEmbed";
import { getTraining, trainingPoster } from "../../lib/trainings";

export default function InvestorTraining() {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const modules = [
    {
      num: "Modül 01",
      title: "Yatırımcı Beklentileri & Doğru Metrikler",
      desc: "Bir yatırımcının pitch görüşmesinde zihninde döndürdüğü 5 kritik soruyu ve bu soruları hazırlamanın sistematik yolunu öğrenirsiniz.",
      icon: BarChart3,
      duration: "28 dk"
    },
    {
      num: "Modül 02",
      title: "Problem Anlatımı & Çözüm Sunumu",
      desc: "Yatırımcı psikolojisine göre tasarlanmış, acı veren problemi ve şirketinizin sunduğu sistematik çözümü ikna edici şekilde nasıl anlatırsınız.",
      icon: Sparkles,
      duration: "35 dk"
    },
    {
      num: "Modül 03",
      title: "Rakip Analizi & Konumlandırma Stratejisi",
      desc: "Yatırımcıların 'Neden Siz?' sorusuna verecekleri yanıtı en güçlü şekilde kurgulamanın konumlandırma haritası metodunu öğrenmek.",
      icon: TrendingUp,
      duration: "22 dk"
    },
    {
      num: "Modül 04",
      title: "Ekip Hikayesi & Güven Kurulumu",
      desc: "Yatırımcının bir ekipte aradığı 3 kritik niteliği ve ekibinizin bu özelliklere sahip olduğunu ispatlayan hikaye anlatım çerçevesi.",
      icon: Users,
      duration: "18 dk"
    },
    {
      num: "Modül 05",
      title: "Kritik Hatalar & Sunum Optimizasyonu",
      desc: "Gerçek yatırım görüşmelerinden derlenen en yaygın sunum hataları ve bunları ortadan kaldıracak slayt-bazlı düzeltme aksiyonları.",
      icon: Award,
      duration: "31 dk"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col">

      {/* Background blobs */}
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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-background font-bold text-sm">SD</div>
            <span className="text-base font-bold tracking-tight">STARTUP<span className="text-primary">DOKTORU</span></span>
          </div>
        </div>
      </header>

      <main className="flex-1 py-16 px-6 sm:px-8 max-w-7xl mx-auto">

        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-24">
          <div className="lg:col-span-7 flex flex-col items-start">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs text-primary font-semibold uppercase tracking-wider mb-6">
              <Video className="h-3.5 w-3.5" />
              5 Modül Video Eğitim Paketi
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold leading-[1.1] tracking-tight mb-6">
              Yatırımcı Sunumu<br />
              <span className="text-primary">Hazırlama Eğitimi</span>
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl">
              Yatırım görüşmelerinin %90'ı ilk 4 dakikada kaybedilir. Bu video eğitimde, yatırımcıların pitch'lerde aradığı 5 kritik bileşeni ve bunları nasıl hazırlayacağınızı adım adım öğreneceksiniz.
            </p>

            <div className="space-y-4 mb-10">
              {[
                "134 dakika toplam içerik, 5 özel modül",
                "Gerçek pitch deck analizi ve örnek sunum şablonları",
                "Yatırımcıların anında 'Hayır' dediği 12 kritik hata listesi",
                "Değerleme hesaplama metodolojileri ve TAM/SAM/SOM formülleri"
              ].map((feat, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm text-foreground/90">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-6">
              <button
                onClick={() => setIsCheckoutOpen(true)}
                className="btn btn-lg btn-primary cursor-pointer"
              >
                Eğitime Başla (70 USD)
                <ArrowRight className="h-4 w-4" />
              </button>
              <Link href="/ebook" className="flex flex-col hover:opacity-80 transition-opacity">
                <span className="text-sm font-bold text-accent">E-kitap alana 35 $</span>
                <span className="text-xs text-muted-foreground">6 $&apos;lık e-kitapla %50 indirim →</span>
              </Link>
            </div>
          </div>

          {/* 1 dakikalık ücretsiz önizleme videosu */}
          <div className="lg:col-span-5 flex flex-col items-center gap-3">
            <div className="w-full max-w-lg aspect-video rounded-3xl border border-border bg-[#0E1726]/40 overflow-hidden shadow-2xl">
              <BunnyEmbed
                videoId={getTraining("investor_training")?.previewVideo || ""}
                title="Yatırımcı Sunumu Eğitimi — Tanıtım"
                label="Tanıtımı İzle"
                poster={trainingPoster("investor_training")}
              />
            </div>
            <span className="text-xs text-muted-foreground">Önizleme ücretsiz · Tam eğitim 5 modül, 70 $ (e-kitap alana 35 $)</span>
          </div>
        </div>

        {/* Modules Grid */}
        <section className="border-t border-border/40 pt-20">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-accent text-sm font-bold tracking-widest uppercase mb-2 block">Müfredat</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">5 Modülde Yatırımcı Hazırlığı</h2>
            <p className="text-muted-foreground mt-4">Her modül, gerçek pitch görüşmelerinden derlenen somut örnekler ve uygulanabilir şablonlar içerir.</p>
          </div>

          <div className="space-y-4 max-w-4xl mx-auto mb-16">
            {modules.map((mod, idx) => (
              <div key={idx} className="glass-panel p-6 rounded-2xl border border-border/60 hover:border-primary/20 transition-all flex items-start gap-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <mod.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold font-mono text-primary uppercase tracking-widest">{mod.num}</span>
                    <span className="text-xs font-mono text-muted-foreground px-2 py-0.5 rounded bg-secondary/30 border border-border">{mod.duration}</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">{mod.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{mod.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="btn btn-lg btn-primary cursor-pointer"
            >
              Eğitime Hemen Başla (70 USD)
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>

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

      {/* Stripe Elements Checkout */}
      {isCheckoutOpen && (
        <CheckoutForm
          productId="investor_training"
          productTitle="Yatırımcı Sunumu Eğitimi"
          productNote="5 Modül · 134 Dakika Tam Erişim"
          priceLabel="70 $"
          productQuery="investor_training"
          onClose={() => setIsCheckoutOpen(false)}
        />
      )}

    </div>
  );
}
