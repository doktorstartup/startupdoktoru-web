"use client";

import { useEffect, useState } from "react";
import { Phone, X, Loader2, Check } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useMember } from "../lib/member";

const DONE_KEY = "ds_phone_prompt_done";

// Telefonu olmayan üyeye (özellikle Google ile girenlere) yatırımcı çerçevesiyle telefon sorar.
export function PhonePrompt() {
  const { member } = useMember();
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!member?.email) return;
    try {
      if (localStorage.getItem(DONE_KEY)) return;
    } catch {
      /* devam */
    }
    // İsmi auth profilinden al (Google: full_name), kaydı garantile, telefon yoksa kart göster.
    supabase.auth.getUser().then(({ data }) => {
      const m = data.user?.user_metadata || {};
      const fullName = m.full_name || m.name || "";
      setName(fullName);
      // POST: Google ile gireni CRM'e al + hasPhone öğren
      fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: member.email, name: fullName }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (!d.hasPhone) setShow(true);
        })
        .catch(() => {});
    });
  }, [member?.email]);

  const dismiss = () => {
    try {
      localStorage.setItem(DONE_KEY, "1");
    } catch {
      /* geç */
    }
    setShow(false);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: member?.email, name, phone }),
      });
      setDone(true);
      try {
        localStorage.setItem(DONE_KEY, "1");
      } catch {
        /* geç */
      }
      setTimeout(() => setShow(false), 1500);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm px-6">
      <div className="relative w-full max-w-md rounded-3xl border border-primary/30 bg-[#0E1726] shadow-2xl p-8">
        <button onClick={dismiss} className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:text-foreground" aria-label="Kapat">
          <X className="h-4 w-4" />
        </button>

        {done ? (
          <div className="text-center py-6">
            <div className="h-14 w-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <Check className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-extrabold tracking-tight">Teşekkürler! 🎉</h3>
            <p className="text-sm text-muted-foreground mt-1">Yatırımcı ağımıza eklendin.</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="h-14 w-14 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
              <Phone className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-extrabold tracking-tight mb-2">Son bir adım kaldı 📞</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Yatırımcıların <strong className="text-foreground">seninle iletişime geçebilmesi</strong> için telefon numaranı bırakman <strong className="text-foreground">önemlidir</strong>. Uygun yatırım fırsatlarında ekibimiz sana ulaşır.
            </p>
            <form onSubmit={save} className="space-y-3">
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+90 5xx xxx xx xx"
                className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none text-center"
              />
              <button type="submit" disabled={loading} className="btn btn-lg btn-primary w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Numaramı Kaydet"}
              </button>
            </form>
            <button onClick={dismiss} className="text-xs text-muted-foreground hover:text-foreground mt-4">Şimdi değil</button>
          </div>
        )}
      </div>
    </div>
  );
}
