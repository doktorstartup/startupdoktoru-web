"use client";

import { useState } from "react";
import { Lock, Loader2, ArrowRight, Mail, Check } from "lucide-react";
import { useMember } from "../lib/member";
import { useT } from "../lib/i18n-client";

type Mode = "login" | "signup" | "forgot";

// Portal giriş kapısı: Supabase Auth (email+şifre / Google).
export function MemberLogin() {
  const { signIn, signUp, signInWithGoogle, resetPassword } = useMember();
  const t = useT().auth;
  // #kayit hash'i ile gelen (ör. ana sayfa "Ücretsiz Kayıt Ol") doğrudan kayıt formunda açılır.
  const [mode, setMode] = useState<Mode>(() =>
    typeof window !== "undefined" && window.location.hash === "#kayit" ? "signup" : "login"
  );
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === "login") {
        const r = await signIn(form.email, form.password);
        if (!r.ok) setErr(r.error === "Invalid login credentials" ? t.errBadCredentials : r.error || t.errLoginFailed);
        // başarılıysa useMember üst bileşeni yeniden render eder
      } else if (mode === "signup") {
        if (form.password.length < 6) {
          setErr(t.errShortPassword);
          return;
        }
        const r = await signUp(form);
        if (!r.ok) {
          // E-posta zaten kayıtlıysa: yeniden "hesap oluştur" dayatma → giriş moduna geç,
          // e-posta+şifre formda kalır, "Giriş Yap"a basması yeter.
          if (r.error?.includes("already")) { setMode("login"); setInfo(t.errAlreadyRegistered); }
          else setErr(r.error || t.errSignupFailed);
        } else if (r.needsConfirm) setInfo(t.infoConfirm);
      } else {
        const r = await resetPassword(form.email);
        if (!r.ok) setErr(r.error || t.errGeneric);
        else setInfo(t.infoResetSent);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md glass-panel rounded-3xl border border-border/40 p-8">
        <div className="text-center mb-6">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {mode === "signup" ? t.titleSignup : mode === "forgot" ? t.titleForgot : t.titleLogin}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "signup" ? t.subSignup : mode === "forgot" ? t.subForgot : t.subLogin}
          </p>
        </div>

        {/* Google */}
        {mode !== "forgot" && (
          <>
            <button onClick={() => signInWithGoogle()} type="button" className="btn btn-lg btn-secondary w-full mb-4">
              <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.66 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.6 3.4 14.5 2.5 12 2.5 6.9 2.5 2.8 6.6 2.8 11.9S6.9 21.5 12 21.5c5.9 0 9.8-4.1 9.8-9.9 0-.7-.1-1.2-.2-1.7H12z"/></svg>
              {t.google}
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-border/40" />
              <span className="text-[11px] text-muted-foreground">{t.orEmail}</span>
              <div className="h-px flex-1 bg-border/40" />
            </div>
          </>
        )}

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <input type="text" required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder={t.namePlaceholder}
              className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none" />
          )}
          <input type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} placeholder={t.emailPlaceholder}
            className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none" />
          {mode === "signup" && (
            <div>
              <input type="tel" required value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder={t.phonePlaceholder}
                className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none" />
              <p className="text-[11px] text-muted-foreground mt-1.5 px-1">{t.phoneHint}</p>
            </div>
          )}
          {mode !== "forgot" && (
            <input type="password" required value={form.password} onChange={(e) => set("password", e.target.value)} placeholder={t.passwordPlaceholder}
              className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none" />
          )}

          {err && <p className="text-xs text-red-400">{err}</p>}
          {info && <p className="text-xs text-emerald-400 flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> {info}</p>}

          <button type="submit" disabled={loading} className="btn btn-lg btn-primary w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <>{mode === "signup" ? t.btnSignup : mode === "forgot" ? t.btnForgot : t.btnLogin} <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </form>

        {/* Mod geçişleri */}
        <div className="mt-5 text-center text-xs text-muted-foreground space-y-1.5">
          {mode === "login" && (
            <>
              <p>{t.noAccount} <button onClick={() => { setMode("signup"); setErr(null); setInfo(null); }} className="text-primary font-semibold hover:underline">{t.signupLink}</button></p>
              <p><button onClick={() => { setMode("forgot"); setErr(null); setInfo(null); }} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {t.forgotLink}</button></p>
            </>
          )}
          {mode === "signup" && (
            <p>{t.haveAccount} <button onClick={() => { setMode("login"); setErr(null); setInfo(null); }} className="text-primary font-semibold hover:underline">{t.loginLink}</button></p>
          )}
          {mode === "forgot" && (
            <p><button onClick={() => { setMode("login"); setErr(null); setInfo(null); }} className="text-primary font-semibold hover:underline">{t.backToLogin}</button></p>
          )}
        </div>
      </div>
    </div>
  );
}
