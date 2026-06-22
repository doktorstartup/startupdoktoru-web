"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Lock, ShoppingCart, BookOpen } from "lucide-react";
import { MemberLogin } from "../../../components/MemberLogin";
import { useMember } from "../../../lib/member";

export default function EbookPortal() {
  const { member, loading, hasAccess } = useMember();
  const email = member?.email || "";
  const owned = hasAccess("ebook_13_steps");

  // PDF artık public/'te değil; erişim kontrollü /api/ebook'tan imzalı URL alınır.
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    if (!email || !owned) return;
    let cancelled = false;
    setPdfUrl(null);
    setPdfError(null);
    fetch(`/api/ebook?email=${encodeURIComponent(email)}`)
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (cancelled) return;
        if (ok && d.url) setPdfUrl(d.url);
        else setPdfError(d.error || "E-kitap açılamadı.");
      })
      .catch(() => !cancelled && setPdfError("Bağlantı hatası."));
    return () => {
      cancelled = true;
    };
  }, [email, owned]);

  if (loading) {
    return <div className="flex items-center justify-center py-32 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }
  if (!member) {
    return <MemberLogin />;
  }

  if (!owned) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="h-14 w-14 mx-auto rounded-2xl bg-secondary/40 border border-border/40 flex items-center justify-center text-muted-foreground mb-5">
          <Lock className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight mb-2">E-kitabın burada görünecek</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Bu e-posta ile e-kitap satın alımı bulunamadı. 13 Adımda Milyon Dolarlık Startup e-kitabını <span className="line-through">12 $</span> <span className="text-primary font-bold">6 $</span>&apos;a edinebilirsin.
        </p>
        <Link href="/ebook" className="btn btn-lg btn-primary">
          <ShoppingCart className="h-4 w-4" /> E-Kitabı Al (6 $)
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="text-primary text-xs font-bold font-mono tracking-widest uppercase">E-Kitap</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" /> 13 Adımda Milyon Dolarlık Startup
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Kitabını burada, site içinde okuyabilirsin.</p>
      </div>

      {/* Sistem içi PDF okuyucu — imzalı URL, toolbar gizli (indirme/yazdırma çubuğu yok) */}
      <div className="rounded-2xl border border-border/60 overflow-hidden bg-black/30 shadow-2xl min-h-[82vh] flex items-center justify-center">
        {pdfUrl ? (
          <iframe
            src={`${pdfUrl}#toolbar=0&navpanes=0&view=FitH`}
            title="E-Kitap"
            className="w-full h-[82vh]"
          />
        ) : pdfError ? (
          <p className="text-sm text-red-400 px-6 text-center">{pdfError}</p>
        ) : (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        )}
      </div>
      <p className="text-[11px] text-muted-foreground text-center">
        Erişimin hesabına tanımlı — istediğin zaman buradan okuyabilirsin.
      </p>
    </div>
  );
}
