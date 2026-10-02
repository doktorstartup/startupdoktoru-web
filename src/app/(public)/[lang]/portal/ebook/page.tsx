"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Lock, ShoppingCart, BookOpen, Presentation, Download } from "lucide-react";
import { MemberLogin } from "../../../../../components/MemberLogin";
import { PdfOkuyucu } from "../../../../../components/PdfOkuyucu";
import { KitapYorumKarti } from "../../../../../components/KitapYorumKarti";
import { useMember } from "../../../../../lib/member";
import { supabase } from "../../../../../lib/supabase";
import { KITAP_URUNLERI, TRAININGS } from "../../../../../lib/trainings";
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

  const ekitabiVar = KITAP_URUNLERI.some((id) => hasAccess(id));
  const egitimiVar = TRAININGS.some((tr) => hasAccess(tr.id));

  const [belgeler, setBelgeler] = useState<Belge[] | null>(null);
  const [aktif, setAktif] = useState<BelgeAdi | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [okunanSayfa, setOkunanSayfa] = useState(1);
  const [indiriliyor, setIndiriliyor] = useState(false);
  const [indirHatasi, setIndirHatasi] = useState(false);

  // Kişiye özel kopya: adı ve e-postası basılmış PDF sunucuda üretilir.
  const indir = useCallback(async () => {
    setIndiriliyor(true);
    setIndirHatasi(false);
    try {
      const { data } = await supabase.auth.getSession();
      const r = await fetch("/api/ebook/indir", { headers: { Authorization: `Bearer ${data.session?.access_token || ""}` } });
      if (!r.ok) throw new Error(String(r.status));
      const ad = /filename\*=UTF-8''([^;]+)/.exec(r.headers.get("content-disposition") || "")?.[1];
      const url = URL.createObjectURL(await r.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = ad ? decodeURIComponent(ad) : "Hedef-Milyon-Dolar.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      setIndirHatasi(true);
    } finally {
      setIndiriliyor(false);
    }
  }, []);

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

      {aktif === "kitap" && acik && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <p className="text-xs text-muted-foreground">{indirHatasi ? t.indirHata : t.indirNot}</p>
          <button onClick={indir} disabled={indiriliyor} className="btn btn-primary shrink-0 disabled:opacity-60">
            {indiriliyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {indiriliyor ? t.indiriliyor : t.indir}
          </button>
        </div>
      )}

      {/* Site içi PDF okuyucu — imzalı URL, sayfalar pdf.js ile çiziliyor (mobilde de çalışır) */}
      <div className="rounded-2xl border border-border/60 bg-black/30 shadow-2xl p-2 sm:p-4">
        {acik ? (
          <PdfOkuyucu key={acik.url} url={acik.url} kimlik={acik.ad} sayfaMetni={t.sayfa} hataMetni={t.ebookError} onSayfa={setOkunanSayfa} />
        ) : hata ? (
          <p className="text-sm text-muted-foreground px-6 py-20 text-center">{hata}</p>
        ) : (
          <div className="flex justify-center py-32"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground text-center">{t.ebookFooter}</p>
      {aktif === "kitap" && acik && <KitapYorumKarti sayfa={okunanSayfa} />}
    </div>
  );
}
