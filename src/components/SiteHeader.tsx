"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Menu, X, LogIn, LayoutDashboard, LogOut } from "lucide-react";
import { useMember } from "../lib/member";

const NAV_LINKS = [
  { href: "#problem", label: "Problem" },
  { href: "#value-ladder", label: "Çözümümüz" },
  { href: "#ebook", label: "E-Kitap" },
  { href: "#training", label: "Eğitimler" },
  { href: "#about", label: "Hakkında" },
];

type Props = {
  onOpenAi?: () => void;
};

export function SiteHeader({ onOpenAi }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { member, logout } = useMember();
  const initials = member?.email?.slice(0, 2).toUpperCase() || "";

  return (
    <>
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container-page flex h-20 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-background font-bold text-xl shadow-lg shadow-primary/20">
            SD
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            STARTUP<span className="text-primary">DOKTORU</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-primary transition-colors">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {onOpenAi && (
            <button
              onClick={onOpenAi}
              className="hidden md:flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border border-primary/20 bg-primary/10 text-primary hover:bg-primary hover:text-background transition-all duration-300"
            >
              <Sparkles className="h-3 w-3 animate-pulse" />
              <span>AI Mentor</span>
            </button>
          )}
          {member ? (
            <Link
              href="/portal"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
              title={member.email}
            >
              <span className="h-7 w-7 rounded-full bg-primary/15 border border-primary/30 text-primary text-[11px] font-bold flex items-center justify-center">{initials}</span>
              Panelim
            </Link>
          ) : (
            <Link
              href="/portal"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
            >
              <LogIn className="h-4 w-4" /> Giriş
            </Link>
          )}
          <Link href="/ebook" className="hidden sm:inline-flex btn btn-sm btn-primary">
            E-Kitap Al
          </Link>
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 text-foreground"
            aria-label="Menüyü aç"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-72 max-w-[80vw] bg-[#0B1220] border-l border-border/60 shadow-2xl p-6 flex flex-col gap-6 overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold tracking-tight">
                STARTUP<span className="text-primary">DOKTORU</span>
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:text-foreground"
                aria-label="Menüyü kapat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 text-base font-semibold text-foreground">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="py-3 px-2 rounded-lg hover:bg-secondary/40 hover:text-primary transition-colors"
                >
                  {l.label}
                </a>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-3">
              {onOpenAi && (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    onOpenAi();
                  }}
                  className="btn btn-lg btn-secondary w-full"
                >
                  <Sparkles className="h-4 w-4" /> AI Mentor
                </button>
              )}
              {member ? (
                <>
                  <Link
                    href="/portal"
                    onClick={() => setMobileOpen(false)}
                    className="btn btn-lg btn-secondary w-full"
                  >
                    <LayoutDashboard className="h-4 w-4" /> Panelim ({initials})
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                    }}
                    className="btn btn-lg btn-secondary w-full text-red-400"
                  >
                    <LogOut className="h-4 w-4" /> Çıkış Yap
                  </button>
                </>
              ) : (
                <Link
                  href="/portal"
                  onClick={() => setMobileOpen(false)}
                  className="btn btn-lg btn-secondary w-full"
                >
                  <LogIn className="h-4 w-4" /> Üye Girişi
                </Link>
              )}
              <Link
                href="/ebook"
                onClick={() => setMobileOpen(false)}
                className="btn btn-lg btn-primary w-full"
              >
                E-Kitap Al
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
