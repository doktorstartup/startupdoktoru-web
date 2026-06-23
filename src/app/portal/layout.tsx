"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Download,
  Menu,
  X,
  LogOut,
  Home,
  GraduationCap,
} from "lucide-react";
import { useMember } from "../../lib/member";
import { PhonePrompt } from "../../components/PhonePrompt";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { member, logout } = useMember();

  const initials = member?.email?.slice(0, 2).toUpperCase() || "SD";
  const displayEmail = member?.email || "Giriş yapılmadı";

  const handleLogout = async () => {
    await logout(); // oturum tamamen silinene kadar bekle, sonra yönlendir
    window.location.href = "/";
  };

  const menuItems = [
    {
      name: "Eğitim İçeriği",
      href: "/portal/course",
      icon: GraduationCap,
    },
    {
      name: "E-Kitap İndir",
      href: "/portal/ebook",
      icon: Download,
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
              Startup<span className="text-primary">Doktoru</span>
            </span>
          </Link>
        </div>

        {/* User Card */}
        <div className="p-6 border-b border-border/20 bg-secondary/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold uppercase shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-foreground truncate">{displayEmail}</div>
              <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Öğrenci</div>
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
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 h-11 rounded-xl text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/20 w-full transition-colors text-left"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Çıkış Yap
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
            Startup<span className="text-primary">Doktoru</span>
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
                <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm uppercase shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-foreground truncate">{displayEmail}</div>
                  <div className="text-[10px] text-muted-foreground">Öğrenci</div>
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
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 h-11 rounded-xl text-sm font-semibold text-red-400 w-full transition-colors text-left"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Çıkış Yap
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

      {/* Telefonu olmayan üyeye yatırımcı-telefon kartı */}
      <PhonePrompt />
    </div>
  );
}
