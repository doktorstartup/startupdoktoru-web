"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Gift, X, Check, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "../lib/supabase";
import { track } from "../lib/track";
import { useMember } from "../lib/member";
import { useHref, useLang, useT } from "../lib/i18n-client";

const SEEN_KEY = "ds_popup_seen"; // en son ne zaman gösterildi (ms)
const DONE_KEY = "ds_popup_done"; // kaydolan bir daha görmesin
const TEKRAR_GUN = 7;

// Kaydolmayana 7 gün sonra bir şans daha. Eski sürüm SEEN_KEY'e "1" yazıyordu;
// sayıya çevrilince 1 ms olur ve süresi dolmuş sayılır — o kullanıcılar da geri gelir.
function gosterilebilir() {
  try {
    if (localStorage.getItem(DONE_KEY)) return false;
    const son = Number(localStorage.getItem(SEEN_KEY) || 0);
    return !son || Date.now() - son > TEKRAR_GUN * 864e5;
  } catch {
    return true; // localStorage yoksa engelleme
  }
}

// Fiyat bloğu — normalde $12 → bugün $6 (%50). Hem popup hem teşekkür ekranında kullanılır.
function PriceBlock() {
  const t = useT();

  return (
    <div className="w-full rounded-2xl border border-primary/30 bg-primary/[0.06] px-5 py-4 mb-5">
      <div className="flex items-center justify-center gap-4">
        <div className="flex flex-col items-center leading-none">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{t.discountPopup.normalPrice}</span>
          <span className="text-2xl font-bold text-muted-foreground/70 line-through font-mono">{t.prices.ebookOld}</span>
        </div>
        <ArrowRight className="h-5 w-5 text-primary shrink-0" />
        <div className="flex flex-col items-center leading-none">
          <span className="text-[10px] uppercase tracking-wider text-primary mb-1 font-bold">{t.discountPopup.todayForYou}</span>
          <span className="text-5xl font-black text-primary font-mono tracking-tight">{t.prices.ebookNew}</span>
        </div>
      </div>
      <div className="mt-3 flex justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary text-background text-[11px] font-extrabold px-3 py-1 uppercase tracking-wide">
          {t.discountPopup.discountBadge}
        </span>
      </div>
    </div>
  );
}

export function DiscountPopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const { member } = useMember();
  const t = useT().discountPopup;
  const href = useHref();
  // Popup e-kitabı yarı fiyata satıyor; /en tarafında e-kitap satışı yok.
  const en = useLang() === "en";

  // Admin/portal alanlarında ve giriş yapmış üyeye gösterme
  const suppressed = en || !!member || pathname?.startsWith("/admin") || pathname?.startsWith("/portal");

  const trigger = useCallback(() => {
    if (!gosterilebilir()) return;
    setOpen(true);
    try {
      localStorage.setItem(SEEN_KEY, String(Date.now()));
    } catch {
      /* sessizce geç */
    }
    track("popup_view");
  }, []);

  useEffect(() => {
    if (suppressed || !gosterilebilir()) return;

    // Sayfaya yeni gelmişken rahatsız etme — ilk 8 sn tetikleme kapalı.
    let armed = false;
    const armTimer = window.setTimeout(() => {
      armed = true;
    }, 8000);

    // Masaüstü: gerçek çıkış-niyeti — imleç pencereyi ÜSTTEN (sekme/adres/back
    // yönünde) terk edince. mouseleave (mouseout değil) child geçişlerinde
    // tetiklenmez → kaydırırken yanlış açılmaz.
    if (window.matchMedia("(pointer: fine)").matches) {
      const onLeave = (e: MouseEvent) => {
        if (armed && e.clientY <= 0 && !e.relatedTarget) trigger();
      };
      document.documentElement.addEventListener("mouseleave", onLeave);
      return () => {
        document.documentElement.removeEventListener("mouseleave", onLeave);
        window.clearTimeout(armTimer);
      };
    }

    // Dokunmatik cihazda "çıkış niyeti" diye bir sinyal yok; popup buralarda hiç
    // açılmıyordu. Sayfanın yarısını geçmek ya da 30 sn kalmak ilgi göstergesi.
    const onScroll = () => {
      if (!armed) return;
      const h = document.documentElement.scrollHeight;
      if (h > 0 && (window.scrollY + window.innerHeight) / h > 0.55) trigger();
    };
    const sureTimer = window.setTimeout(() => trigger(), 30000);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(armTimer);
      window.clearTimeout(sureTimer);
    };
  }, [suppressed, trigger]);

  if (suppressed || !open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await supabase.from("ds_leads").insert([
        {
          name: email,
          email,
          source: "popup",
          status: "NEW",
          score: 5,
          stage: "NEW_LEAD",
        },
      ]);
      track("popup_submit", { email });
      try {
        localStorage.setItem(DONE_KEY, "1");
      } catch {
        /* sessizce geç */
      }
      // Karşılama e-postası (Resend anahtarı varsa) — fire-and-forget
      fetch("/api/welcome", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }).catch(() => {});
      setSubmitted(true);
    } catch {
      // Hata olsa bile akışı bozma
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm px-6">
      <div className="relative w-full max-w-md rounded-3xl border border-primary/30 bg-[#0E1726] shadow-2xl p-8 overflow-hidden">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />

        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={t.close}
        >
          <X className="h-4 w-4" />
        </button>

        {!submitted ? (
          <div className="relative z-10 text-center flex flex-col items-center">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
              <Gift className="h-7 w-7" />
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight mb-1">{t.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              <strong className="text-foreground">{t.bodyStrong}</strong>{t.bodyRest}
            </p>

            <PriceBlock />

            <form onSubmit={handleSubmit} className="w-full space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none transition-all text-center"
              />
              <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{t.cta} <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>
            <p className="text-[10px] text-muted-foreground mt-3">{t.noSpam}</p>
          </div>
        ) : (
          <div className="relative z-10 text-center flex flex-col items-center">
            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <Check className="h-7 w-7" />
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight mb-1">{t.doneTitle}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              {t.doneBody}
            </p>

            <PriceBlock />

            <a href={href("/ebook")} className="btn btn-primary btn-lg w-full">
              {t.doneCta} <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
