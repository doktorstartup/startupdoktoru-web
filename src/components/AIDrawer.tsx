"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Send, Sparkles, Loader2, Zap, ChevronRight, ArrowRight } from "lucide-react";
import { supabase } from "../lib/supabase";
import { track } from "../lib/track";
import { useMember } from "../lib/member";
import { useHref, useLang, useT } from "../lib/i18n-client";

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
  const lang = useLang();
  const t = useT().ai;
  const href = useHref();
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: t.greeting },
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
          lang,
          messages: [...messages, { role: "user", content: userMessage }].slice(-6) // Send last few messages for context
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.reply) throw new Error(data.error || "API hatası");

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (error) {
      // Burada eskiden HAZIR bir cevap gösteriliyordu: ziyaretçi mentörün
      // cevapladığını sanıyor, servisin bozuk olduğu hiçbir yerden anlaşılmıyordu.
      // Artık dürüst hata gösteriliyor.
      console.error("AI Error:", error);
      const mesaj = error instanceof Error && error.message !== "API hatası" ? error.message : t.hata;
      setMessages((prev) => [...prev, { role: "assistant", content: mesaj }]);
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
                {t.title}
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/15 border border-accent/20 text-accent uppercase tracking-widest">PRO</span>
              </h3>
              <p className="text-xs text-muted-foreground">{t.subtitle}</p>
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
            <h4 className="text-lg font-extrabold tracking-tight mb-1">{t.gateTitle}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              {t.gateLead}
            </p>

            <div className="space-y-3">
              <input
                type="text"
                required
                value={lead.name}
                onChange={(e) => setLead((p) => ({ ...p, name: e.target.value }))}
                placeholder={t.namePlaceholder}
                className="w-full h-11 px-4 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none transition-all"
              />
              <input
                type="email"
                required
                value={lead.email}
                onChange={(e) => setLead((p) => ({ ...p, email: e.target.value }))}
                placeholder={t.emailPlaceholder}
                className="w-full h-11 px-4 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none transition-all"
              />
              <input
                type="tel"
                required
                value={lead.phone}
                onChange={(e) => setLead((p) => ({ ...p, phone: e.target.value }))}
                placeholder={t.phonePlaceholder}
                className="w-full h-11 px-4 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none transition-all"
              />
              <input
                type="text"
                required
                value={lead.project}
                onChange={(e) => setLead((p) => ({ ...p, project: e.target.value }))}
                placeholder={t.projectPlaceholder}
                className="w-full h-11 px-4 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={gateLoading}
              className="btn btn-primary btn-lg w-full mt-6 disabled:opacity-60"
            >
              {gateLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{t.gateCta} <ArrowRight className="h-4 w-4" /></>}
            </button>
            <p className="text-[10px] text-muted-foreground/80 text-center mt-3">{t.gateNote}</p>
          </form>
        ) : (
        <>
        {/* Dynamic Context Header (Lead Status & Growth Scoring) */}
        <div className="px-6 py-3.5 bg-gradient-to-r from-primary/5 to-accent/5 border-b border-border/40 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-accent" />
            <span>{t.statusBefore} <strong>{t.statusValue}</strong></span>
          </div>
          <a href={href("/free-training")} className="text-primary font-bold hover:underline flex items-center">
            {t.raiseScore}
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
                {msg.role === "user" ? t.roleUser : t.roleAssistant}
              </span>
            </div>
          ))}
          {isLoading && (
            <div className="flex flex-col items-start">
              <div className="glass-panel rounded-2xl p-4 flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">{t.thinking}</span>
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
              placeholder={t.inputPlaceholder}
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
            {t.disclaimer}
          </p>
        </form>
        </>
        )}

      </div>
    </div>
  );
}
