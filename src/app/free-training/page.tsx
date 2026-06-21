"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Play, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Mail, 
  Phone, 
  User, 
  Building2, 
  Rocket, 
  Award,
  Lock,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { track } from "../../lib/track";
import { YouTubeEmbed } from "../../components/YouTubeEmbed";
import { VIDEOS } from "../../lib/videos";
import { useMember } from "../../lib/member";

export default function FreeTraining() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    stage: "Idea" // Idea, MVP, Pre-Seed, Seed, Growth
  });
  
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Giriş yapmış üyeye formu sorma — doğrudan videoyu göster.
  const { member, login } = useMember();
  useEffect(() => {
    if (member) setIsRegistered(true);
  }, [member]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      // 1. Safe insertion to Supabase public.ds_leads table
      const { error } = await supabase
        .from("ds_leads")
        .insert([
          {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            company: formData.company,
            startup_stage: formData.stage,
            source: "free_training",
            status: "NEW",
            score: 10, // Lead score +10 for registering
            stage: "FREE_TRAINING"
          }
        ]);

      if (error) {
        // If Supabase keys are placeholders or have database config issues, fallback gracefully
        console.warn("Supabase insertion fallback initiated:", error.message);
      }

      // 2. Funnel olayı: lead + karşılama maili (Resend varsa)
      track("lead", { email: formData.email });
      fetch("/api/welcome", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: formData.email, name: formData.name }) }).catch(() => {});

      // 3. Üye oturumu aç (portalda ücretsiz eğitim görünür) + videoyu göster
      await login(formData.email);
      setIsRegistered(true);
    } catch (err) {
      console.error("Lead submission error:", err);
      // Fallback in case of network issues
      setIsRegistered(true);
    } finally {
      setIsLoading(false);
    }
  };

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
      <main className="flex-1 flex items-center justify-center py-16 px-6 sm:px-8">
        <div className="w-full max-w-4xl mx-auto">
          
          {!isRegistered ? (
            /* ─── PHASE 1: LEAD COLLECTION FORM ─── */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Marketing side */}
              <div className="lg:col-span-6 flex flex-col items-start text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs text-primary font-semibold uppercase tracking-wider mb-6">
                  <Award className="h-3.5 w-3.5" />
                  Ücretsiz Video Eğitim
                </div>
                
                <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight tracking-tight mb-6">
                  Startup'ların Yatırımcı Karşısında Yaptığı <br />
                  <span className="text-primary">7 Ölümcül Hata</span>
                </h1>
                
                <p className="text-muted-foreground leading-relaxed mb-8 text-base">
                  Yatırım görüşmelerinin %90'ı ilk 4 dakikada kaybedilir. Bu pratik sunumda, Eser Memişoğlu'nun 10 yıllık tecrübesiyle derlediği ve yatırımcıların anında 'Red' vermesine sebep olan hataları örneklerle öğreneceksiniz.
                </p>

                <div className="space-y-4">
                  {[
                    "Sunum slaytlarında yapılan en büyük yapısal hatalar",
                    "Doğru pazar büyüklüğü (TAM, SAM, SOM) hesaplama yöntemi",
                    "Yatırımcının duymak istediği kritik finansal büyüme dili",
                    "AI entegrasyonu ve ölçeklenme stratejisi vaatleri"
                  ].map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm text-foreground/90">
                      <CheckCircle2 className="h-4.5 w-4.5 text-primary shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form side */}
              <div className="lg:col-span-6">
                <div className="glass-panel p-8 rounded-3xl border border-border/80 relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />
                  
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-bold mb-2">Eğitime Hemen Katılın</h3>
                    <p className="text-xs text-muted-foreground">Eğitimi izlemek için aşağıdaki formu doldurmanız yeterlidir.</p>
                  </div>

                  {errorMsg && (
                    <div className="p-4 mb-6 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-500">
                      {errorMsg}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div className="relative flex items-center">
                      <User className="absolute left-4 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Adınız Soyadınız"
                        className="w-full h-12 pl-12 pr-4 rounded-xl bg-background border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20 text-sm outline-none transition-all"
                      />
                    </div>

                    {/* Email */}
                    <div className="relative flex items-center">
                      <Mail className="absolute left-4 h-4 w-4 text-muted-foreground" />
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="E-posta Adresiniz"
                        className="w-full h-12 pl-12 pr-4 rounded-xl bg-background border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20 text-sm outline-none transition-all"
                      />
                    </div>

                    {/* Phone */}
                    <div className="relative flex items-center">
                      <Phone className="absolute left-4 h-4 w-4 text-muted-foreground" />
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Telefon Numaranız (WhatsApp)"
                        className="w-full h-12 pl-12 pr-4 rounded-xl bg-background border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20 text-sm outline-none transition-all"
                      />
                    </div>

                    {/* Company */}
                    <div className="relative flex items-center">
                      <Building2 className="absolute left-4 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        name="company"
                        required
                        value={formData.company}
                        onChange={handleChange}
                        placeholder="Şirket / Proje Adı"
                        className="w-full h-12 pl-12 pr-4 rounded-xl bg-background border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20 text-sm outline-none transition-all"
                      />
                    </div>

                    {/* Startup Stage */}
                    <div className="relative flex items-center">
                      <Rocket className="absolute left-4 h-4 w-4 text-muted-foreground" />
                      <select
                        name="stage"
                        value={formData.stage}
                        onChange={handleChange}
                        className="w-full h-12 pl-12 pr-4 rounded-xl bg-background border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20 text-sm outline-none transition-all appearance-none cursor-pointer text-muted-foreground"
                      >
                        <option value="Idea">Fikir Aşaması (Idea)</option>
                        <option value="MVP">Prototip / MVP</option>
                        <option value="Pre-Seed">İlk Satışlar (Pre-Seed)</option>
                        <option value="Seed">Yatırıma Hazırlık (Seed)</option>
                        <option value="Growth">Ölçeklenme (Growth)</option>
                      </select>
                      <div className="pointer-events-none absolute right-4 flex items-center text-muted-foreground">
                        <ChevronRight className="h-4 w-4 rotate-90" />
                      </div>
                    </div>

                    {/* WhatsApp Consent */}
                    <label className="flex items-start gap-3 text-xs text-muted-foreground select-none cursor-pointer">
                      <input type="checkbox" required className="mt-0.5 accent-primary h-4 w-4 rounded border-border" />
                      <span>Eğitim linkleri, haftalık büyüme tüyoları ve WhatsApp bilgilendirmelerini kabul ediyorum.</span>
                    </label>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 rounded-xl bg-primary text-background font-bold hover:bg-primary/95 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/20"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <Lock className="h-4 w-4 animate-pulse" />
                          Kaydediliyor...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Eğitimi Kilidini Aç
                          <Play className="h-3 w-3 fill-current" />
                        </span>
                      )}
                    </button>
                  </form>
                </div>
              </div>

            </div>
          ) : (
            /* ─── PHASE 2: VIDEO PLAYER ─── */
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
              
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#10B981]/20 bg-[#10B981]/5 text-xs text-[#10B981] font-semibold uppercase tracking-wider mb-6">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Erişim Sağlandı
              </div>
              
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-8">
                Startup'ların Yatırımcı Karşısında Yaptığı 7 Ölümcül Hata
              </h2>

              {/* 12 DAKİKALIK ÜCRETSİZ EĞİTİM VİDEOSU */}
              <div className="w-full aspect-video rounded-3xl border border-border/80 bg-[#0E1726]/40 overflow-hidden shadow-2xl mb-12">
                <YouTubeEmbed
                  videoId={VIDEOS.freeTraining12min}
                  title="12 Dakikalık Ücretsiz Startup Eğitimi"
                  label="Eğitimi Başlat (12 Dakika)"
                  poster={{
                    badge: "Ücretsiz · 12 Dakika",
                    title: "Yatırımcı Karşısında Yapılan 7 Ölümcül Hata",
                    subtitle: "İzlemek için tıkla — kredi kartı gerekmez",
                    accent: "emerald",
                  }}
                />
              </div>

              {/* DYNAMIC FUNNEL UPSELL CTA PANEL */}
              <div className="w-full p-8 rounded-2xl bg-gradient-to-r from-[#0F213A] to-[#0A192F] border border-primary/20 relative overflow-hidden flex flex-col items-center shadow-lg">
                <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-primary/5 blur-2xl -z-10" />
                <span className="text-accent text-[10px] font-extrabold tracking-widest uppercase mb-2">BİR SONRAKİ ADIM</span>
                <h3 className="text-xl font-bold mb-4">Milyon dolarlık startup kurmanın tüm şifrelerini çözün!</h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-lg mb-6">
                  Check-up, MVP geliştirme, funnel kurulumu ve büyüme otomasyonlarını içeren <strong>13 Adımda Milyon Dolarlık Startup E-Kitabımızı</strong> edinin.
                </p>
                <Link 
                  href="/ebook" 
                  className="btn btn-primary"
                >
                  E-Kitabı Edin (6 $)
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

            </div>
          )}

        </div>
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

    </div>
  );
}
