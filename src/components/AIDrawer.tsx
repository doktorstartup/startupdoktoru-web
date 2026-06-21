"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Send, Sparkles, Loader2, Zap, ChevronRight, ArrowRight } from "lucide-react";
import { supabase } from "../lib/supabase";
import { track } from "../lib/track";
import { useMember } from "../lib/member";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const AI_LEAD_KEY = "ds_ai_lead";

export function AIDrawer({ isOpen, onClose }: AIDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Merhaba! Ben Startup Doktoru AI Mentörü. Girişiminizin fikrini doğrulamak, değerleme hazırlığı yapmak veya büyüme hunileri (funnel) kurmak konusunda size yol göstermeye hazırım.\n\nNasıl bir girişim projesi üzerinde çalışıyorsunuz? Fikrinizi bana kısaca anlatın, hemen analiz edelim."
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Bilgi kapısı: sohbetten önce ad / mail / telefon / proje adı al.
  const [unlocked, setUnlocked] = useState(false);
  const [lead, setLead] = useState({ name: "", email: "", phone: "", project: "" });
  const [gateLoading, setGateLoading] = useState(false);

  // Giriş yapmış üyeden zaten bilgi aldık → tekrar sorma.
  const { member } = useMember();

  // Üyeyse ya da daha önce bilgi vermişse tekrar sorma.
  useEffect(() => {
    if (member) {
      setUnlocked(true);
      return;
    }
    try {
      if (localStorage.getItem(AI_LEAD_KEY)) setUnlocked(true);
    } catch {
      /* localStorage yoksa kapı açık kalır */
    }
  }, [member]);

  const handleGateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGateLoading(true);
    try {
      await supabase.from("ds_leads").insert([
        {
          name: lead.name,
          email: lead.email,
          phone: lead.phone || null,
          company: lead.project || null, // projenin gerçek/şimdiki takma adı
          source: "ai_mentor",
          status: "NEW",
          score: 15,
          stage: "NEW_LEAD",
          tags: ["ai_mentor"],
        },
      ]);
      track("lead", { email: lead.email });
      // Karşılama e-postası (Resend anahtarı varsa) — fire-and-forget
      fetch("/api/welcome", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: lead.email, name: lead.name }) }).catch(() => {});
    } catch {
      /* hata olsa bile sohbeti engelleme */
    } finally {
      try {
        localStorage.setItem(AI_LEAD_KEY, lead.email);
      } catch {
        /* sessizce geç */
      }
      setGateLoading(false);
      setUnlocked(true);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      // Call the server-side API proxy to keep API keys secure!
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMessage }].slice(-6) // Send last few messages for context
        }),
      });

      if (!res.ok) {
        throw new Error("API hatası");
      }

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (error) {
      console.error("AI Error:", error);
      // Simulated/Fallback high-quality response if API keys are missing or offline
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Girişim fikrinizi ('${userMessage.substring(0, 40)}...') çok değerli buldum. \n\nSistem kurmadan büyümeye çalışmak en büyük hatadır. Startup Doktoru olarak bu fikri hayata geçirirken takip etmeniz gereken ilk 3 kritik adımı paylaşıyorum:\n\n1. **Problem Doğrulama:** Potansiyel 10 müşteri adayınızla görüşerek bu sorunun onlar için 'gerçekten acı veren' bir sorun olup olmadığını test edin.\n2. **MVP Geliştirme:** Fikrinizdeki tüm gereksiz özellikleri çıkarıp, sadece ana vaadi sunan en basit sürümü (MVP) kurgulayın.\n3. **Değer Merdiveni:** Müşteriye hemen büyük satışı yapmak yerine, önce ücretsiz bir eğitim veya doküman (6 $'lık E-Book gibi) ile güven kazanın.\n\nE-Kitabımızı indirerek veya ders portalımıza katılarak bu adımların detaylı rehberlerine ulaşabilirsiniz. Sorunuz varsa yanıtlamaya devam edebilirim!`
          }
        ]);
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity duration-300">
      {/* Click outside backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Floating Drawer Panel */}
      <div className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-border bg-[#050B14] shadow-2xl transition-all duration-300 ease-in-out md:max-w-lg">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-border/80 px-6 py-5 bg-[#0E1726]/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-foreground flex items-center gap-1.5 text-base">
                AI Mentor Asistanı
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/15 border border-accent/20 text-accent uppercase tracking-widest">PRO</span>
              </h3>
              <p className="text-xs text-muted-foreground">Eser Memişoğlu Büyüme & Yatırım Modeli</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!unlocked ? (
          /* Bilgi kapısı — sohbetten önce iletişim + proje bilgisi */
          <form onSubmit={handleGateSubmit} className="flex-1 overflow-y-auto px-6 py-8 flex flex-col">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-4">
              <Sparkles className="h-6 w-6" />
            </div>
            <h4 className="text-lg font-extrabold tracking-tight mb-1">Mentöre bağlanmadan önce</h4>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Sana ve projene özel yanıtlar verebilmem için kısa birkaç bilgi. Bilgilerin sadece sana daha iyi yardımcı olmak için kullanılır.
            </p>

            <div className="space-y-3">
              <input
                type="text"
                required
                value={lead.name}
                onChange={(e) => setLead((p) => ({ ...p, name: e.target.value }))}
                placeholder="Adın Soyadın"
                className="w-full h-11 px-4 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none transition-all"
              />
              <input
                type="email"
                required
                value={lead.email}
                onChange={(e) => setLead((p) => ({ ...p, email: e.target.value }))}
                placeholder="E-posta adresin"
                className="w-full h-11 px-4 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none transition-all"
              />
              <input
                type="tel"
                required
                value={lead.phone}
                onChange={(e) => setLead((p) => ({ ...p, phone: e.target.value }))}
                placeholder="Telefon (+90 5xx xxx xx xx)"
                className="w-full h-11 px-4 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none transition-all"
              />
              <input
                type="text"
                required
                value={lead.project}
                onChange={(e) => setLead((p) => ({ ...p, project: e.target.value }))}
                placeholder="Projenin adı (gerçek ya da takma)"
                className="w-full h-11 px-4 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={gateLoading}
              className="btn btn-primary btn-lg w-full mt-6 disabled:opacity-60"
            >
              {gateLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Mentörle Konuşmaya Başla <ArrowRight className="h-4 w-4" /></>}
            </button>
            <p className="text-[10px] text-muted-foreground/80 text-center mt-3">Bilgilerin gizli tutulur, üçüncü taraflarla paylaşılmaz.</p>
          </form>
        ) : (
        <>
        {/* Dynamic Context Header (Lead Status & Growth Scoring) */}
        <div className="px-6 py-3.5 bg-gradient-to-r from-primary/5 to-accent/5 border-b border-border/40 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-accent" />
            <span>Mevcut Durum: <strong>Girişim Check-Up Bekleniyor</strong></span>
          </div>
          <a href="/free-training" className="text-primary font-bold hover:underline flex items-center">
            Puan Artır
            <ChevronRight className="h-3 w-3" />
          </a>
        </div>

        {/* Chat Messages Log Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin scrollbar-thumb-muted">
          {messages.map((msg, i) => (
            <div 
              key={i} 
              className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              <div 
                className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user" 
                    ? "bg-primary text-background font-bold shadow-lg shadow-primary/10" 
                    : "glass-panel text-foreground border-border/80"
                }`}
              >
                {msg.content}
              </div>
              <span className="text-[10px] text-muted-foreground font-mono mt-1.5 px-1">
                {msg.role === "user" ? "Girişimci" : "Dr. Startup AI"}
              </span>
            </div>
          ))}
          {isLoading && (
            <div className="flex flex-col items-start">
              <div className="glass-panel rounded-2xl p-4 flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Fikir analizi yapılıyor ve büyüme hunisi planlanıyor...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar Form */}
        <form 
          onSubmit={handleSubmit}
          className="border-t border-border/80 p-6 bg-[#0E1726]/20"
        >
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Girişim projenizi veya takıldığınız konuyu yazın..."
              className="w-full h-12 pl-4 pr-12 rounded-xl bg-background border border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 h-8 w-8 rounded-lg bg-primary text-background font-bold hover:bg-primary/90 flex items-center justify-center disabled:opacity-50 transition-all cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground/80 text-center mt-3">
            Startup Doktoru AI mentorunun yönlendirmeleri yatırım tavsiyesi içermez. "Kervan yolda değil, stratejiyle düzülür."
          </p>
        </form>
        </>
        )}

      </div>
    </div>
  );
}
