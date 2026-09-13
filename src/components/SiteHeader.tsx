"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Menu, X, LogIn, LayoutDashboard, LogOut } from "lucide-react";
import { useMember } from "../lib/member";
import { useHref, useT } from "../lib/i18n-client";
import { LanguageSwitcher } from "./LanguageSwitcher";
import type { Locale } from "../lib/i18n";

type Props = {
  onOpenAi?: () => void;
  // Sayfanın hangi dillerde var olduğu. Blog yazısı gibi her dilde karşılığı
  // olmayan sayfalarda verilir; verilmezse dil değiştirici tüm dilleri gösterir.
  availableLocales?: Locale[];
};

export function SiteHeader({ onOpenAi, availableLocales }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { member, logout } = useMember();
  const initials = member?.email?.slice(0, 2).toUpperCase() || "";
  const t = useT();
  const href = useHref();

  // "#" ile başlayanlar ana sayfa içi çapa; diğerleri ayrı sayfa (dile göre üretilir).
  const navLinks = [
    { href: "#problem", label: t.nav.problem },
    { href: "#value-ladder", label: t.nav.solution },
    { href: "#ebook", label: t.nav.ebook },
    { href: "#training", label: t.nav.training },
    { href: href("/blog"), label: t.nav.blog },
    { href: "#about", label: t.nav.about },
  ];

  return (
    <>
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container-page flex h-20 items-center justify-between">
        <Link href={href("/")} className="flex items-center" aria-label={t.header.homeAria}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-sd-beyaz.png" alt="Startup Doktoru" className="h-9 sm:h-11 w-auto" />
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          {navLinks.map((l) =>
            l.href.startsWith("#") ? (
              <a key={l.href} href={l.href} className="hover:text-primary transition-colors">
                {l.label}
              </a>
            ) : (
              <Link key={l.href} href={l.href} className="hover:text-primary transition-colors">
                {l.label}
              </Link>
            )
          )}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher className="hidden sm:flex" available={availableLocales} />
          {onOpenAi && (
            <button
              onClick={onOpenAi}
              className="hidden md:flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border border-primary/20 bg-primary/10 text-primary hover:bg-primary hover:text-background transition-all duration-300"
            >
              <Sparkles className="h-3 w-3 animate-pulse" />
              <span>{t.header.aiMentor}</span>
            </button>
          )}
          {member ? (
            <Link
              href={href("/portal")}
              className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
              title={member.email}
            >
              <span className="h-7 w-7 rounded-full bg-primary/15 border border-primary/30 text-primary text-[11px] font-bold flex items-center justify-center">{initials}</span>
              {t.header.myPanel}
            </Link>
          ) : (
            <Link
              href={href("/portal")}
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
            >
              <LogIn className="h-4 w-4" /> {t.header.login}
            </Link>
          )}
          <Link href={href("/ebook")} className="hidden sm:inline-flex btn btn-sm btn-primary">
            {t.header.buyEbook}
          </Link>
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 text-foreground"
            aria-label={t.header.openMenu}
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-sd-beyaz.png" alt="Startup Doktoru" className="h-10 w-auto" />
              <button
                onClick={() => setMobileOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:text-foreground"
                aria-label={t.header.closeMenu}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 text-base font-semibold text-foreground">
              {navLinks.map((l) =>
                l.href.startsWith("#") ? (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    className="py-3 px-2 rounded-lg hover:bg-secondary/40 hover:text-primary transition-colors"
                  >
                    {l.label}
                  </a>
                ) : (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    className="py-3 px-2 rounded-lg hover:bg-secondary/40 hover:text-primary transition-colors"
                  >
                    {l.label}
                  </Link>
                )
              )}
            </nav>
            <div className="mt-auto flex flex-col gap-3">
              <LanguageSwitcher className="justify-center py-2" available={availableLocales} />
              {onOpenAi && (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    onOpenAi();
                  }}
                  className="btn btn-lg btn-secondary w-full"
                >
                  <Sparkles className="h-4 w-4" /> {t.header.aiMentor}
                </button>
              )}
              {member ? (
                <>
                  <Link
                    href={href("/portal")}
                    onClick={() => setMobileOpen(false)}
                    className="btn btn-lg btn-secondary w-full"
                  >
                    <LayoutDashboard className="h-4 w-4" /> {t.header.myPanel} ({initials})
                  </Link>
                  <button
                    onClick={async () => {
                      await logout();
                      setMobileOpen(false);
                      window.location.href = href("/");
                    }}
                    className="btn btn-lg btn-secondary w-full text-red-400"
                  >
                    <LogOut className="h-4 w-4" /> {t.header.logout}
                  </button>
                </>
              ) : (
                <Link
                  href={href("/portal")}
                  onClick={() => setMobileOpen(false)}
                  className="btn btn-lg btn-secondary w-full"
                >
                  <LogIn className="h-4 w-4" /> {t.header.memberLogin}
                </Link>
              )}
              <Link
                href={href("/ebook")}
                onClick={() => setMobileOpen(false)}
                className="btn btn-lg btn-primary w-full"
              >
                {t.header.buyEbook}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
