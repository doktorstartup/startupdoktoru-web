"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Building2, ExternalLink, LogOut, Users, MapPin, Layers, Sparkles, Handshake, X, CheckCircle2, Flame, RefreshCw, Newspaper, ArrowRight, BadgeCheck, Star } from "lucide-react";
import { supabase } from "../../../../lib/supabase";
import ProfileCard, { type Investor } from "./ProfileCard";

type Post = { title: string; slug: string; seo_description: string | null; cover_image: string | null; created_at: string };
type Startup = {
  id: string; startup_name: string; one_liner: string | null; value_prop: string | null;
  deck_url: string | null; website: string | null; sectors: string[]; stage: string | null; team_size: number | null; city: string | null;
  product_stage: string | null; valuation: string | null; sd_trained?: boolean; action: "requested" | "skipped" | null; interest_count?: number;
};

async function token(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || "";
}

const SKIP_REASONS = [
  "Not in my sector / thesis",
  "Too early stage",
  "Valuation / ask doesn't fit",
  "Not enough traction yet",
  "Team isn't a fit",
  "Other",
];

export default function InvestorPortal() {
  const [phase, setPhase] = useState<"loading" | "anon" | "expired" | "unavailable" | "denied" | "ready">("loading");
  const [investor, setInvestor] = useState<Investor | null>(null);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [skipMsg, setSkipMsg] = useState(false);
  const [skippingId, setSkippingId] = useState<string | null>(null); // "neden geçtin?" panelini açan kart
  const [news, setNews] = useState<Post[]>([]);
  const [exitOpen, setExitOpen] = useState(false);

  const loadDealflow = useCallback(async (accessToken: string) => {
    try {
      const res = await fetch("/api/me/dealflow", { headers: { Authorization: `Bearer ${accessToken}` } });
      const d = await res.json();
      if (!d.investor) { setPhase("denied"); return; }
      setInvestor(d.investor);
      setStartups(d.startups || []);
      setNews(d.news || []);
      setPhase("ready");
    } catch { setPhase("denied"); }
  }, []);

  useEffect(() => {
    let done = false;
    const start = async () => {
      // Davet linki kendi domainimize token_hash ile gelir; burada doğrularız.
      const tokenHash = new URLSearchParams(window.location.search).get("token_hash");
      let linkFailed = false;
      if (tokenHash) {
        let status = 0;
        try {
          const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
          if (!error) status = 200;
          else status = error.status || 0;
        } catch { /* ağ hatası → status 0 */ }
        // 4xx (429 hariç) = link geçersiz/süresi dolmuş. Diğer her şey = Supabase'e ulaşılamadı;
        // token harcanmadı, URL'i koru ki "Try again" aynı linkle yeniden denesin.
        const invalid = status >= 400 && status < 500 && status !== 429;
        if (status !== 200 && !invalid) { setPhase("unavailable"); return; }
        window.history.replaceState(null, "", window.location.pathname);
        linkFailed = invalid;
      }
      const { data } = await supabase.auth.getSession();
      const s = data.session;
      if (s?.access_token) { done = true; loadDealflow(s.access_token); }
      else if (linkFailed) setPhase("expired");
      else setTimeout(() => { if (!done) setPhase("anon"); }, 1200);
    };
    start();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.access_token) { done = true; loadDealflow(session.access_token); }
    });
    return () => sub.subscription.unsubscribe();
  }, [loadDealflow]);

  // Çıkış niyeti: fare pencerenin üstünden çıkarsa, oturum başına bir kez, henüz talep yoksa.
  const canPrompt = phase === "ready" && startups.length > 0 && !startups.some((s) => s.action === "requested");
  useEffect(() => {
    if (!canPrompt) return;
    const onLeave = (e: MouseEvent) => {
      if (e.clientY > 0 || e.relatedTarget) return;
      try {
        if (sessionStorage.getItem("inv_exit_seen")) return;
        sessionStorage.setItem("inv_exit_seen", "1");
      } catch { /* storage yoksa yine de göster */ }
      setExitOpen(true);
    };
    document.addEventListener("mouseout", onLeave);
    return () => document.removeEventListener("mouseout", onLeave);
  }, [canPrompt]);

  // Yatırımcının sektörleriyle kesişen girişim sektörleri → "neden bu eşleşme" satırı.
  const mine = new Set((investor?.sectors || []).map((x) => x.toLowerCase()));
  const overlap = (s: Startup) => (s.sectors || []).filter((x) => mine.has(x.toLowerCase()));
  const featured = startups.find((s) => !s.action); // çıkış-niyeti modalında öne çıkan girişim

  const saveProfile = async (patch: Omit<Investor, "firm_name">) => {
    try {
      const res = await fetch("/api/me/dealflow", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
        body: JSON.stringify(patch),
      });
      const d = await res.json();
      if (!res.ok || !d.investor) return false;
      setInvestor(d.investor);
      return true;
    } catch { return false; }
  };

  const act = async (startupId: string, action: "requested" | "skipped", reason?: string) => {
    setBusyId(startupId);
    try {
      await fetch("/api/me/dealflow", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
        body: JSON.stringify({ startup_id: startupId, action, reason }),
      });
      if (action === "skipped") {
        setStartups((prev) => prev.filter((s) => s.id !== startupId));
        setSkippingId(null);
        setSkipMsg(true);
      } else {
        setStartups((prev) => prev.map((s) => (s.id === startupId ? { ...s, action: "requested" } : s)));
      }
    } finally { setBusyId(null); }
  };

  // İlgi analizi: deck / website tıklaması (link yeni sekmede açılır; kayıt arka planda).
  const trackClick = async (startupId: string, target: "deck" | "website") => {
    fetch("/api/me/dealflow", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
      body: JSON.stringify({ startup_id: startupId, action: "click", target }),
    }).catch(() => {});
  };

  const logout = async () => { await supabase.auth.signOut({ scope: "local" }); setPhase("anon"); setInvestor(null); setStartups([]); };

  return (
    <div className="min-h-screen bg-[#050B14] text-foreground">
      <header className="border-b border-border/40 glass-panel">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/en" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-foreground flex items-center justify-center text-background font-black text-xs">SD</div>
            <span className="font-extrabold tracking-tight">Startup<span className="text-primary">Doktoru</span></span>
          </Link>
          {phase === "ready" && (
            <button onClick={logout} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><LogOut className="h-4 w-4" /> Sign out</button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {phase === "loading" && <div className="flex items-center justify-center py-32 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>}

        {phase === "anon" && (
          <div className="max-w-md mx-auto text-center py-20">
            <div className="h-14 w-14 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-5"><Building2 className="h-7 w-7" /></div>
            <h1 className="text-xl font-extrabold mb-2">Investor access</h1>
            <p className="text-sm text-muted-foreground">Please open the secure sign-in link we emailed you. It logs you in automatically — no password needed. If your link expired, reply to our email and we&apos;ll send a fresh one.</p>
          </div>
        )}

        {phase === "expired" && (
          <div className="max-w-md mx-auto text-center py-20">
            <div className="h-14 w-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5"><Building2 className="h-7 w-7" /></div>
            <h1 className="text-xl font-extrabold mb-2">This sign-in link has expired</h1>
            <p className="text-sm text-muted-foreground">For your security, each link works once and for a limited time. Reply to our invitation email and we&apos;ll send you a fresh one right away.</p>
          </div>
        )}

        {phase === "unavailable" && (
          <div className="max-w-md mx-auto text-center py-20">
            <div className="h-14 w-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5"><Building2 className="h-7 w-7" /></div>
            <h1 className="text-xl font-extrabold mb-2">We couldn&apos;t sign you in just now</h1>
            <p className="text-sm text-muted-foreground">Our sign-in service is temporarily unreachable. Your link is still valid — please try again in a moment.</p>
            <button onClick={() => window.location.reload()} className="btn btn-primary mt-6"><RefreshCw className="h-4 w-4" /> Try again</button>
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
          <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">
            <div className="space-y-6 min-w-0">
              <div>
                <span className="text-primary text-xs font-bold font-mono tracking-widest uppercase">Your deal flow</span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">Welcome, {investor.partner_name || investor.firm_name}</h1>
                <p className="text-sm text-muted-foreground mt-2 max-w-xl">
                  Founders hand-picked for your thesis. We keep it to a small, curated set — one click and we set up the intro for you.
                </p>
              </div>

              {skipMsg && (
                <div className="rounded-xl border border-border/50 bg-secondary/20 px-4 py-3 text-sm text-muted-foreground">
                  Noted — we&apos;ll bring you a fresh match next week. You can meet up to one founder per week.
                </div>
              )}

              {startups.length === 0 ? (
                <div className="glass-panel rounded-2xl border border-border/40 p-10 text-center text-sm text-muted-foreground">
                  No new matches right now. We&apos;re curating founders for your thesis and will notify you as they&apos;re added.
                </div>
              ) : (
                startups.map((s) => {
                  const requested = s.action === "requested";
                  const fit = overlap(s);
                  return (
                    <div key={s.id} className={`glass-panel rounded-2xl p-6 sm:p-7 ${s.sd_trained ? "border-2 border-emerald-500/60 shadow-lg shadow-emerald-500/10" : "border border-primary/25"}`}>
                      {s.sd_trained && (
                        <div className="-mx-6 sm:-mx-7 -mt-6 sm:-mt-7 mb-5 px-6 sm:px-7 py-2.5 rounded-t-2xl bg-emerald-500/10 border-b border-emerald-500/30 flex flex-wrap items-center gap-x-2 gap-y-1">
                          <BadgeCheck className="h-5 w-5 text-emerald-400" />
                          <span className="text-sm font-extrabold text-emerald-400">Startup Doktoru Verified</span>
                          <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                          <span className="text-xs text-muted-foreground">This team completed our founder training.</span>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary uppercase tracking-wider">
                          <Sparkles className="h-3.5 w-3.5" /> Matched for you
                        </span>
                        {(s.interest_count || 0) >= 2 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border bg-orange-500/10 text-orange-400 border-orange-500/20">
                            <Flame className="h-3 w-3" /> Trending
                          </span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-xl text-foreground inline-flex items-center gap-1.5">{s.startup_name}{s.sd_trained && <BadgeCheck className="h-5 w-5 text-emerald-400" />}</h3>
                      {s.one_liner && <p className="text-primary/90 mt-1">{s.one_liner}</p>}
                      {s.value_prop && <p className="text-sm text-muted-foreground mt-3 leading-relaxed whitespace-pre-line">{s.value_prop}</p>}

                      {fit.length > 0 && (
                        <p className="text-xs text-foreground/90 mt-4 rounded-lg bg-primary/5 border border-primary/15 px-3 py-2">
                          <span className="font-bold text-primary">Why this match:</span> overlaps with your focus on {fit.join(", ")}.
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2 mt-4">
                        {s.sectors?.slice(0, 5).map((x) => <span key={x} className="text-[11px] px-2 py-0.5 rounded bg-secondary/40 border border-border/40 text-muted-foreground">{x}</span>)}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground mt-4">
                        {s.product_stage && <span className="inline-flex items-center gap-1 text-foreground/90"><Layers className="h-3.5 w-3.5" /> {s.product_stage}</span>}
                        {s.valuation && <span className="inline-flex items-center gap-1 text-emerald-400">{s.valuation}</span>}
                        {s.team_size != null && <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {s.team_size} people</span>}
                        {s.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {s.city}</span>}
                      </div>

                      <div className="mt-6 pt-5 border-t border-border/20">
                        {requested ? (
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400 py-1.5">
                              <CheckCircle2 className="h-4 w-4" /> Meeting requested — we&apos;ll email you to set up the call
                            </div>
                            <div className="flex items-center gap-2">
                              {s.deck_url && <a href={s.deck_url} target="_blank" rel="noreferrer" onClick={() => trackClick(s.id, "deck")} className="btn btn-secondary btn-sm"><ExternalLink className="h-4 w-4" /> Deck</a>}
                              {s.website && <a href={s.website} target="_blank" rel="noreferrer" onClick={() => trackClick(s.id, "website")} className="btn btn-secondary btn-sm"><ExternalLink className="h-4 w-4" /> Website</a>}
                            </div>
                          </div>
                        ) : skippingId === s.id ? (
                          <div className="space-y-2.5">
                            <p className="text-xs text-muted-foreground">Why are you passing? Your answer helps our algorithm send you better startups next time.</p>
                            <div className="flex flex-wrap gap-1.5">
                              {SKIP_REASONS.map((r) => (
                                <button key={r} onClick={() => act(s.id, "skipped", r)} disabled={busyId === s.id}
                                  className="text-[11px] px-2.5 py-1 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-50">
                                  {r}
                                </button>
                              ))}
                            </div>
                            <div className="flex items-center gap-4 pt-0.5">
                              <button onClick={() => act(s.id, "skipped")} disabled={busyId === s.id} className="text-[11px] text-muted-foreground hover:text-foreground underline">Skip without a reason</button>
                              <button onClick={() => setSkippingId(null)} className="text-[11px] text-muted-foreground hover:text-foreground">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <button onClick={() => act(s.id, "requested")} disabled={busyId === s.id} className="btn btn-primary flex-1 min-w-56">
                                {busyId === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Handshake className="h-4 w-4" />} Request a meeting with {s.startup_name}
                              </button>
                              {s.deck_url && <a href={s.deck_url} target="_blank" rel="noreferrer" onClick={() => trackClick(s.id, "deck")} className="btn btn-secondary"><ExternalLink className="h-4 w-4" /> Deck</a>}
                              {s.website && <a href={s.website} target="_blank" rel="noreferrer" onClick={() => trackClick(s.id, "website")} className="btn btn-secondary"><ExternalLink className="h-4 w-4" /> Website</a>}
                            </div>
                            <div className="flex items-center justify-between gap-4 mt-3">
                              <p className="text-xs text-muted-foreground">One click, no commitment — we coordinate the call with the founder.</p>
                              <button onClick={() => setSkippingId(s.id)} disabled={busyId === s.id} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0">
                                <X className="h-3.5 w-3.5" /> Not for me
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <aside className="space-y-6">
              <ProfileCard investor={investor} onSave={saveProfile} />

              {news.length > 0 && (
                <div className="glass-panel rounded-2xl border border-border/40 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold inline-flex items-center gap-2"><Newspaper className="h-4 w-4 text-primary" /> Latest news</h2>
                    <Link href="/en/blog" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">All <ArrowRight className="h-3 w-3" /></Link>
                  </div>
                  <div className="space-y-4">
                    {news.map((p) => (
                      <Link key={p.slug} href={`/en/blog/${p.slug}`} className="flex gap-3 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {p.cover_image && <img src={p.cover_image} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" />}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground group-hover:text-primary leading-snug line-clamp-2">{p.title}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">{new Date(p.created_at).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        )}
      </main>

      {exitOpen && featured && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6" onClick={() => setExitOpen(false)}>
          <div className="glass-panel rounded-2xl border border-primary/25 p-7 max-w-md w-full text-center" onClick={(e) => e.stopPropagation()}>
            <div className="h-12 w-12 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4"><Handshake className="h-6 w-6" /></div>
            <h2 className="text-lg font-extrabold mb-2">Before you go — meet {featured.startup_name}?</h2>
            <p className="text-sm text-muted-foreground">{featured.one_liner || "This founder was matched to your thesis."} One click and we&apos;ll coordinate a short intro call — no commitment.</p>
            <div className="flex items-center gap-2 mt-6">
              <button onClick={() => { act(featured.id, "requested"); setExitOpen(false); }} className="btn btn-primary btn-sm flex-1"><Handshake className="h-4 w-4" /> Request a meeting</button>
              <button onClick={() => setExitOpen(false)} className="btn btn-secondary btn-sm">Not now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
