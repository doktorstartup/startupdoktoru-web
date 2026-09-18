"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Handshake, Search, Check, Mail, CheckCircle2, Building2 } from "lucide-react";

type Investor = {
  id: string; firm_name: string; partner_name: string | null; email: string | null;
  sectors: string[]; stages: string[]; thesis: string | null;
  status?: string; interest_at?: string | null;
  portal_enabled?: boolean; invited_at?: string | null;
};
type Startup = { id: string; startup_name: string; one_liner: string | null; sectors: string[]; stage: string | null };

function getPw() { try { return sessionStorage.getItem("ds_admin_pw") || ""; } catch { return ""; } }

export default function MatchAdmin() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [sel, setSel] = useState<Investor | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [actions, setActions] = useState<Record<string, string>>({}); // startup_id -> requested/skipped
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [inviteMsg, setInviteMsg] = useState("");

  // Yalnız EŞLEŞTİRMEYE UYGUN yatırımcılar: ilgi gösteren (interest_at) + onaylı (verified).
  // Binlerce ham/pending kayıt burada gösterilmez. + onaylı girişimler.
  useEffect(() => {
    const pw = getPw();
    Promise.all([
      fetch(`/api/admin/invest?password=${encodeURIComponent(pw)}&interested=1`).then((r) => r.json()),
      fetch(`/api/admin/invest?password=${encodeURIComponent(pw)}&status=verified`).then((r) => r.json()),
      fetch(`/api/admin/startups?password=${encodeURIComponent(pw)}&status=approved`).then((r) => r.json()),
    ]).then(([intr, ver, st]) => {
      const map = new Map<string, Investor>();
      for (const i of (intr.investors || [])) map.set(i.id, i);
      for (const i of (ver.investors || [])) if (!map.has(i.id)) map.set(i.id, i);
      // İlgi gösterenler üstte.
      const list = [...map.values()].sort((a, b) => (b.interest_at ? 1 : 0) - (a.interest_at ? 1 : 0));
      setInvestors(list);
      setStartups(st.startups || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const loadMatches = useCallback(async (investorId: string) => {
    const r = await fetch(`/api/admin/match?password=${encodeURIComponent(getPw())}&investorId=${investorId}`);
    const d = await r.json();
    const rows: { startup_id: string; investor_action?: string | null }[] = d.matches || [];
    setMatched(new Set(rows.map((m) => m.startup_id)));
    setActions(Object.fromEntries(rows.filter((m) => m.investor_action).map((m) => [m.startup_id, m.investor_action as string])));
  }, []);

  const selectInvestor = (inv: Investor) => { setSel(inv); setInviteMsg(""); loadMatches(inv.id); };

  const toggle = async (startupId: string) => {
    if (!sel) return;
    const on = matched.has(startupId);
    // Optimistik
    setMatched((prev) => { const n = new Set(prev); if (on) n.delete(startupId); else n.add(startupId); return n; });
    setBusy(true);
    try {
      await fetch("/api/admin/match", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: getPw(), action: on ? "remove" : "add", investor_id: sel.id, startup_id: startupId }),
      });
    } finally { setBusy(false); }
  };

  const invite = async () => {
    if (!sel) return;
    setBusy(true); setInviteMsg("");
    try {
      const r = await fetch("/api/admin/invest/invite", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: getPw(), investorId: sel.id }),
      });
      const d = await r.json();
      if (d.error) setInviteMsg(d.error);
      else if (d.skipped) setInviteMsg("Resend yapılandırılmamış — davet maili gönderilemedi (portal yine açıldı).");
      else if (d.sent) { setInviteMsg("Davet gönderildi ✓"); setInvestors((prev) => prev.map((i) => i.id === sel.id ? { ...i, portal_enabled: true, invited_at: new Date().toISOString() } : i)); setSel({ ...sel, portal_enabled: true }); }
      else setInviteMsg("Gönderilemedi.");
    } catch { setInviteMsg("Bağlantı hatası."); }
    finally { setBusy(false); }
  };

  const filtered = investors.filter((i) => {
    const s = `${i.firm_name} ${i.partner_name || ""} ${i.email || ""} ${(i.sectors || []).join(" ")}`.toLowerCase();
    return s.includes(q.trim().toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div>
        <span className="text-primary text-xs font-bold font-mono tracking-widest uppercase">INVEST</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 flex items-center gap-2">
          <Handshake className="h-6 w-6 text-primary" /> Eşleştirme
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          Liste yalnız <strong className="text-foreground">ilgi gösteren</strong> ve <strong className="text-foreground">onaylı</strong> yatırımcıları içerir (ilgilenenler üstte). Yatırımcı seç, tezine uyan onaylı girişimleri işaretle, sonra portala davet et — giriş yaptığında bu girişimleri görecek.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Yatırımcı seçimi */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Yatırımcı ara…"
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-background border border-border focus:border-primary/50 text-sm outline-none" />
            </div>
            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
              {filtered.map((inv) => (
                <button key={inv.id} onClick={() => selectInvestor(inv)}
                  className={`w-full text-left glass-panel rounded-xl border p-3 transition-all ${sel?.id === inv.id ? "border-primary/50 bg-primary/[0.06]" : "border-border/40 hover:border-border"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-foreground truncate">{inv.firm_name}</span>
                    <span className="flex items-center gap-1 shrink-0">
                      {inv.interest_at && <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border bg-primary/10 text-primary border-primary/20">ilgilendi</span>}
                      {inv.status === "verified" && <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border bg-sky-500/10 text-sky-400 border-sky-500/20">onaylı</span>}
                      {inv.portal_enabled && <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">davetli</span>}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {[inv.partner_name, inv.sectors?.join(", ")].filter(Boolean).join(" · ") || inv.email}
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-8">
                  {q.trim() ? "Yatırımcı bulunamadı." : "Henüz ilgilenen ya da onaylı yatırımcı yok. Yatırımcı, outreach mailindeki linke tıklayıp ilgilenince burada görünür."}
                </div>
              )}
            </div>
          </div>

          {/* Eşleştirme paneli */}
          <div>
            {!sel ? (
              <div className="glass-panel rounded-2xl border border-border/40 p-10 text-center text-sm text-muted-foreground h-full flex flex-col items-center justify-center">
                <Building2 className="h-8 w-8 mb-3 opacity-40" /> Soldan bir yatırımcı seç.
              </div>
            ) : (
              <div className="glass-panel rounded-2xl border border-border/40 p-5 space-y-4">
                <div>
                  <h2 className="font-bold text-foreground">{sel.firm_name}</h2>
                  <p className="text-xs text-muted-foreground">{[sel.partner_name, sel.email].filter(Boolean).join(" · ")}</p>
                  {sel.thesis && <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{sel.thesis}</p>}
                </div>

                <div className="flex items-center gap-3 pb-3 border-b border-border/20">
                  <button onClick={invite} disabled={busy || !sel.email} title={!sel.email ? "E-postası yok" : ""}
                    className="btn btn-secondary btn-sm disabled:opacity-50">
                    {sel.portal_enabled ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Mail className="h-4 w-4" />}
                    {sel.portal_enabled ? "Yeniden davet et" : "Portala davet et"}
                  </button>
                  {inviteMsg && <span className="text-xs text-primary">{inviteMsg}</span>}
                </div>

                <div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Onaylı girişimler ({matched.size} eşleşti)</div>
                  {startups.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">Henüz onaylı girişim yok. Önce “Girişim Profilleri”nden onayla.</p>
                  ) : (
                    <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                      {startups.map((s) => {
                        const on = matched.has(s.id);
                        return (
                          <button key={s.id} onClick={() => toggle(s.id)} disabled={busy}
                            className={`w-full text-left flex items-center gap-3 rounded-xl border p-3 transition-all ${on ? "border-emerald-500/40 bg-emerald-500/[0.06]" : "border-border/40 hover:border-border"}`}>
                            <span className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 ${on ? "bg-emerald-500 border-emerald-500 text-background" : "border-border"}`}>
                              {on && <Check className="h-3.5 w-3.5" />}
                            </span>
                            <span className="min-w-0">
                              <span className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-foreground truncate">{s.startup_name}</span>
                                {on && actions[s.id] === "requested" && <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shrink-0">🤝 görüşme istedi</span>}
                                {on && actions[s.id] === "skipped" && <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border bg-secondary/40 text-muted-foreground border-border/40 shrink-0">geçti</span>}
                              </span>
                              <span className="block text-[11px] text-muted-foreground truncate">{s.one_liner || (s.sectors || []).join(", ")}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
