"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Loader2, Mail } from "lucide-react";
import { localePath } from "../lib/i18n";
import { useT } from "../lib/i18n-client";

// Kitap Türkçe. /en tarafında Türkçe bir PDF satmak yerine önce talebi ölçüyoruz:
// ziyaretçi e-postasını bırakır, İngilizce baskı çıkarsa haber verilir.
export function IngilizceBaskiKaydi() {
  const t = useT().ebookEn;
  const [email, setEmail] = useState("");
  const [durum, setDurum] = useState<"bos" | "gonderiliyor" | "bitti">("bos");
  const [hata, setHata] = useState<string | null>(null);

  const gonder = async (e: React.FormEvent) => {
    e.preventDefault();
    setDurum("gonderiliyor");
    setHata(null);
    try {
      const res = await fetch("/api/ebook-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setDurum("bitti");
    } catch {
      setHata(t.error);
      setDurum("bos");
    }
  };

  if (durum === "bitti") {
    return (
      <div className="w-full max-w-md rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
        <div className="flex items-center gap-2 mb-2 text-emerald-400">
          <Check className="h-5 w-5" />
          <span className="font-bold">{t.doneTitle}</span>
        </div>
        <p className="text-sm text-muted-foreground">{t.doneBody}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/20 bg-accent/5 text-xs text-accent font-semibold uppercase tracking-wider mb-4">
        <Mail className="h-3.5 w-3.5" />
        {t.badge}
      </div>
      <h3 className="text-xl font-bold mb-2">{t.title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-5">{t.lead}</p>

      <form onSubmit={gonder} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.placeholder}
          className="flex-1 h-12 px-4 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none transition-all"
        />
        <button type="submit" disabled={durum === "gonderiliyor"} className="btn btn-lg btn-primary shrink-0 disabled:opacity-60">
          {durum === "gonderiliyor" ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{t.cta} <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>
      {hata && <p className="text-xs text-red-400 mt-2">{hata}</p>}

      {/* Türkçe okuyabilen ziyaretçiyi satışa yönlendir — talep bugün de karşılansın. */}
      <p className="text-xs text-muted-foreground mt-4">
        {t.turkishNote}{" "}
        <Link href={localePath("tr", "/ebook")} className="text-primary font-semibold hover:underline">
          {t.turkishCta}
        </Link>
      </p>
    </div>
  );
}
