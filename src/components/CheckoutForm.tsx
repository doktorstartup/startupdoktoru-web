"use client";

import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { CreditCard, Lock, Loader2, ArrowRight, X } from "lucide-react";
import { useMember } from "../lib/member";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

type Props = {
  productId: string;
  productTitle: string;
  productNote: string;
  priceLabel: string; // ödenecek fiyat, ör. "$6.00"
  comparePrice?: string; // üstü çizili eski fiyat, ör. "$12.00"
  productQuery: string; // "ebook" | "course"
  discountCode?: string; // otomatik uygulanan kupon (ör. e-kitap alana "EBOOK50")
  onClose: () => void;
};

// Ödeme adımı: PaymentElement + onay
function PaymentStep({ productQuery }: { productQuery: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);
    setError(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/thank-you?product=${productQuery}`,
      },
    });

    // confirmPayment başarılıysa kullanıcı return_url'e yönlenir; buraya yalnızca hata dönerse gelinir.
    if (error) {
      setError(error.message || "Ödeme tamamlanamadı. Lütfen tekrar deneyin.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />

      {error && (
        <p className="text-xs text-red-400 text-center">{error}</p>
      )}

      <div className="flex items-center gap-2 text-[10px] text-muted-foreground justify-center py-1 select-none">
        <Lock className="h-3 w-3 text-primary" />
        <span>256-bit SSL şifreli güvenli ödeme (Stripe).</span>
      </div>

      <button
        type="submit"
        disabled={!stripe || isLoading}
        className="w-full h-12 rounded-xl bg-primary text-background font-bold hover:bg-primary/95 flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-60"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-background" />
            Ödeme Doğrulanıyor...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            Ödemeyi Tamamla
            <ArrowRight className="h-4 w-4" />
          </span>
        )}
      </button>
    </form>
  );
}

export default function CheckoutForm({
  productId,
  productTitle,
  productNote,
  priceLabel,
  comparePrice,
  productQuery,
  discountCode,
  onClose,
}: Props) {
  const { member } = useMember();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefilling, setPrefilling] = useState(false);

  // ESC ile kapat
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const createIntent = async (n: string, em: string, ph: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, email: em, name: n, phone: ph, discountCode }),
      });
      const data = await res.json();
      if (!res.ok || !data.clientSecret) {
        setError(data.error || "Ödeme başlatılamadı.");
        return false;
      }
      setClientSecret(data.clientSecret);
      return true;
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Giriş yapmış üyeyse bilgilerini doldur; ad+e-posta+telefon tamsa doğrudan ödemeye geç.
  useEffect(() => {
    if (!member?.email) return;
    setEmail(member.email);
    setPrefilling(true);
    fetch(`/api/profile?email=${encodeURIComponent(member.email)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.name) setName(d.name);
        if (d.phone) setPhone(d.phone);
        if (d.name && d.phone) {
          createIntent(d.name, member.email, d.phone); // tüm bilgi var → ödeme adımına atla
        }
      })
      .catch(() => {})
      .finally(() => setPrefilling(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member?.email]);

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createIntent(name, email, phone);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl border border-border/80 bg-[#0E1726] shadow-2xl p-8 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-primary/5 blur-2xl pointer-events-none" />

        <div className="flex justify-between items-center border-b border-border/40 pb-4 mb-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Güvenli Ödeme
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="relative z-20 flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground bg-secondary/40 border border-border hover:bg-secondary/70 cursor-pointer transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex justify-between items-center mb-6">
          <div>
            <h4 className="text-sm font-bold text-foreground">{productTitle}</h4>
            <p className="text-[10px] text-muted-foreground">{productNote}</p>
          </div>
          <div className="text-right flex items-baseline gap-2">
            {comparePrice && (
              <span className="text-[11px] text-muted-foreground line-through font-mono">{comparePrice}</span>
            )}
            <span className="text-base font-extrabold font-mono text-primary">{priceLabel}</span>
          </div>
        </div>

        {prefilling && !clientSecret ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-xs">Bilgilerin hazırlanıyor…</span>
          </div>
        ) : !clientSecret ? (
          <form onSubmit={handleDetailsSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground block mb-1 uppercase tracking-wider">
                Adınız Soyadınız
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Eser Memişoğlu"
                className="w-full h-11 px-4 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground block mb-1 uppercase tracking-wider">
                E-posta Adresiniz
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="eser@girisim.com"
                className="w-full h-11 px-4 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground block mb-1 uppercase tracking-wider">
                Telefon Numaranız
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+90 5xx xxx xx xx"
                className="w-full h-11 px-4 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none transition-all"
              />
            </div>

            {error && <p className="text-xs text-red-400 text-center">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-primary text-background font-bold hover:bg-primary/95 flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-60"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-background" />
                  Hazırlanıyor...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Ödemeye Geç
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>
          </form>
        ) : (
          <Elements
            stripe={stripePromise}
            options={{ clientSecret, appearance: { theme: "night" } }}
          >
            <PaymentStep productQuery={productQuery} />
          </Elements>
        )}
      </div>
    </div>
  );
}
