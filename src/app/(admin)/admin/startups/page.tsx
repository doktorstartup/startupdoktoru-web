"use client";

import { useEffect, useState } from "react";
import { Loader2, Rocket, Check, X, ChevronDown, Search, Trash2, ExternalLink, Plus } from "lucide-react";

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
const csv = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

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
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
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

  const patchItem = (id: string, patch: Partial<Startup>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const act = async (payload: Record<string, unknown>, opts?: { refresh?: boolean }) => {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/startups", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: getPw(), ...payload }),
      });
      const d = await r.json().catch(() => ({}));
      if (d.error) { alert(d.error); load(true); return d; }
      if (opts?.refresh !== false) load(true);
      return d;
    } finally { setBusy(false); }
  };

  const createStartup = async () => {
    if (!newName.trim()) return;
    const d = await act({ action: "create", startup_name: newName.trim() });
    setNewName(""); setCreating(false);
    if (d?.id) setOpenId(d.id);
  };

  const counts = {
    total: items.length,
    submitted: items.filter((i) => i.status === "submitted").length,
    approved: items.filter((i) => i.status === "approved").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-4">
        <div>
          <span className="text-primary text-xs font-bold font-mono tracking-widest uppercase">INVEST</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 flex items-center gap-2">
            <Rocket className="h-6 w-6 text-primary" /> Girişim Profilleri
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Girişimciler kendi profilini doldurur; buradan da <strong className="text-foreground">elle ekleyebilirsin</strong> (kayıt olmayan founder'lar için). <strong className="text-foreground">Onayladıkların</strong> eşleştirmeye ve yatırımcı deal-flow&apos;una girer.
          </p>
        </div>
        <button onClick={() => setCreating((v) => !v)} disabled={busy} className="btn btn-primary shrink-0">
          <Plus className="h-4 w-4" /> Girişim Ekle
        </button>
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

      {creating && (
        <div className="glass-panel rounded-2xl border border-primary/30 p-4 flex flex-col sm:flex-row gap-3">
          <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createStartup()}
            placeholder="Girişim adı (ör. Creato AI)"
            className="flex-1 h-11 px-4 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none" />
          <button onClick={createStartup} disabled={busy || !newName.trim()} className="btn btn-primary">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ekle & Düzenle"}
          </button>
        </div>
      )}

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
        <div className="text-center py-16 text-muted-foreground text-sm">Henüz girişim profili yok. <strong className="text-foreground">Girişim Ekle</strong> ile ekle ya da girişimciler /portal/startup&apos;tan doldursun.</div>
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
                      {s.valuation && <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{s.valuation.slice(0, 24)}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {s.one_liner || s.email}
                      {s.product_stage ? ` · ${s.product_stage}` : ""}
                      {s.sectors?.length ? ` · ${s.sectors.join(", ")}` : ""}
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

                {open && <EditPanel s={s} act={act} busy={busy} patchItem={patchItem} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Alan bileşenleri MODÜL seviyesinde (render içinde tanımlanırsa odak kaybı olur — invest deseni).
const inputCls = "w-full h-10 px-3 rounded-lg bg-background border border-border focus:border-primary/50 text-sm outline-none";
const labelCls = "text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1";

function Field({ label, value, ph, onSave }: { label: string; value: string; ph?: string; onSave: (v: string) => void }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <input defaultValue={value} placeholder={ph} onBlur={(e) => e.target.value !== value && onSave(e.target.value)} className={inputCls} />
    </div>
  );
}

function ArrField({ label, value, ph, onSave }: { label: string; value: string[]; ph?: string; onSave: (v: string[]) => void }) {
  return (
    <div>
      <label className={labelCls}>{label} <span className="normal-case font-normal text-muted-foreground/60">(virgülle)</span></label>
      <input defaultValue={value.join(", ")} placeholder={ph}
        onBlur={(e) => { const a = csv(e.target.value); if (a.join(",") !== value.join(",")) onSave(a); }} className={inputCls} />
    </div>
  );
}

function EditPanel({ s, act, busy, patchItem }: {
  s: Startup;
  act: (p: Record<string, unknown>, o?: { refresh?: boolean }) => void;
  busy: boolean;
  patchItem: (id: string, patch: Partial<Startup>) => void;
}) {
  const save = (field: string, value: unknown) => {
    patchItem(s.id, { [field]: value } as Partial<Startup>);
    act({ action: "update", id: s.id, [field]: value }, { refresh: false });
  };

  return (
    <div className="border-t border-border/30 p-5 space-y-4 bg-background/30">
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Girişim adı" value={s.startup_name || ""} onSave={(v) => v.trim() && save("startup_name", v.trim())} />
        <Field label="Website" value={s.website || ""} ph="https://" onSave={(v) => save("website", v || null)} />
      </div>

      <div>
        <label className={labelCls}>Asansör konuşması (tek cümle)</label>
        <textarea defaultValue={s.one_liner || ""} onBlur={(e) => e.target.value !== (s.one_liner || "") && save("one_liner", e.target.value || null)}
          placeholder="Tek cümlede ne yapıyor…" className="w-full h-16 p-3 rounded-lg bg-background border border-border focus:border-primary/50 text-sm outline-none resize-y" />
      </div>

      <div>
        <label className={labelCls}>Değer önerisi</label>
        <textarea defaultValue={s.value_prop || ""} onBlur={(e) => e.target.value !== (s.value_prop || "") && save("value_prop", e.target.value || null)}
          placeholder="Problem, çözüm, neden şimdi, farkı…" className="w-full h-24 p-3 rounded-lg bg-background border border-border focus:border-primary/50 text-sm outline-none resize-y" />
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="Ürün durumu" value={s.product_stage || ""} ph="MVP / MRR / Growth" onSave={(v) => save("product_stage", v || null)} />
        <Field label="Değerleme" value={s.valuation || ""} ph="$500K / DCF…" onSave={(v) => save("valuation", v || null)} />
        <div>
          <label className={labelCls}>Ekip (kişi)</label>
          <input type="number" min={1} defaultValue={s.team_size ?? ""} placeholder="4"
            onBlur={(e) => { const n = e.target.value === "" ? null : Number(e.target.value); if (n !== s.team_size) save("team_size", n); }} className={inputCls} />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <ArrField label="Sektörler" value={s.sectors || []} ph="ecommerce, ai" onSave={(v) => save("sectors", v)} />
        <Field label="Şehir" value={s.city || ""} ph="İstanbul" onSave={(v) => save("city", v || null)} />
        <Field label="E-posta" value={s.email || ""} ph="founder@…" onSave={(v) => save("email", v || null)} />
      </div>

      <div className="rounded-xl border border-primary/25 bg-primary/[0.04] p-3">
        <label className={labelCls}>Sunum / pitch deck linki</label>
        <div className="flex items-center gap-2">
          <input defaultValue={s.deck_url || ""} placeholder="https://drive.google.com/…"
            onBlur={(e) => e.target.value !== (s.deck_url || "") && save("deck_url", e.target.value || null)} className={inputCls} />
          {s.deck_url && <a href={s.deck_url} target="_blank" rel="noreferrer" className="h-10 w-10 shrink-0 rounded-lg bg-secondary/40 border border-border inline-flex items-center justify-center text-muted-foreground hover:text-foreground"><ExternalLink className="h-4 w-4" /></a>}
        </div>
      </div>

      <div>
        <label className={labelCls}>İç not (admin)</label>
        <input defaultValue={s.notes || ""} onBlur={(e) => e.target.value !== (s.notes || "") && save("notes", e.target.value || null)} placeholder="Admin notu…" className={inputCls} />
      </div>

      <div className="pt-2 border-t border-border/20 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">Değişiklikler otomatik kaydedilir (alan dışına tıkla).</span>
        <button onClick={() => { if (confirm(`${s.startup_name} profili silinsin mi?`)) act({ action: "delete", id: s.id }); }} disabled={busy}
          className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1.5"><Trash2 className="h-3.5 w-3.5" /> Sil</button>
      </div>
    </div>
  );
}
