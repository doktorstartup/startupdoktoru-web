"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Rocket, Save, CheckCircle2, Clock, XCircle, GraduationCap, ArrowRight, ArrowLeft, Lightbulb, Sparkles } from "lucide-react";
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
  team_size: number | null;
  city: string;
  product_stage: string;
  valuation: string;
  status?: "submitted" | "approved" | "rejected";
};

const EMPTY: Profile = { startup_name: "", one_liner: "", value_prop: "", deck_url: "", website: "", sectors: [], team_size: null, city: "", product_stage: "", valuation: "" };
const inputCls = "w-full h-11 px-4 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none transition-all";
const areaCls = "w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none transition-all resize-y";
const labelCls = "text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5";

const STEPS = ["Girişim", "Ürün & Değer", "Değerleme", "Sunum & Ekip"];
const PRODUCT_STAGES = ["Fikir", "MVP", "İlk müşteriler geldi", "MRR (düzenli gelir)", "Growth (büyüme)"];

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
  const { member, loading, hasAccess } = useMember();
  const href = useHref();
  const [p, setP] = useState<Profile>(EMPTY);
  const [step, setStep] = useState(0);
  const [valDone, setValDone] = useState<boolean | null>(null);
  const [deckHas, setDeckHas] = useState<boolean | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false); // kaydettikten sonra analiz görünümü
  const [msg, setMsg] = useState("");

  const set = (k: keyof Profile, v: unknown) => setP((prev) => ({ ...prev, [k]: v as never }));

  const load = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const res = await fetch("/api/me/startup", { headers: { Authorization: `Bearer ${await token()}` } });
      const d = await res.json();
      if (d.profile) {
        setP({ ...EMPTY, ...d.profile, sectors: d.profile.sectors || [] });
        if (d.profile.valuation) setValDone(true);
        if (d.profile.deck_url) setDeckHas(true);
      }
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
      else { setSaved(true); load(); }
    } catch { setMsg("Bağlantı hatası."); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-32 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  if (!member) return <MemberLogin />;

  const st = p.status ? STATUS[p.status] : null;
  const StIcon = st?.icon;
  const canNext = step !== 0 || !!p.startup_name.trim();
  const valTo = hasAccess("degerleme") ? href("/portal/course") : href("/degerleme");
  const deckTo = hasAccess("investor_training") ? href("/portal/course") : href("/investor-training");

  // ── Kaydettikten sonra: PROFİL ANALİZİ + yumuşak eğitim önerisi (adımlarda değil, sonda) ──
  if (saved) {
    const recs: { title: string; why: string; cta: string; to: string }[] = [];
    if (!p.valuation.trim())
      recs.push({ title: "Değerleme", why: "Yatırımcılar “ne kadar para, hangi değerleme?” diye sorar. Değerleme yapmadan pazarlığa oturamazsın.", cta: "Değerleme eğitimini incele", to: valTo });
    if (!p.deck_url.trim())
      recs.push({ title: "Yatırımcı sunumu", why: "İlk izlenim sunumda oluşur; sunum olmadan yatırımcıların dikkatini çekmek zor.", cta: "Yatırımcı Sunumu eğitimini incele", to: deckTo });

    const strengths = [
      p.product_stage && `Ürün: ${p.product_stage}`,
      p.valuation.trim() && `Değerleme: ${p.valuation}`,
      p.deck_url.trim() && "Yatırımcı sunumu ✓",
      p.team_size != null && `${p.team_size} kişilik ekip`,
      p.one_liner.trim() && "Asansör konuşması ✓",
    ].filter(Boolean) as string[];

    return (
      <div className="space-y-6 max-w-2xl">
        <div className="glass-panel rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.04] p-6">
          <div className="flex items-center gap-2 text-emerald-400 font-bold"><CheckCircle2 className="h-5 w-5" /> Bilgilerini aldık — profilin incelemeye alındı.</div>
          <p className="text-sm text-muted-foreground mt-2">Onaylandığında sistemimize kayıtlı yatırımcılarla eşleştirilirsin.</p>
        </div>

        {strengths.length > 0 && (
          <div className="glass-panel rounded-2xl border border-border/40 p-6">
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Profil analizi — güçlü yanların</div>
            <div className="flex flex-wrap gap-2">
              {strengths.map((s) => <span key={s} className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">{s}</span>)}
            </div>
          </div>
        )}

        {recs.length > 0 ? (
          <div className="glass-panel rounded-2xl border border-primary/25 bg-primary/[0.03] p-6 space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold"><Lightbulb className="h-5 w-5" /> Yatırımcıların dikkatini çekmek için</div>
            <p className="text-sm text-muted-foreground">Profilin yayında, ama şu iki nokta seni yatırımcı karşısında bir adım öne taşır. İstersen tamamla — zorunlu değil:</p>
            {recs.map((r) => (
              <div key={r.title} className="rounded-xl border border-border/50 bg-background/40 p-4">
                <div className="font-semibold text-foreground">{r.title} eksik görünüyor</div>
                <p className="text-sm text-muted-foreground mt-1">{r.why}</p>
                <Link href={r.to} className="btn btn-primary btn-sm mt-3"><GraduationCap className="h-4 w-4" /> {r.cta}</Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel rounded-2xl border border-emerald-500/25 p-6 flex items-center gap-2 text-emerald-400 font-semibold">
            <Sparkles className="h-5 w-5" /> Profilin güçlü — değerlemen ve sunumun hazır. Eşleştirmeye hazırsın! 🎉
          </div>
        )}

        <div className="flex items-center gap-3">
          <button onClick={() => setSaved(false)} className="btn btn-secondary btn-sm"><ArrowLeft className="h-4 w-4" /> Profili düzenle</button>
          <Link href={href("/portal/course")} className="btn btn-secondary btn-sm"><GraduationCap className="h-4 w-4" /> Eğitimlerim</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <span className="text-primary text-xs font-bold font-mono tracking-widest uppercase">Yatırımcı Ağı</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 flex items-center gap-2">
          <Rocket className="h-6 w-6 text-primary" /> Girişimini Yatırımcılara Aç
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Birkaç adımda profilini oluştur. Onayladıktan sonra sistemimize kayıtlı yatırımcılarla eşleştiririz. Net ve dürüst yaz — yatırımcılar bunu görecek.
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
                <span className={`text-[10px] sm:text-[11px] font-semibold mt-1.5 inline-block transition-colors ${i === step ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
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

          {/* Adım 2: Ürün durumu + değer önerisi */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className={labelCls}>Ürün durumu</label>
                <div className="flex flex-wrap gap-2">
                  {PRODUCT_STAGES.map((s) => (
                    <button key={s} onClick={() => set("product_stage", s)}
                      className={`px-3.5 h-10 rounded-xl border text-sm font-semibold transition-all ${p.product_stage === s ? "bg-primary text-background border-primary" : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-border"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>Değer önerisi <span className="normal-case font-normal text-muted-foreground/60">(hangi sorunu, kime, neden sizinle)</span></label>
                <textarea value={p.value_prop} onChange={(e) => set("value_prop", e.target.value)} rows={4}
                  placeholder="Problem, çözüm, neden şimdi, sizi farklı kılan…" className={areaCls} />
              </div>
            </div>
          )}

          {/* Adım 3: Değerleme — "yok" derse geçsin, uyarı yok */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className={labelCls}>Değerleme yapıldı mı?</label>
                <div className="flex gap-2">
                  <button onClick={() => setValDone(true)} className={`flex-1 h-11 rounded-xl border text-sm font-semibold transition-all ${valDone === true ? "bg-primary text-background border-primary" : "bg-background border-border text-muted-foreground hover:text-foreground"}`}>Evet</button>
                  <button onClick={() => { setValDone(false); set("valuation", ""); }} className={`flex-1 h-11 rounded-xl border text-sm font-semibold transition-all ${valDone === false ? "bg-primary text-background border-primary" : "bg-background border-border text-muted-foreground hover:text-foreground"}`}>Hayır / henüz değil</button>
                </div>
              </div>
              {valDone === true && (
                <div>
                  <label className={labelCls}>Değerleme rakamı</label>
                  <input value={p.valuation} onChange={(e) => set("valuation", e.target.value)} placeholder="Örn. $500K / 15.000.000 ₺" className={inputCls} />
                </div>
              )}
              {valDone === false && <p className="text-xs text-muted-foreground">Sorun değil — devam et. Sonunda profilini birlikte değerlendireceğiz.</p>}
            </div>
          )}

          {/* Adım 4: Yatırımcı sunumu + ekip — "yok" derse geçsin, uyarı yok */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className={labelCls}>Yatırımcı sunumun (pitch deck) var mı?</label>
                <div className="flex gap-2">
                  <button onClick={() => setDeckHas(true)} className={`flex-1 h-11 rounded-xl border text-sm font-semibold transition-all ${deckHas === true ? "bg-primary text-background border-primary" : "bg-background border-border text-muted-foreground hover:text-foreground"}`}>Evet</button>
                  <button onClick={() => { setDeckHas(false); set("deck_url", ""); }} className={`flex-1 h-11 rounded-xl border text-sm font-semibold transition-all ${deckHas === false ? "bg-primary text-background border-primary" : "bg-background border-border text-muted-foreground hover:text-foreground"}`}>Hayır / henüz değil</button>
                </div>
              </div>
              {deckHas === true && (
                <div>
                  <label className={labelCls}>Sunum bağlantısı <span className="normal-case font-normal text-muted-foreground/60">(Google Drive / DocSend / PDF)</span></label>
                  <input value={p.deck_url} onChange={(e) => set("deck_url", e.target.value)} placeholder="https://drive.google.com/…" className={inputCls} />
                </div>
              )}
              {deckHas === false && <p className="text-xs text-muted-foreground">Sorun değil — devam et. Sonunda profilini birlikte değerlendireceğiz.</p>}

              <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-border/20">
                <div>
                  <label className={labelCls}>Ekipte kaç kişi?</label>
                  <input type="number" min={1} value={p.team_size ?? ""} onChange={(e) => set("team_size", e.target.value === "" ? null : Number(e.target.value))} placeholder="Örn. 4" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Şehir</label>
                  <input value={p.city} onChange={(e) => set("city", e.target.value)} placeholder="İstanbul" className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Sektör(ler) <span className="normal-case font-normal text-muted-foreground/60">(virgülle)</span></label>
                <input defaultValue={p.sectors.join(", ")} onBlur={(e) => set("sectors", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} placeholder="fintech, saas" className={inputCls} />
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
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Kaydet & Analiz Et
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
