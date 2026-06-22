"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  Home,
  BookOpen,
  Layers,
  Shield,
  FileText,
  UserPlus,
  KeyRound,
  Loader2
} from "lucide-react";

const ADMIN_PW_KEY = "ds_admin_pw";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Admin şifre kapısı — tüm /admin'i korur. Şifre sessionStorage'da, sunucu doğrular.
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [pw, setPw] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = sessionStorage.getItem(ADMIN_PW_KEY);
    } catch {
      /* yoksa kapı kapalı kalır */
    }
    if (!saved) {
      setChecking(false);
      return;
    }
    fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: saved }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setAuthed(true);
        else
          try {
            sessionStorage.removeItem(ADMIN_PW_KEY);
          } catch {}
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  const submitPw = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwErr("");
    setPwLoading(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      const d = await res.json();
      if (d.ok) {
        try {
          sessionStorage.setItem(ADMIN_PW_KEY, pw);
        } catch {}
        setAuthed(true);
      } else {
        setPwErr(d.error || "Hatalı şifre.");
      }
    } catch {
      setPwErr("Bağlantı hatası.");
    } finally {
      setPwLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050B14] text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050B14] text-foreground px-6">
        <form onSubmit={submitPw} className="w-full max-w-sm glass-panel rounded-3xl border border-border/60 p-8 text-center">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-5">
            <KeyRound className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight mb-1">Yönetici Girişi</h1>
          <p className="text-sm text-muted-foreground mb-6">Bu alan yöneticiye özeldir.</p>
          <input
            type="password"
            autoFocus
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Yönetici şifresi"
            className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none transition-all text-center mb-3"
          />
          {pwErr && <p className="text-xs text-red-400 mb-3">{pwErr}</p>}
          <button type="submit" disabled={pwLoading} className="btn btn-primary w-full disabled:opacity-60">
            {pwLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Giriş Yap"}
          </button>
          <Link href="/" className="block text-xs text-muted-foreground hover:text-foreground mt-4">
            ← Ana sayfaya dön
          </Link>
        </form>
      </div>
    );
  }

  const menuItems = [
    {
      name: "Genel Analiz",
      href: "/admin",
      icon: BarChart3,
    },
    {
      name: "Lead CRM Yönetimi",
      href: "/admin/leads",
      icon: Users,
    },
    {
      name: "Erişim Yönetimi",
      href: "/admin/access",
      icon: UserPlus,
    },
    {
      name: "Blog Yönetimi",
      href: "/admin/blog",
      icon: FileText,
    },
    {
      name: "Otomasyonlar",
      href: "/admin/automations",
      icon: Layers,
    },
    {
      name: "İçerik & LMS Editörü",
      href: "/admin/content",
      icon: BookOpen,
    },
  ];

  return (
    <div className="flex h-screen bg-[#050B14] text-foreground font-sans overflow-hidden">
      {/* SIDEBAR FOR DESKTOP */}
      <aside className="hidden md:flex md:flex-col md:w-64 glass-panel border-r border-border/40 shrink-0">
        <div className="p-6 border-b border-border/40 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary-foreground flex items-center justify-center text-background font-black text-sm">
              SD
            </div>
            <span className="font-extrabold tracking-tight text-lg text-foreground">
              Doktoru<span className="text-primary">Panel</span>
            </span>
          </Link>
        </div>

        {/* User Card */}
        <div className="p-6 border-b border-border/20 bg-secondary/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">Eser Memişoğlu</div>
              <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Sistem Yöneticisi</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 h-11 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-background shadow-lg shadow-primary/15"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border/40 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 h-11 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
          >
            <Home className="h-4 w-4 shrink-0" />
            Ana Sayfaya Dön
          </Link>
          <button
            onClick={() => { try { sessionStorage.removeItem(ADMIN_PW_KEY); } catch {} window.location.href = "/"; }}
            className="flex items-center gap-3 px-4 h-11 rounded-xl text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/20 w-full transition-colors text-left"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Güvenli Çıkış
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <div className="md:hidden absolute top-0 left-0 right-0 h-16 glass-panel border-b border-border/40 flex items-center justify-between px-6 z-40">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-foreground flex items-center justify-center text-background font-black text-xs">
            SD
          </div>
          <span className="font-extrabold tracking-tight text-base text-foreground">
            Doktoru<span className="text-primary">Panel</span>
          </span>
        </Link>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-muted-foreground hover:text-foreground focus:outline-none"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <aside 
            className="w-64 h-full bg-[#0E1726] border-r border-border/40 flex flex-col pt-20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile User Info */}
            <div className="px-6 pb-6 border-b border-border/20">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">Eser Memişoğlu</div>
                  <div className="text-[10px] text-muted-foreground">Yönetici</div>
                </div>
              </div>
            </div>

            {/* Mobile Nav */}
            <nav className="flex-1 px-4 py-6 space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 h-11 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-primary text-background shadow-lg shadow-primary/15"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Footer */}
            <div className="p-4 border-t border-border/20 space-y-1">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 h-11 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
              >
                <Home className="h-4 w-4 shrink-0" />
                Ana Sayfaya Dön
              </Link>
              <button
                onClick={() => { try { sessionStorage.removeItem(ADMIN_PW_KEY); } catch {} window.location.href = "/"; }}
                className="flex items-center gap-3 px-4 h-11 rounded-xl text-sm font-semibold text-red-400 w-full transition-colors text-left"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Güvenli Çıkış
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden pt-16 md:pt-0 bg-[#050B14]">
        <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10 relative">
          {/* Subtle Background Glows */}
          <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-accent/5 blur-[120px] pointer-events-none" />
          
          <div className="max-w-6xl mx-auto relative z-10">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
