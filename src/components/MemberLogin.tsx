"use client";

import { useState } from "react";
import { Lock, Loader2, ArrowRight } from "lucide-react";

type Props = {
  login: (email: string) => Promise<{ ok: boolean; found: boolean }>;
};

// Portal giriş kapısı (v1): satın alımda kullanılan e-posta ile erişim.
export function MemberLogin({ login }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const res = await login(email);
    if (!res.ok) {
      setMsg("Bağlantı hatası. Lütfen tekrar deneyin.");
      setLoading(false);
    }
    // Başarılıysa üst bileşen (useMember) yeniden render eder.
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md glass-panel rounded-3xl border border-border/40 p-8 text-center">
        <div className="h-14 w-14 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-5">
          <Lock className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight mb-2">Öğrenci Portalı</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Satın alırken kullandığın e-posta ile giriş yap. Eğitimlerin ve e-kitabın burada.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e-posta adresin"
            className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none transition-all text-center"
          />
          <button type="submit" disabled={loading} className="btn btn-lg btn-primary w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (<>Giriş Yap <ArrowRight className="h-4 w-4" /></>)}
          </button>
        </form>
        {msg && <p className="text-xs text-red-400 mt-3">{msg}</p>}
        <p className="text-[11px] text-muted-foreground mt-5">
          Henüz satın alım yapmadın mı? <a href="/egitimler" className="text-primary font-semibold hover:underline">Eğitimlere göz at</a>
        </p>
      </div>
    </div>
  );
}
