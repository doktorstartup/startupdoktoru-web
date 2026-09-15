"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Rocket, Save, CheckCircle2, Clock, XCircle, GraduationCap, ArrowRight, ArrowLeft } from "lucide-react";
import { MemberLogin } from "../../../../../components/MemberLogin";
import { useMember } from "../../../../../lib/member";
import { supabase } from "../../../../../lib/supabase";
import { useHref } from "../../../../../lib/i18n-client";

type Profile = {
  startup_name: string;
  one_liner: string;
  value_prop: string;
  deck_url: string;
  website: string;
  sectors: string[];
  stage: string;
  team_size: number | null;
  city: string;
  status?: "submitted" | "approved" | "rejected";
};

const EMPTY: Profile = { startup_name: "", one_liner: "", value_prop: "", deck_url: "", website: "", sectors: [], stage: "", team_size: null, city: "" };
const inputCls = "w-full h-11 px-4 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none transition-all";
const areaCls = "w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none transition-all resize-y";
const labelCls = "text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5";

const STEPS = ["Girişim", "Değer & Sunum", "Ekip"];
const STATUS: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
  submitted: { label: "İncelemede — onaylandığında yatırımcılara gösterilir", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: Clock },
  approved: { label: "Onaylandı — yatırıma hazır, yatırımcılara gösterilebilir", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle2 },
  rejected: { label: "Revizyon gerekiyor — güncelleyip tekrar kaydet", cls: "bg-red-500/10 text-red-400 border-red-500/20", icon: XCircle },
};

async function token(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || "";
}

export default function StartupProfilePage() {
  const { member, loading } = useMember();
  const href = useHref();
  const [p, setP] = useState<Profile>(EMPTY);
  const [step, setStep] = useState(0);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const set = (k: keyof Profile, v: unknown) => setP((prev) => ({ ...prev, [k]: v as never }));

  const load = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const res = await fetch("/api/me/startup", { headers: { Authorization: `Bearer ${await token()}` } });
      const d = await res.json();
      if (d.profile) setP({ ...EMPTY, ...d.profile, sectors: d.profile.sectors || [] });
    } catch { /* boş bırak */ }
    finally { setLoadingProfile(false); }
  }, []);

  useEffect(() => { if (member) load(); }, [member, load]);

  const save = async () => {
    if (!p.startup_name.trim()) { setStep(0); setMsg("Girişim adı gerekli."); return; }
    setSaving(true); setMsg("");
    try {
      const res = await fetch("/api/me/startup", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
        body: JSON.stringify(p),
      });
      const d = await res.json();
      if (d.error) setMsg(d.error);
      else { setMsg("Kaydedildi ✓"); load(); }
    } catch { setMsg("Bağlantı hatası."); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-32 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  if (!member) return <MemberLogin />;

  const st = p.status ? STATUS[p.status] : null;
  const StIcon = st?.icon;
  const canNext = step !== 0 || !!p.startup_name.trim();

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <span className="text-primary text-xs font-bold font-mono tracking-widest uppercase">Yatırımcı Ağı</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 flex items-center gap-2">
          <Rocket className="h-6 w-6 text-primary" /> Girişimini Yatırımcılara Aç
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Birkaç adımda profilini oluştur. Onayladıktan sonra tezine uyan yatırımcılarla eşleştiririz. Net ve dürüst yaz — yatırımcılar bunu görecek.
        </p>
      </div>

      {st && StIcon && (
        <div className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl border ${st.cls}`}>
          <StIcon className="h-4 w-4" /> {st.label}
        </div>
      )}

      {loadingProfile ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : (
        <div className="glass-panel rounded-2xl border border-border/40 p-6 space-y-6">
          {/* Adım göstergesi */}
          <div className="flex items-center gap-2">
            {STEPS.map((label, i) => (
              <button key={label} onClick={() => setStep(i)} className="flex-1 text-left group">
                <div className={`h-1.5 rounded-full transition-all ${i <= step ? "bg-primary" : "bg-secondary/50"}`} />
                <span className={`text-[11px] font-semibold mt-1.5 inline-block transition-colors ${i === step ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                  {i + 1}. {label}
                </span>
              </button>
            ))}
          </div>

          {/* Adım 1: Girişim */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label className={labelCls}>Girişim adı *</label>
                <input value={p.startup_name} onChange={(e) => set("startup_name", e.target.value)} placeholder="Örn. Creato AI" className={inputCls} autoFocus />
              </div>
              <div>
                <label className={labelCls}>Web sitesi</label>
                <input value={p.website} onChange={(e) => set("website", e.target.value)} placeholder="https://" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Asansör konuşması <span className="normal-case font-normal text-muted-foreground/60">(tek cümlede ne yapıyorsunuz)</span></label>
                <textarea value={p.one_liner} onChange={(e) => set("one_liner", e.target.value)} rows={2}
                  placeholder="KOBİ'ler için 5 dakikada mali müşavir kalitesinde nakit akışı tahmini yapan yapay zeka." className={areaCls} />
              </div>
            </div>
          )}

          {/* Adım 2: Değer & Sunum */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className={labelCls}>Değer önerisi <span className="normal-case font-normal text-muted-foreground/60">(hangi sorunu, kime, neden sizinle)</span></label>
                <textarea value={p.value_prop} onChange={(e) => set("value_prop", e.target.value)} rows={5}
                  placeholder="Problem, çözüm, neden şimdi, sizi farklı kılan…" className={areaCls} />
              </div>
              <div>
                <label className={labelCls}>Sunum / pitch deck bağlantısı <span className="normal-case font-normal text-muted-foreground/60">(Google Drive / DocSend / PDF)</span></label>
                <input value={p.deck_url} onChange={(e) => set("deck_url", e.target.value)} placeholder="https://docsend.com/…" className={inputCls} />
              </div>
            </div>
          )}

          {/* Adım 3: Ekip & detay */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Ekipte kaç kişi?</label>
                  <input type="number" min={1} value={p.team_size ?? ""} onChange={(e) => set("team_size", e.target.value === "" ? null : Number(e.target.value))} placeholder="Örn. 4" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Aşama</label>
                  <input value={p.stage} onChange={(e) => set("stage", e.target.value)} placeholder="pre-seed / seed" className={inputCls} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Sektör(ler) <span className="normal-case font-normal text-muted-foreground/60">(virgülle)</span></label>
                  <input defaultValue={p.sectors.join(", ")} onBlur={(e) => set("sectors", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} placeholder="fintech, saas" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Şehir</label>
                  <input value={p.city} onChange={(e) => set("city", e.target.value)} placeholder="İstanbul" className={inputCls} />
                </div>
              </div>
            </div>
          )}

          {/* Gezinme */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-border/20">
            <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
              className="btn btn-secondary btn-sm disabled:opacity-40"><ArrowLeft className="h-4 w-4" /> Geri</button>

            <div className="flex items-center gap-3">
              {msg && <span className="text-sm text-primary">{msg}</span>}
              {step < STEPS.length - 1 ? (
                <button onClick={() => canNext ? setStep((s) => s + 1) : setMsg("Girişim adı gerekli.")} className="btn btn-primary btn-sm">
                  İleri <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button onClick={save} disabled={saving} className="btn btn-primary btn-sm">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Kaydet & Gönder
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <Link href={href("/portal/course")} className="glass-panel rounded-2xl border border-border/40 hover:border-primary/40 transition-all p-5 flex items-center justify-between group">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary"><GraduationCap className="h-5 w-5" /></div>
          <div>
            <h3 className="font-bold text-foreground">Eğitimlerim</h3>
            <p className="text-xs text-muted-foreground">Yatırıma hazırlanırken eğitimlerini izlemeye devam et.</p>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-0.5 group-hover:text-primary transition-all" />
      </Link>
    </div>
  );
}
