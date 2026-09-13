"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowRight, 
  BookOpen, 
  HelpCircle, 
  MessageSquare, 
  Play,
  ShieldCheck,
  TrendingUp, 
  Users, 
  ChevronDown, 
  DollarSign, 
  FileText,
  AlertTriangle,
  Award
} from "lucide-react";
import { AIDrawer } from "../../../components/AIDrawer";
import { SiteHeader } from "../../../components/SiteHeader";
import { SiteFooter } from "../../../components/SiteFooter";
import { BunnyEmbed } from "../../../components/BunnyEmbed";
import { VcNetwork } from "../../../components/VcNetwork";
import { Testimonials } from "../../../components/Testimonials";
import { KitapBolumu } from "../../../components/KitapBolumu";
import { getTraining, trainingPoster } from "../../../lib/trainings";
import { useHref, useLang, useT } from "../../../lib/i18n-client";

export default function Home() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const t = useT().home;
  const href = useHref();
  // Kitap Türkçe: /en tarafında e-kitap satılmıyor, fiyat da gösterilmiyor.
  const en = useLang() === "en";

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = t.faqSection.items;

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30 selection:text-primary pb-20 md:pb-0">
      
      {/* ─── SLEEK HEADER ─── */}
      <SiteHeader onOpenAi={() => setIsAiOpen(true)} />

      {/* ─── HERO SECTION ─── */}
      <section className="relative pt-24 pb-20 md:pt-36 md:pb-28 container-page">
        <div className="absolute top-0 left-1/4 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute top-20 right-1/4 -z-10 h-72 w-72 rounded-full bg-accent/5 blur-[120px]" />

        <div className="text-center max-w-4xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs text-primary font-semibold uppercase tracking-wider mb-6">
            <Award className="h-3.5 w-3.5" />
            {t.hero.badge}
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-8 font-sans">
            {t.hero.titleLead}<br />
            <span className="bg-gradient-to-r from-primary via-[#38BDF8] to-accent bg-clip-text text-transparent">
              {t.hero.titleHighlight}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed mb-10">
            {t.hero.subtitle}
          </p>

          {/* Primary CTA + risk reducer, e-book secondary */}
          <div className="flex flex-col items-center gap-3 w-full sm:w-auto">
            <Link href={href("/free-training")} className="btn btn-lg btn-primary w-full sm:w-auto">
              <Play className="h-4 w-4 fill-current" />
              {t.hero.ctaFree}
            </Link>
            <p className="text-sm md:text-base text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              {t.hero.riskReducer}
            </p>
            <Link
              href={href("/ebook")}
              className="text-base md:text-lg font-semibold text-foreground/80 hover:text-primary transition-colors inline-flex items-center gap-2 mt-2"
            >
              <BookOpen className="h-5 w-5 text-primary" />
              {t.hero.ebookLink}
              {!en && (
                <>
                  {" "}
                  <span className="text-muted-foreground line-through">{t.ladder.steps[1].oldPrice}</span>{" "}
                  <span className="text-primary font-bold">{t.ladder.steps[1].price}</span>
                </>
              )}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Social proof strip */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-center">
            {t.hero.stats.map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <div className="h-8 w-px bg-border/40 hidden sm:block" />}
                <div>
                  <p className="text-2xl font-extrabold font-mono text-primary">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{s.label}</p>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PROBLEM SECTION ─── */}
      <section id="problem" className="py-20 md:py-28 bg-black/30 border-y border-border/10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-accent text-sm font-bold tracking-widest uppercase mb-2 block">{t.problem.eyebrow}</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">{t.problem.title}</h2>
            <p className="text-muted-foreground mt-4">{t.problem.lead}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.problem.items.map((p, i) => (
              <div key={i} className="glass-panel p-8 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-red-500/5 blur-xl group-hover:bg-red-500/10 transition-all duration-300" />
                <div className="h-12 w-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-6">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ÖĞRENCİ MEMNUNİYET VİDEOLARI — ikna önce, teklif sonra ─── */}
      <Testimonials />

      {/* ─── VALUE LADDER (SOLUTION) ─── */}
      <section id="value-ladder" className="py-20 md:py-32 max-w-7xl mx-auto px-6 sm:px-8">
        <div className="max-w-3xl mx-auto text-center mb-20">
          <span className="text-primary text-sm font-bold tracking-widest uppercase mb-2 block">{t.ladder.eyebrow}</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">{t.ladder.title}</h2>
          <p className="text-muted-foreground mt-4">{t.ladder.lead}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[
            { ...t.ladder.steps[0], link: "/free-training", highlight: false },
            { ...t.ladder.steps[1], link: "/ebook", highlight: true },
            { ...t.ladder.steps[2], link: "/egitimler", highlight: false },
          ].map((item, idx) => (
            <div 
              key={idx} 
              className={`glass-panel p-8 rounded-2xl flex flex-col justify-between relative overflow-hidden ${
                item.highlight ? "border-primary/40 ring-1 ring-primary/20 scale-[1.02]" : "border-border/40"
              }`}
            >
              {item.highlight && (
                <div className="absolute top-0 right-0 bg-primary text-background font-bold text-[10px] px-3 py-1 rounded-bl-lg tracking-wider uppercase">
                  {t.ladder.popular}
                </div>
              )}
              <div>
                <span className="text-primary/70 text-xs font-mono font-bold tracking-widest">{item.step}</span>
                <h3 className="text-2xl font-bold mt-2 mb-4">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">{item.desc}</p>
              </div>
              <div>
                <div className="mb-6">
                  {item.oldPrice && (
                    <span className="inline-block font-sans text-[11px] font-extrabold text-primary bg-primary/15 border border-primary/30 rounded-full px-3 py-1 uppercase tracking-wide mb-3">
                      {t.ladder.discountBadge}
                    </span>
                  )}
                  <div className="font-mono flex items-baseline gap-2">
                    {item.oldPrice && (
                      <span className="text-lg text-muted-foreground line-through">{item.oldPrice}</span>
                    )}
                    <span className="text-2xl font-extrabold text-foreground">{item.price}</span>
                  </div>
                </div>
                <Link
                  href={href(item.link)}
                  className={`btn w-full ${item.highlight ? "btn-primary" : "btn-secondary"}`}
                >
                  {item.btnText}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── E-BOOK CONTEXT SECTION ─── */}
      <section id="ebook" className="py-20 md:py-32 bg-black/40 border-y border-border/10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 flex flex-col items-start">
            <span className="text-accent text-sm font-bold tracking-widest uppercase mb-2">{t.ebookSection.eyebrow}</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-6">
              {t.ebookSection.title}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8 text-base">
              {t.ebookSection.body}
            </p>

            <div className="grid grid-cols-2 gap-4 w-full mb-8">
              {t.ebookSection.chapters.map((ch, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                  <span>{ch}</span>
                </div>
              ))}
            </div>

            <Link href={href("/ebook")} className="btn btn-lg btn-primary">
              {t.ebookSection.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="lg:col-span-6 flex justify-center">
            {/* Basılı kitabın gerçek kapağı — dijital sürüm aynı kitap */}
            <div className="relative">
              <Image
                src="/kitap-kapak.webp"
                alt={`${t.ebookSection.title} — kitap kapağı`}
                width={1000}
                height={1445}
                sizes="(max-width: 640px) 256px, 288px"
                className="w-64 sm:w-72 h-auto rounded-lg shadow-2xl ring-1 ring-border/40"
              />
              <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-1 rounded-full bg-background/90 border border-accent/30 text-accent uppercase tracking-widest backdrop-blur-sm">
                {t.ebookSection.cardTag}
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* ─── BASILI KİTAP + E-KİTAPLA FARKI (kitap girilmemişse gizli, yalnız TR) ─── */}
      <KitapBolumu />

      {/* ─── INVESTOR PITCH TRAINING SECTION ─── */}
      <section id="training" className="py-20 md:py-32 max-w-7xl mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 order-2 lg:order-1 flex justify-center w-full">
            {/* 1 dakikalık önizleme videosu */}
            <div className="w-full max-w-lg aspect-video rounded-2xl border border-border bg-[#0E1726]/40 overflow-hidden shadow-2xl">
              <BunnyEmbed
                videoId={getTraining("investor_training")?.previewVideo || ""}
                title={t.trainingSection.videoTitle}
                label={t.trainingSection.videoLabel}
                poster={{
                  badge: t.trainingSection.posterBadge,
                  title: t.trainingSection.posterTitle,
                  subtitle: t.trainingSection.posterSubtitle,
                  accent: "cyan",
                }}
              />
            </div>
          </div>

          <div className="lg:col-span-6 order-1 lg:order-2 flex flex-col items-start">
            <span className="text-primary text-sm font-bold tracking-widest uppercase mb-2">{t.trainingSection.eyebrow}</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-6">
              {t.trainingSection.title}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8 text-base">
              {t.trainingSection.bodyBefore}<strong className="text-foreground">{t.trainingSection.bodyStrong}</strong>{t.trainingSection.bodyAfter}
            </p>

            <div className="space-y-4 mb-8 w-full">
              {t.trainingSection.modules.map((mod, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-secondary/15 hover:border-primary/25 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold font-mono text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/25">{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-sm font-bold text-foreground">{mod}</span>
                  </div>
                  <Play className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Link href={href("/investor-training")} className="btn btn-lg btn-primary">
                {t.trainingSection.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <p className="text-xs text-muted-foreground mt-3">{t.trainingSection.note}</p>
          </div>
        </div>
      </section>

      {/* ─── ABOUT FOUNDER SECTION ─── */}
      <section id="about" className="py-20 md:py-32 bg-black/40 border-y border-border/10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 flex flex-col items-start">
            <span className="text-accent text-sm font-bold tracking-widest uppercase mb-2">{t.about.eyebrow}</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-6">{t.about.name}</h2>
            <p className="text-muted-foreground leading-relaxed mb-6 text-base">
              {t.about.p1}
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8 text-base">
              {t.about.p2}
            </p>
            
            <div className="flex items-center gap-6">
              {t.about.stats.map((st, i) => (
                <React.Fragment key={st.label}>
                  {i > 0 && <div className="h-10 w-px bg-border/40" />}
                  <div>
                    <p className="text-3xl font-extrabold font-mono text-primary">{st.value}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">{st.label}</p>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col items-center gap-6">
            {/* Founder portrait */}
            <div className="h-96 w-80 rounded-3xl gradient-panel border border-border shadow-2xl relative overflow-hidden flex flex-col justify-end p-8 group">
              <Image
                src="/eser-memisoglu.png"
                alt={t.about.portraitAlt}
                fill
                sizes="320px"
                className="object-cover object-top z-0 transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent z-10" />

              <div className="relative z-20">
                <span className="text-xs font-extrabold text-primary font-mono tracking-widest uppercase block mb-1">{t.about.role}</span>
                <h4 className="text-2xl font-bold text-foreground">{t.about.name}</h4>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {t.about.roleNote}
                </p>
              </div>
            </div>

            {/* Kişisel söz — fotoğrafın altında */}
            <figure className="max-w-80 text-center">
              <blockquote className="text-lg font-semibold italic text-foreground/90 leading-snug">
                <span className="text-primary">“</span>{t.about.quote}<span className="text-primary">”</span>
              </blockquote>
              <figcaption className="mt-2 text-[11px] uppercase tracking-widest text-muted-foreground">
                {t.about.quoteCaption}
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ─── VC NETWORK / GÜVENİLİR KAYNAK (görsel varsa) ─── */}
      <VcNetwork />

      {/* ─── FAQ SECTION ─── */}
      <section className="py-20 md:py-32 max-w-4xl mx-auto px-6 sm:px-8">
        <div className="text-center mb-16">
          <span className="text-primary text-sm font-bold tracking-widest uppercase mb-2 block">{t.faqSection.eyebrow}</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">{t.faqSection.title}</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="glass-panel rounded-2xl border border-border/60 overflow-hidden transition-all duration-300">
              <button 
                onClick={() => toggleFaq(i)}
                className="flex items-center justify-between w-full p-6 text-left font-bold text-lg text-foreground hover:text-primary transition-colors focus:outline-none"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${activeFaq === i ? "rotate-180 text-primary" : ""}`} />
              </button>
              
              <div className={`grid transition-all duration-300 ease-in-out ${activeFaq === i ? "grid-rows-[1fr] border-t border-border/40" : "grid-rows-[0fr]"}`}>
                <div className="overflow-hidden">
                  <p className="p-6 text-sm leading-relaxed text-muted-foreground bg-[#0E1726]/10">
                    {faq.a}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FINAL CTA SECTION ─── */}
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-6 sm:px-8 mb-20">
        <div className="relative rounded-3xl bg-gradient-to-r from-[#0F213A] to-[#0A192F] border border-primary/20 shadow-2xl p-12 md:p-20 text-center overflow-hidden flex flex-col items-center">
          <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl -z-10" />
          <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-accent/5 blur-3xl -z-10" />
          
          <span className="text-accent text-xs font-extrabold tracking-widest uppercase mb-3 px-3 py-1 rounded-full border border-accent/20 bg-accent/5">
            {t.finalCta.badge}
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight max-w-3xl mb-8">
            {t.finalCta.title}
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl leading-relaxed mb-12">
            {t.finalCta.body}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link href={href("/free-training")} className="btn btn-lg btn-primary w-full sm:w-auto">
              {t.finalCta.primary}
            </Link>
            <Link href={href("/ebook")} className="btn btn-lg btn-secondary w-full sm:w-auto">
              {t.finalCta.secondary}
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <SiteFooter />

      {/* ─── MOBILE STICKY BUY BAR ─── */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border/40 bg-background/90 backdrop-blur-md px-4 py-3 flex items-center gap-3">
        <div className="flex-1 leading-tight">
          <p className="text-sm font-bold text-foreground">{t.stickyBar.title}</p>
          <p className="text-xs text-muted-foreground">
            {t.stickyBar.meta}
            {!en && (
              <>
                {" "}
                <span className="line-through">{t.ladder.steps[1].oldPrice}</span>{" "}
                <span className="text-primary font-bold">{t.ladder.steps[1].price}</span>
              </>
            )}
          </p>
        </div>
        <Link href={href("/ebook")} className="btn btn-primary shrink-0">
          {t.stickyBar.cta}
        </Link>
      </div>

      {/* ─── AI FLOATING MENTOR DRAWER ─── */}
      <AIDrawer isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />

    </div>
  );
}
