"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Building2, ExternalLink, LogOut, Users, Rocket, MapPin, Layers } from "lucide-react";
import { supabase } from "../../../../lib/supabase";

type Investor = { firm_name: string; partner_name: string | null; thesis: string | null; sectors: string[]; stages: string[]; ticket: string | null };
type Startup = {
  id: string; startup_name: string; one_liner: string | null; value_prop: string | null;
  deck_url: string | null; website: string | null; sectors: string[]; stage: string | null; team_size: number | null; city: string | null;
  product_stage: string | null; valuation: string | null;
};

export default function InvestorPortal() {
  const [phase, setPhase] = useState<"loading" | "anon" | "denied" | "ready">("loading");
  const [investor, setInvestor] = useState<Investor | null>(null);
  const [startups, setStartups] = useState<Startup[]>([]);

  const loadDealflow = useCallback(async (accessToken: string) => {
    try {
      const res = await fetch("/api/me/dealflow", { headers: { Authorization: `Bearer ${accessToken}` } });
      const d = await res.json();
      if (!d.investor) { setPhase("denied"); return; }
      setInvestor(d.investor);
      setStartups(d.startups || []);
      setPhase("ready");
    } catch { setPhase("denied"); }
  }, []);

  useEffect(() => {
    let done = false;
    supabase.auth.getSession().then(({ data }) => {
      const s = data.session;
      if (s?.access_token) { done = true; loadDealflow(s.access_token); }
      else setTimeout(() => { if (!done) setPhase("anon"); }, 1200); // sihirli-link hash'i çözülene kadar bekle
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.access_token) { done = true; loadDealflow(session.access_token); }
    });
    return () => sub.subscription.unsubscribe();
  }, [loadDealflow]);

  const logout = async () => { await supabase.auth.signOut({ scope: "local" }); setPhase("anon"); setInvestor(null); setStartups([]); };

  return (
    <div className="min-h-screen bg-[#050B14] text-foreground">
      <header className="border-b border-border/40 glass-panel">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/en" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-foreground flex items-center justify-center text-background font-black text-xs">SD</div>
            <span className="font-extrabold tracking-tight">Startup<span className="text-primary">Doktoru</span></span>
          </Link>
          {phase === "ready" && (
            <button onClick={logout} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><LogOut className="h-4 w-4" /> Sign out</button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {phase === "loading" && <div className="flex items-center justify-center py-32 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>}

        {phase === "anon" && (
          <div className="max-w-md mx-auto text-center py-20">
            <div className="h-14 w-14 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-5"><Building2 className="h-7 w-7" /></div>
            <h1 className="text-xl font-extrabold mb-2">Investor access</h1>
            <p className="text-sm text-muted-foreground">Please open the secure sign-in link we emailed you. It logs you in automatically — no password needed. If your link expired, reply to our email and we&apos;ll send a fresh one.</p>
          </div>
        )}

        {phase === "denied" && (
          <div className="max-w-md mx-auto text-center py-20">
            <div className="h-14 w-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5"><Building2 className="h-7 w-7" /></div>
            <h1 className="text-xl font-extrabold mb-2">This area is invite-only</h1>
            <p className="text-sm text-muted-foreground">Your account isn&apos;t linked to an investor profile yet. If you expected access, reply to our invitation email and we&apos;ll set it up.</p>
            <button onClick={logout} className="btn btn-secondary mt-6"><LogOut className="h-4 w-4" /> Sign out</button>
          </div>
        )}

        {phase === "ready" && investor && (
          <div className="space-y-10">
            <div>
              <span className="text-primary text-xs font-bold font-mono tracking-widest uppercase">Investor area</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">Welcome, {investor.partner_name || investor.firm_name}</h1>
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                Startups from the Startup Doktoru community that match your thesis. We curate these by hand — reach out to us to be introduced to any founder.
              </p>
              {(investor.sectors?.length || investor.stages?.length || investor.ticket) && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {investor.sectors?.map((s) => <span key={s} className="text-[11px] px-2 py-1 rounded-lg bg-secondary/40 border border-border/40 text-muted-foreground">{s}</span>)}
                  {investor.stages?.map((s) => <span key={s} className="text-[11px] px-2 py-1 rounded-lg bg-secondary/40 border border-border/40 text-muted-foreground">{s}</span>)}
                  {investor.ticket && <span className="text-[11px] px-2 py-1 rounded-lg bg-secondary/40 border border-border/40 text-muted-foreground">{investor.ticket}</span>}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2"><Rocket className="h-4 w-4" /> Matched startups ({startups.length})</h2>
              {startups.length === 0 ? (
                <div className="glass-panel rounded-2xl border border-border/40 p-10 text-center text-sm text-muted-foreground">
                  No matches yet. We&apos;re curating founders for your thesis and will notify you as they&apos;re added.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {startups.map((s) => (
                    <div key={s.id} className="glass-panel rounded-2xl border border-border/40 p-6 flex flex-col">
                      <h3 className="font-bold text-lg text-foreground">{s.startup_name}</h3>
                      {s.one_liner && <p className="text-sm text-primary/90 mt-1">{s.one_liner}</p>}
                      {s.value_prop && <p className="text-sm text-muted-foreground mt-3 leading-relaxed whitespace-pre-line">{s.value_prop}</p>}
                      <div className="flex flex-wrap gap-2 mt-4">
                        {s.sectors?.map((x) => <span key={x} className="text-[11px] px-2 py-0.5 rounded bg-secondary/40 border border-border/40 text-muted-foreground">{x}</span>)}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground mt-4">
                        {s.product_stage && <span className="inline-flex items-center gap-1 text-foreground/90"><Layers className="h-3.5 w-3.5" /> {s.product_stage}</span>}
                        {s.valuation && <span className="inline-flex items-center gap-1 text-emerald-400">Valuation: {s.valuation}</span>}
                        {s.team_size != null && <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {s.team_size} people</span>}
                        {s.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {s.city}</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-5 pt-4 border-t border-border/20">
                        {s.deck_url && <a href={s.deck_url} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm"><ExternalLink className="h-3.5 w-3.5" /> View deck</a>}
                        {s.website && <a href={s.website} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm"><ExternalLink className="h-3.5 w-3.5" /> Website</a>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
