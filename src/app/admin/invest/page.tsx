"use client";

import { useEffect, useState } from "react";
import {
  Loader2, Plus, Trash2, ChevronDown, Building2, Check, X, ExternalLink, Search, ShieldCheck, Clock,
} from "lucide-react";

type Investor = {
  id: string;
  firm_name: string;
  partner_name: string | null;
  role: string | null;
  email: string | null;
  address_purpose: "outreach_published" | "personal" | "unknown";
  website: string | null;
  linkedin: string | null;
  twitter: string | null;
  thesis: string | null;
  sectors: string[];
  stages: string[];
  ticket: string | null;
  country: string | null;
  city: string | null;
  portfolio: string | null;
  source_url: string | null;
  verified_by: string | null;
  status: "pending" | "verified" | "rejected";
  tags: string[];
  notes: string | null;
  updated_at: string;
};

function getPw() {
  try { return sessionStorage.getItem("ds_admin_pw") || ""; } catch { return ""; }
}
const csv = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

const STATUSES = [
  { v: "all", label: "Tümü" },
  { v: "pending", label: "Bekleyen" },
  { v: "verified", label: "Onaylı" },
  { v: "rejected", label: "Reddedilen" },
];
const ADDR_PURPOSE = [
  { v: "unknown", label: "Bilinmiyor" },
  { v: "outreach_published", label: "Outreach için yayınlanmış (pitch@ / info@)" },
  { v: "personal", label: "Kişisel — yazma" },
];
const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  verified: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};
const STATUS_TR: Record<string, string> = { pending: "Bekliyor", verified: "Onaylı", rejected: "Reddedildi" };

export default function InvestAdmin() {
  const [items, setItems] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newFirm, setNewFirm] = useState("");

  const [fStatus, setFStatus] = useState("all");
  const [fSector, setFSector] = useState("");
  const [fStage, setFStage] = useState("");
  const [q, setQ] = useState("");

  const load = () => {
    setLoading(true);
    const p = new URLSearchParams({ password: getPw() });
    if (fStatus !== "all") p.set("status", fStatus);
    if (fSector) p.set("sector", fSector.trim());
    if (fStage) p.set("stage", fStage.trim());
    if (q.trim()) p.set("q", q.trim());
    fetch(`/api/admin/invest?${p.toString()}`)
      .then((r) => r.json())
      .then((d) => setItems(d.investors || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [fStatus, fSector, fStage]);

  const act = async (payload: Record<string, unknown>) => {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/invest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: getPw(), ...payload }),
      });
      const d = await r.json().catch(() => ({}));
      if (d.error) alert(d.error);
      load();
    } finally {
      setBusy(false);
    }
  };

  const createInvestor = async () => {
    if (!newFirm.trim()) return;
    await act({ action: "create", firm_name: newFirm.trim() });
    setNewFirm("");
    setCreating(false);
  };

  const counts = {
    total: items.length,
    pending: items.filter((i) => i.status === "pending").length,
    verified: items.filter((i) => i.status === "verified").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-4">
        <div>
          <span className="text-primary text-xs font-bold font-mono tracking-widest uppercase">INVEST</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" /> Yatırımcı Ağı
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Kaynaklı, insan-onaylı TR yatırımcı veritabanı. Her satır <strong className="text-foreground">kaynak (source_url)</strong> ve
            <strong className="text-foreground"> onay</strong> ister — kaynaksız satır &quot;onaylı&quot; yapılamaz.
          </p>
        </div>
        <button onClick={() => setCreating((v) => !v)} disabled={busy} className="btn btn-primary shrink-0">
          <Plus className="h-4 w-4" /> Yatırımcı
        </button>
      </div>

      {/* İstatistik */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "Toplam", val: counts.total },
          { label: "Bekleyen", val: counts.pending },
          { label: "Onaylı", val: counts.verified },
        ].map((s) => (
          <div key={s.label} className="glass-panel rounded-xl border border-border/40 px-4 py-2.5">
            <div className="text-xl font-extrabold font-mono text-foreground">{s.val}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Yeni yatırımcı */}
      {creating && (
        <div className="glass-panel rounded-2xl border border-primary/30 p-4 flex flex-col sm:flex-row gap-3">
          <input
            autoFocus value={newFirm} onChange={(e) => setNewFirm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createInvestor()}
            placeholder="Firma / fon adı (ör. 500 Istanbul)"
            className="flex-1 h-11 px-4 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none"
          />
          <button onClick={createInvestor} disabled={busy || !newFirm.trim()} className="btn btn-primary">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ekle & Düzenle"}
          </button>
        </div>
      )}

      {/* Filtreler */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="Ara: firma / partner / e-posta / tez… (Enter)"
            className="w-full h-10 pl-9 pr-3 rounded-lg bg-background border border-border focus:border-primary/50 text-sm outline-none"
          />
        </div>
        <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="h-10 px-3 rounded-lg bg-background border border-border text-sm outline-none focus:border-primary/50">
          {STATUSES.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
        </select>
        <input value={fSector} onChange={(e) => setFSector(e.target.value)} placeholder="Sektör" className="h-10 w-28 px-3 rounded-lg bg-background border border-border text-sm outline-none focus:border-primary/50" />
        <input value={fStage} onChange={(e) => setFStage(e.target.value)} placeholder="Stage" className="h-10 w-28 px-3 rounded-lg bg-background border border-border text-sm outline-none focus:border-primary/50" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          Kayıt yok. <strong className="text-foreground">Yatırımcı</strong> ile ekle veya filtreyi değiştir.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((inv) => {
            const open = openId === inv.id;
            return (
              <div key={inv.id} className="glass-panel rounded-2xl border border-border/40 overflow-hidden">
                <div className="flex items-center justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-foreground truncate">{inv.firm_name}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${STATUS_BADGE[inv.status]}`}>{STATUS_TR[inv.status]}</span>
                      {!inv.source_url && <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border bg-secondary/40 text-muted-foreground border-border/40">kaynaksız</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {[inv.partner_name, inv.role].filter(Boolean).join(" · ")}
                      {inv.sectors?.length ? ` · ${inv.sectors.join(", ")}` : ""}
                      {inv.stages?.length ? ` · ${inv.stages.join("/")}` : ""}
                      {inv.city ? ` · ${inv.city}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {inv.status !== "verified" && (
                      <button onClick={() => act({ action: "set_status", id: inv.id, status: "verified" })} disabled={busy} title="Onayla"
                        className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 inline-flex items-center justify-center hover:bg-emerald-500/20"><Check className="h-4 w-4" /></button>
                    )}
                    {inv.status !== "rejected" && (
                      <button onClick={() => act({ action: "set_status", id: inv.id, status: "rejected" })} disabled={busy} title="Reddet"
                        className="h-8 w-8 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 inline-flex items-center justify-center hover:bg-red-500/20"><X className="h-4 w-4" /></button>
                    )}
                    <button onClick={() => setOpenId(open ? null : inv.id)} className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground inline-flex items-center justify-center"><ChevronDown className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`} /></button>
                  </div>
                </div>

                {open && <EditPanel inv={inv} act={act} busy={busy} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Düzenleme paneli (alan blur'da otomatik kaydeder — automations deseni) ──
function EditPanel({ inv, act, busy }: { inv: Investor; act: (p: Record<string, unknown>) => void; busy: boolean }) {
  const save = (field: string, value: unknown) => act({ action: "update", id: inv.id, [field]: value });
  const inputCls = "w-full h-10 px-3 rounded-lg bg-background border border-border focus:border-primary/50 text-sm outline-none";
  const labelCls = "text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1";

  const Text = ({ label, field, ph }: { label: string; field: keyof Investor; ph?: string }) => (
    <div>
      <label className={labelCls}>{label}</label>
      <input defaultValue={(inv[field] as string) || ""} placeholder={ph}
        onBlur={(e) => e.target.value !== (inv[field] || "") && save(field, e.target.value || null)} className={inputCls} />
    </div>
  );
  const Arr = ({ label, field, ph }: { label: string; field: "sectors" | "stages" | "tags"; ph?: string }) => (
    <div>
      <label className={labelCls}>{label} <span className="normal-case font-normal text-muted-foreground/60">(virgülle)</span></label>
      <input defaultValue={(inv[field] || []).join(", ")} placeholder={ph}
        onBlur={(e) => { const a = csv(e.target.value); if (a.join(",") !== (inv[field] || []).join(",")) save(field, a); }} className={inputCls} />
    </div>
  );

  return (
    <div className="border-t border-border/30 p-5 space-y-4 bg-background/30">
      <div className="grid sm:grid-cols-3 gap-3">
        <Text label="Firma / Fon" field="firm_name" />
        <Text label="Partner" field="partner_name" ph="Ad Soyad" />
        <Text label="Ünvan" field="role" ph="Managing Partner" />
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Text label="E-posta" field="email" ph="pitch@fon.com" />
        <div>
          <label className={labelCls}>E-posta amacı</label>
          <select defaultValue={inv.address_purpose} onChange={(e) => save("address_purpose", e.target.value)} className={inputCls}>
            {ADDR_PURPOSE.map((a) => <option key={a.v} value={a.v}>{a.label}</option>)}
          </select>
        </div>
        <Text label="Ticket" field="ticket" ph="$100K–$1M" />
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Arr label="Sektörler" field="sectors" ph="fintech, saas" />
        <Arr label="Stage" field="stages" ph="pre-seed, seed" />
        <div className="grid grid-cols-2 gap-3">
          <Text label="Ülke" field="country" ph="TR" />
          <Text label="Şehir" field="city" ph="İstanbul" />
        </div>
      </div>

      <div>
        <label className={labelCls}>Yatırım tezi</label>
        <textarea defaultValue={inv.thesis || ""} onBlur={(e) => e.target.value !== (inv.thesis || "") && save("thesis", e.target.value || null)}
          placeholder="Neye yatırım yapıyor, nasıl bir girişim arıyor…" className="w-full h-20 p-3 rounded-lg bg-background border border-border focus:border-primary/50 text-sm outline-none resize-y" />
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Text label="Website" field="website" ph="https://" />
        <Text label="LinkedIn" field="linkedin" ph="https://linkedin.com/…" />
        <Text label="Twitter/X" field="twitter" ph="@handle" />
      </div>

      <div>
        <label className={labelCls}>Portföy / son yatırımlar</label>
        <textarea defaultValue={inv.portfolio || ""} onBlur={(e) => e.target.value !== (inv.portfolio || "") && save("portfolio", e.target.value || null)}
          placeholder="Öne çıkan portföy şirketleri…" className="w-full h-16 p-3 rounded-lg bg-background border border-border focus:border-primary/50 text-sm outline-none resize-y" />
      </div>

      {/* Kaynak — onay için ZORUNLU */}
      <div className="rounded-xl border border-primary/25 bg-primary/[0.04] p-3">
        <label className={labelCls}><ShieldCheck className="inline h-3.5 w-3.5 text-primary mr-1" /> Kaynak URL <span className="text-primary">(onay için zorunlu)</span></label>
        <div className="flex items-center gap-2">
          <input defaultValue={inv.source_url || ""} placeholder="Bu bilginin alındığı halka açık sayfa"
            onBlur={(e) => e.target.value !== (inv.source_url || "") && save("source_url", e.target.value || null)} className={inputCls} />
          {inv.source_url && (
            <a href={inv.source_url} target="_blank" rel="noreferrer" className="h-10 w-10 shrink-0 rounded-lg bg-secondary/40 border border-border inline-flex items-center justify-center text-muted-foreground hover:text-foreground"><ExternalLink className="h-4 w-4" /></a>
          )}
        </div>
        {inv.verified_by && <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1"><Clock className="h-3 w-3" /> Onaylayan: {inv.verified_by}</p>}
      </div>

      <div>
        <label className={labelCls}>Not</label>
        <input defaultValue={inv.notes || ""} onBlur={(e) => e.target.value !== (inv.notes || "") && save("notes", e.target.value || null)}
          placeholder="İç not…" className={inputCls} />
      </div>

      <div className="pt-2 border-t border-border/20 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">Değişiklikler otomatik kaydedilir (alan dışına tıkla).</span>
        <button onClick={() => { if (confirm(`${inv.firm_name} silinsin mi?`)) act({ action: "delete", id: inv.id }); }} disabled={busy}
          className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1.5"><Trash2 className="h-3.5 w-3.5" /> Sil</button>
      </div>
    </div>
  );
}
