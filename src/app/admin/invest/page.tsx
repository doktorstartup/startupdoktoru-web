"use client";

import { useEffect, useState } from "react";
import {
  Loader2, Plus, Trash2, ChevronDown, Building2, Check, X, ExternalLink, Search, ShieldCheck, Clock, Send,
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
  const [mailId, setMailId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newFirm, setNewFirm] = useState("");

  const [fStatus, setFStatus] = useState("all");
  const [fSector, setFSector] = useState("");
  const [fStage, setFStage] = useState("");
  const [q, setQ] = useState("");

  // silent=true → listeyi spinner'la değiştirme (arka plan tazeleme; form odağı bozulmasın).
  const load = (silent = false) => {
    if (!silent) setLoading(true);
    const p = new URLSearchParams({ password: getPw() });
    if (fStatus !== "all") p.set("status", fStatus);
    if (fSector) p.set("sector", fSector.trim());
    if (fStage) p.set("stage", fStage.trim());
    if (q.trim()) p.set("q", q.trim());
    fetch(`/api/admin/invest?${p.toString()}`)
      .then((r) => r.json())
      .then((d) => setItems(d.investors || []))
      .catch(() => setItems([]))
      .finally(() => { if (!silent) setLoading(false); });
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [fStatus, fSector, fStage]);

  // Tek satırı yerelde güncelle — alan kaydında listeyi yeniden çekmeye gerek yok.
  const patchItem = (id: string, patch: Partial<Investor>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const act = async (payload: Record<string, unknown>, opts?: { refresh?: boolean }) => {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/invest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: getPw(), ...payload }),
      });
      const d = await r.json().catch(() => ({}));
      if (d.error) {
        alert(d.error);
        load(true); // hata → sunucu gerçeğine dön
        return;
      }
      if (opts?.refresh !== false) load(true);
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
                    <button onClick={() => setMailId(mailId === inv.id ? null : inv.id)} disabled={busy} title="Mail at"
                      className="h-8 w-8 rounded-lg bg-sky-500/10 border border-sky-500/25 text-sky-400 inline-flex items-center justify-center hover:bg-sky-500/20"><Send className="h-4 w-4" /></button>
                    <button onClick={() => setOpenId(open ? null : inv.id)} className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground inline-flex items-center justify-center"><ChevronDown className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`} /></button>
                  </div>
                </div>

                {mailId === inv.id && <MailPanel inv={inv} onClose={() => setMailId(null)} />}
                {open && <EditPanel inv={inv} act={act} busy={busy} patchItem={patchItem} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── 1:1 mail paneli (kart üstündeki "Mail at") ──
function MailPanel({ inv, onClose }: { inv: Investor; onClose: () => void }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");
  const canSend = !!inv.email && inv.email.includes("@");

  const send = async () => {
    if (!subject.trim() || !body.trim()) { setMsg("Konu ve içerik gerekli."); return; }
    setSending(true); setMsg("");
    try {
      const res = await fetch("/api/admin/invest/send", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: getPw(), investorId: inv.id, subject, body_html: body }),
      });
      const d = await res.json();
      if (!res.ok) setMsg(d.error || "Hata.");
      else if (d.skipped) setMsg("Resend yapılandırılmamış — gönderilemedi.");
      else if (d.sent) { setMsg("Gönderildi ✓ — Mail Trafiği'nden aç/tıkla/cevabı takip et."); setSubject(""); setBody(""); }
      else setMsg("Gönderilemedi.");
    } catch {
      setMsg("Bağlantı hatası.");
    } finally { setSending(false); }
  };

  return (
    <div className="border-t border-border/30 p-5 space-y-3 bg-sky-500/[0.03]">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold flex items-center gap-2"><Send className="h-4 w-4 text-sky-400" /> Mail at</div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>
      {canSend ? (
        <>
          <div className="text-xs text-muted-foreground">
            Alıcı: <span className="text-foreground font-semibold">{inv.email}</span> · cevaplar Mail Trafiği&apos;ne düşer.
            Değişkenler: <code>{"{{firm}}"}</code>, <code>{"{{partner}}"}</code>.
          </div>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Konu"
            className="w-full h-10 px-3 rounded-lg bg-background border border-border focus:border-primary/50 text-sm outline-none" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={7} placeholder="İçerik (HTML destekli)…"
            className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary/50 text-sm outline-none font-mono" />
          <div className="flex items-center gap-3">
            <button onClick={send} disabled={sending} className="btn btn-primary gap-2 text-sm">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Gönder
            </button>
            {msg && <span className="text-sm text-primary">{msg}</span>}
          </div>
        </>
      ) : (
        <div className="text-sm text-amber-400">Bu yatırımcının kayıtlı e-postası yok — önce düzenleyip e-posta ekleyin.</div>
      )}
    </div>
  );
}

// Ortak sınıflar + alan bileşenleri MODÜL seviyesinde: render içinde tanımlanırsa React
// her render'da yeni bileşen sanıp input'u söker-takar (odak kaybı, alanın sıfırlanması).
const inputCls = "w-full h-10 px-3 rounded-lg bg-background border border-border focus:border-primary/50 text-sm outline-none";
const labelCls = "text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1";

function Field({ label, value, ph, onSave }: { label: string; value: string; ph?: string; onSave: (v: string) => void }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <input defaultValue={value} placeholder={ph}
        onBlur={(e) => e.target.value !== value && onSave(e.target.value)} className={inputCls} />
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

// ── Düzenleme paneli (alan blur'da otomatik kaydeder — automations deseni) ──
function EditPanel({ inv, act, busy, patchItem }: {
  inv: Investor;
  act: (p: Record<string, unknown>, o?: { refresh?: boolean }) => void;
  busy: boolean;
  patchItem: (id: string, patch: Partial<Investor>) => void;
}) {
  // Alan kaydı: önce yerelde güncelle (anında), sonra sunucuya yaz — liste yeniden çekilmez.
  const save = (field: string, value: unknown) => {
    patchItem(inv.id, { [field]: value } as Partial<Investor>);
    act({ action: "update", id: inv.id, [field]: value }, { refresh: false });
  };

  return (
    <div className="border-t border-border/30 p-5 space-y-4 bg-background/30">
      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="Firma / Fon" value={inv.firm_name || ""} onSave={(v) => v.trim() && save("firm_name", v.trim())} />
        <Field label="Partner" value={inv.partner_name || ""} ph="Ad Soyad" onSave={(v) => save("partner_name", v || null)} />
        <Field label="Ünvan" value={inv.role || ""} ph="Managing Partner" onSave={(v) => save("role", v || null)} />
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="E-posta" value={inv.email || ""} ph="pitch@fon.com" onSave={(v) => save("email", v || null)} />
        <div>
          <label className={labelCls}>E-posta amacı</label>
          <select defaultValue={inv.address_purpose} onChange={(e) => save("address_purpose", e.target.value)} className={inputCls}>
            {ADDR_PURPOSE.map((a) => <option key={a.v} value={a.v}>{a.label}</option>)}
          </select>
        </div>
        <Field label="Ticket" value={inv.ticket || ""} ph="$100K–$1M" onSave={(v) => save("ticket", v || null)} />
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <ArrField label="Sektörler" value={inv.sectors || []} ph="fintech, saas" onSave={(v) => save("sectors", v)} />
        <ArrField label="Stage" value={inv.stages || []} ph="pre-seed, seed" onSave={(v) => save("stages", v)} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ülke" value={inv.country || ""} ph="TR" onSave={(v) => save("country", v || null)} />
          <Field label="Şehir" value={inv.city || ""} ph="İstanbul" onSave={(v) => save("city", v || null)} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Yatırım tezi</label>
        <textarea defaultValue={inv.thesis || ""} onBlur={(e) => e.target.value !== (inv.thesis || "") && save("thesis", e.target.value || null)}
          placeholder="Neye yatırım yapıyor, nasıl bir girişim arıyor…" className="w-full h-20 p-3 rounded-lg bg-background border border-border focus:border-primary/50 text-sm outline-none resize-y" />
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="Website" value={inv.website || ""} ph="https://" onSave={(v) => save("website", v || null)} />
        <Field label="LinkedIn" value={inv.linkedin || ""} ph="https://linkedin.com/…" onSave={(v) => save("linkedin", v || null)} />
        <Field label="Twitter/X" value={inv.twitter || ""} ph="@handle" onSave={(v) => save("twitter", v || null)} />
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
