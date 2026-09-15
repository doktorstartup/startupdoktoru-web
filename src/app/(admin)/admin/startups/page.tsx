"use client";

import { useEffect, useState } from "react";
import { Loader2, Rocket, Check, X, ChevronDown, Search, Trash2, ExternalLink, Users, MapPin, Layers } from "lucide-react";

type Startup = {
  id: string;
  email: string | null;
  startup_name: string;
  one_liner: string | null;
  value_prop: string | null;
  deck_url: string | null;
  website: string | null;
  sectors: string[];
  stage: string | null;
  team_size: number | null;
  city: string | null;
  product_stage: string | null;
  valuation: string | null;
  status: "submitted" | "approved" | "rejected";
  notes: string | null;
  updated_at: string;
};

function getPw() { try { return sessionStorage.getItem("ds_admin_pw") || ""; } catch { return ""; } }

const STATUSES = [
  { v: "all", label: "Tümü" },
  { v: "submitted", label: "İncelemede" },
  { v: "approved", label: "Onaylı" },
  { v: "rejected", label: "Reddedilen" },
];
const BADGE: Record<string, string> = {
  submitted: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};
const TR: Record<string, string> = { submitted: "İncelemede", approved: "Onaylı", rejected: "Reddedildi" };

export default function StartupsAdmin() {
  const [items, setItems] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [fStatus, setFStatus] = useState("all");
  const [q, setQ] = useState("");

  const load = (silent = false) => {
    if (!silent) setLoading(true);
    const p = new URLSearchParams({ password: getPw() });
    if (fStatus !== "all") p.set("status", fStatus);
    if (q.trim()) p.set("q", q.trim());
    fetch(`/api/admin/startups?${p.toString()}`)
      .then((r) => r.json())
      .then((d) => setItems(d.startups || []))
      .catch(() => setItems([]))
      .finally(() => { if (!silent) setLoading(false); });
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [fStatus]);

  const act = async (payload: Record<string, unknown>) => {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/startups", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: getPw(), ...payload }),
      });
      const d = await r.json().catch(() => ({}));
      if (d.error) { alert(d.error); }
      load(true);
    } finally { setBusy(false); }
  };

  const counts = {
    total: items.length,
    submitted: items.filter((i) => i.status === "submitted").length,
    approved: items.filter((i) => i.status === "approved").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-primary text-xs font-bold font-mono tracking-widest uppercase">INVEST</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 flex items-center gap-2">
          <Rocket className="h-6 w-6 text-primary" /> Girişim Profilleri
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          Topluluktaki girişimcilerin kendi doldurduğu profiller. <strong className="text-foreground">Onayladıkların</strong> yatırımcı eşleştirmesine ve deal-flow&apos;una girer.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {[
          { label: "Toplam", val: counts.total },
          { label: "İncelemede", val: counts.submitted },
          { label: "Onaylı", val: counts.approved },
        ].map((s) => (
          <div key={s.label} className="glass-panel rounded-xl border border-border/40 px-4 py-2.5">
            <div className="text-xl font-extrabold font-mono text-foreground">{s.val}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="Ara: girişim / e-posta / pitch… (Enter)"
            className="w-full h-10 pl-9 pr-3 rounded-lg bg-background border border-border focus:border-primary/50 text-sm outline-none" />
        </div>
        <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="h-10 px-3 rounded-lg bg-background border border-border text-sm outline-none focus:border-primary/50">
          {STATUSES.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Henüz girişim profili yok. Girişimciler /portal/startup&apos;tan doldurur.</div>
      ) : (
        <div className="space-y-3">
          {items.map((s) => {
            const open = openId === s.id;
            return (
              <div key={s.id} className="glass-panel rounded-2xl border border-border/40 overflow-hidden">
                <div className="flex items-center justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-foreground truncate">{s.startup_name || "(isimsiz)"}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${BADGE[s.status]}`}>{TR[s.status]}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {s.one_liner || s.email}
                      {s.sectors?.length ? ` · ${s.sectors.join(", ")}` : ""}
                      {s.stage ? ` · ${s.stage}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {s.status !== "approved" && (
                      <button onClick={() => act({ action: "set_status", id: s.id, status: "approved" })} disabled={busy} title="Onayla"
                        className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 inline-flex items-center justify-center hover:bg-emerald-500/20"><Check className="h-4 w-4" /></button>
                    )}
                    {s.status !== "rejected" && (
                      <button onClick={() => act({ action: "set_status", id: s.id, status: "rejected" })} disabled={busy} title="Reddet"
                        className="h-8 w-8 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 inline-flex items-center justify-center hover:bg-red-500/20"><X className="h-4 w-4" /></button>
                    )}
                    <button onClick={() => setOpenId(open ? null : s.id)} className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground inline-flex items-center justify-center"><ChevronDown className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`} /></button>
                  </div>
                </div>

                {open && (
                  <div className="border-t border-border/30 p-5 space-y-4 bg-background/30 text-sm">
                    <div className="text-xs text-muted-foreground">{s.email}</div>
                    {s.value_prop && <div><div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Değer önerisi</div><p className="whitespace-pre-line text-foreground/90">{s.value_prop}</p></div>}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                      {s.product_stage && <span className="inline-flex items-center gap-1 text-foreground/90"><Layers className="h-3.5 w-3.5" /> {s.product_stage}</span>}
                      {s.valuation && <span className="inline-flex items-center gap-1 text-emerald-400">Değerleme: {s.valuation}</span>}
                      {s.team_size != null && <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {s.team_size} kişi</span>}
                      {s.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {s.city}</span>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {s.deck_url && <a href={s.deck_url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm"><ExternalLink className="h-3.5 w-3.5" /> Sunum</a>}
                      {s.website && <a href={s.website} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm"><ExternalLink className="h-3.5 w-3.5" /> Website</a>}
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">İç not</label>
                      <input defaultValue={s.notes || ""} onBlur={(e) => e.target.value !== (s.notes || "") && act({ action: "update", id: s.id, notes: e.target.value || null })}
                        placeholder="Admin notu…" className="w-full h-10 px-3 rounded-lg bg-background border border-border focus:border-primary/50 text-sm outline-none" />
                    </div>
                    <div className="pt-2 border-t border-border/20 flex justify-end">
                      <button onClick={() => { if (confirm(`${s.startup_name} profili silinsin mi?`)) act({ action: "delete", id: s.id }); }} disabled={busy}
                        className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1.5"><Trash2 className="h-3.5 w-3.5" /> Sil</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
