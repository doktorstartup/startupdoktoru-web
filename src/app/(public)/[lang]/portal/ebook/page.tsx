"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Lock, ShoppingCart, BookOpen, Presentation } from "lucide-react";
import { MemberLogin } from "../../../../../components/MemberLogin";
import { useMember } from "../../../../../lib/member";
import { TRAININGS } from "../../../../../lib/trainings";
import { useHref, useT } from "../../../../../lib/i18n-client";

// Üyenin dijital dosyaları. İki belge olabilir:
//   kitap  → e-kitabı satın alanlara (basılı kitabın dijital sürümü)
//   sunum  → e-kitabı VEYA herhangi bir video eğitimi alanlara (eğitimin materyali)
// Henüz yüklenmemiş belge (404) listeden sessizce düşer; kullanıcıya hata çıkmaz.
type BelgeAdi = "kitap" | "sunum";
type Belge = { ad: BelgeAdi; url: string };

export default function EbookPortal() {
  const { member, loading, hasAccess } = useMember();
  const all = useT();
  const t = all.portal;
  const href = useHref();
  const email = member?.email || "";

  const ekitabiVar = hasAccess("ebook_13_steps");
  const egitimiVar = TRAININGS.some((tr) => hasAccess(tr.id));

  const [belgeler, setBelgeler] = useState<Belge[] | null>(null);
  const [aktif, setAktif] = useState<BelgeAdi | null>(null);
  const [hata, setHata] = useState<string | null>(null);

  const adi = useCallback((ad: BelgeAdi) => (ad === "kitap" ? t.belgeKitap : t.belgeSunum), [t]);

  useEffect(() => {
    if (!email) return;
    const istenen: BelgeAdi[] = [];
    if (ekitabiVar) istenen.push("kitap");
    if (ekitabiVar || egitimiVar) istenen.push("sunum");
    if (istenen.length === 0) return;

    let cancelled = false;
    setBelgeler(null);
    setHata(null);

    Promise.all(
      istenen.map((ad) =>
        fetch(`/api/ebook?email=${encodeURIComponent(email)}&dosya=${ad}`)
          .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
          .then(({ ok, d }) => (ok && d.url ? { ad, url: d.url as string } : null))
          .catch(() => null)
      )
    ).then((sonuc) => {
      if (cancelled) return;
      const bulunan = sonuc.filter((b): b is Belge => b !== null);
      setBelgeler(bulunan);
      setAktif(bulunan[0]?.ad ?? null);
      if (bulunan.length === 0) setHata(t.belgeHazirlaniyor);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, ekitabiVar, egitimiVar]);

  if (loading) {
    return <div className="flex items-center justify-center py-32 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }
  if (!member) {
    return <MemberLogin />;
  }

  // Hiçbir ürünü yok — e-kitabı tanıt.
  if (!ekitabiVar && !egitimiVar) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="h-14 w-14 mx-auto rounded-2xl bg-secondary/40 border border-border/40 flex items-center justify-center text-muted-foreground mb-5">
          <Lock className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight mb-2">{t.ebookEmptyTitle}</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {t.ebookEmptyBodyBefore}<span className="line-through">{all.prices.ebookOld}</span> <span className="text-primary font-bold">{all.prices.ebookNew}</span>{t.ebookEmptyBodyAfter}
        </p>
        <Link href={href("/ebook")} className="btn btn-lg btn-primary">
          <ShoppingCart className="h-4 w-4" /> {t.ebookEmptyCta}
        </Link>
      </div>
    );
  }

  const acik = belgeler?.find((b) => b.ad === aktif) || null;
  const cokBelge = (belgeler?.length ?? 0) > 1;

  return (
    <div className="space-y-6">
      <div>
        <span className="text-primary text-xs font-bold font-mono tracking-widest uppercase">{t.belgelerBaslik}</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 flex items-center gap-2">
          {aktif === "sunum" ? <Presentation className="h-6 w-6 text-primary" /> : <BookOpen className="h-6 w-6 text-primary" />}
          {aktif ? adi(aktif) : t.belgelerBaslik}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {aktif === "sunum" ? t.belgeSunumLead : t.belgeKitapLead}
        </p>
      </div>

      {/* Birden çok belge varsa seçim şeridi; tek belgede gereksiz gürültü yapmaz. */}
      {cokBelge && (
        <div className="flex flex-wrap gap-2">
          {belgeler!.map((b) => (
            <button
              key={b.ad}
              onClick={() => setAktif(b.ad)}
              className={`inline-flex items-center gap-2 px-4 h-10 rounded-xl border text-sm font-semibold transition-all ${
                aktif === b.ad
                  ? "bg-primary text-background border-primary"
                  : "bg-secondary/30 border-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {b.ad === "sunum" ? <Presentation className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
              {adi(b.ad)}
            </button>
          ))}
        </div>
      )}

      {/* Sistem içi PDF okuyucu — imzalı URL, toolbar gizli (indirme/yazdırma çubuğu yok) */}
      <div className="rounded-2xl border border-border/60 overflow-hidden bg-black/30 shadow-2xl min-h-[82vh] flex items-center justify-center">
        {acik ? (
          <iframe
            key={acik.ad}
            src={`${acik.url}#toolbar=0&navpanes=0&view=FitH`}
            title={adi(acik.ad)}
            className="w-full h-[82vh]"
          />
        ) : hata ? (
          <p className="text-sm text-muted-foreground px-6 text-center">{hata}</p>
        ) : (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        )}
      </div>
      <p className="text-[11px] text-muted-foreground text-center">{t.ebookFooter}</p>
    </div>
  );
}
