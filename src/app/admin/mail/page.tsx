"use client";

import { useEffect, useState } from "react";
import {
  Loader2, Mail, Send, Search, Inbox, CheckCircle2, MousePointerClick, Eye,
  AlertTriangle, Ban, XCircle, RefreshCw, Building2, ShieldOff, Plus, Trash2,
} from "lucide-react";

type Message = {
  id: string;
  context: string;
  context_ref: string | null;
  to_email: string;
  subject: string | null;
  status: string;
  error: string | null;
  open_count: number;
  click_count: number;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  created_at: string;
};
type Inbound = {
  id: string;
  from_email: string | null;
  from_name: string | null;
  subject: string | null;
  preview: string | null;
  handled: boolean;
  received_at: string;
  matched_investor: { firm_name: string } | null;
};
type Suppression = {
  id: string;
  email: string;
  reason: "bounced" | "complained" | "unsubscribed" | "manual";
  source: string | null;
  created_at: string;
};
type Stats = {
  total: number; delivered: number; opened: number; clicked: number;
  bounced: number; complained: number; failed: number; inboundTotal: number; inboundNew: number;
  suppressedTotal: number;
};

function getPw() {
  try { return sessionStorage.getItem("ds_admin_pw") || ""; } catch { return ""; }
}

const CONTEXTS = [
  { v: "all", label: "Tümü" },
  { v: "drip", label: "Drip" },
  { v: "broadcast", label: "Bülten" },
  { v: "invest", label: "Yatırımcı" },
  { v: "test", label: "Test" },
];
const STATUS_BADGE: Record<string, string> = {
  sent: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  delivered: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  opened: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  clicked: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  bounced: "bg-red-500/10 text-red-400 border-red-500/20",
  complained: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
  queued: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  suppressed: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};
const STATUS_TR: Record<string, string> = {
  sent: "Gönderildi", delivered: "Teslim", opened: "Açıldı", clicked: "Tıklandı",
  bounced: "Bounce", complained: "Şikâyet", failed: "Başarısız", queued: "Sırada",
  suppressed: "Engellendi",
};
const REASON_TR: Record<string, string> = {
  bounced: "Ulaşılamadı", complained: "Şikâyet etti", unsubscribed: "Çıktı", manual: "Elle eklendi",
};
const CTX_TR: Record<string, string> = { drip: "Drip", broadcast: "Bülten", invest: "Yatırımcı", test: "Test", transactional: "Sistem" };

const fmt = (s: string | null) => (s ? new Date(s).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—");

export default function MailAdmin() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inbound, setInbound] = useState<Inbound[]>([]);
  const [suppressions, setSuppressions] = useState<Suppression[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"out" | "in" | "compose" | "blocked">("out");

  const [context, setContext] = useState("all");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams({ password: getPw(), context, status, q });
    try {
      const res = await fetch(`/api/admin/mail?${params}`);
      const d = await res.json();
      if (res.ok) {
        setStats(d.stats);
        setMessages(d.messages || []);
        setInbound(d.inbound || []);
        setSuppressions(d.suppressions || []);
      }
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps -- bilinçli mount/filtre yüklemesi
  useEffect(() => { load(); }, [context, status, q]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-accent mb-1">MAIL İZLEME</p>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3"><Mail className="h-7 w-7 text-primary" /> Mail Trafiği</h1>
          <p className="text-sm text-muted-foreground mt-1">Giden mailler, açılma/tıklama/bounce ve gelen cevaplar tek yerde.</p>
        </div>
        <button onClick={load} className="btn btn-ghost gap-2 text-sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Yenile
        </button>
      </div>

      {/* İstatistik kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        <StatCard icon={Send} label="Gönderildi" value={stats?.total} tone="text-sky-400" />
        <StatCard icon={CheckCircle2} label="Teslim" value={stats?.delivered} tone="text-blue-400" />
        <StatCard icon={Eye} label="Açıldı" value={stats?.opened} tone="text-amber-400" />
        <StatCard icon={MousePointerClick} label="Tıklandı" value={stats?.clicked} tone="text-emerald-400" />
        <StatCard icon={AlertTriangle} label="Bounce" value={stats?.bounced} tone="text-red-400" />
        <StatCard icon={Ban} label="Şikâyet" value={stats?.complained} tone="text-fuchsia-400" />
        <StatCard icon={ShieldOff} label="Engelli" value={stats?.suppressedTotal} tone="text-slate-400" />
        <StatCard icon={Inbox} label="Cevap" value={stats?.inboundTotal} sub={stats?.inboundNew ? `${stats.inboundNew} yeni` : undefined} tone="text-primary" />
      </div>

      {/* Sekmeler */}
      <div className="flex gap-2 mb-4">
        <TabBtn active={tab === "out"} onClick={() => setTab("out")}>Giden Mailler</TabBtn>
        <TabBtn active={tab === "in"} onClick={() => setTab("in")}>
          Gelen Cevaplar{stats?.inboundNew ? <span className="ml-2 px-1.5 py-0.5 rounded-full bg-primary text-background text-[10px] font-bold">{stats.inboundNew}</span> : null}
        </TabBtn>
        <TabBtn active={tab === "compose"} onClick={() => setTab("compose")}>Yatırımcıya Gönder</TabBtn>
        <TabBtn active={tab === "blocked"} onClick={() => setTab("blocked")}>Engellenenler</TabBtn>
      </div>

      {tab === "out" && (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="E-posta veya konu ara…"
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none" />
            </div>
            <select value={context} onChange={(e) => setContext(e.target.value)} className="h-10 px-3 rounded-xl bg-background border border-border text-sm outline-none">
              {CONTEXTS.map((c) => <option key={c.v} value={c.v}>{c.label}</option>)}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 px-3 rounded-xl bg-background border border-border text-sm outline-none">
              <option value="all">Tüm durumlar</option>
              {Object.keys(STATUS_TR).map((s) => <option key={s} value={s}>{STATUS_TR[s]}</option>)}
            </select>
          </div>

          <div className="glass-panel rounded-2xl border border-border/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/40">
                  <th className="px-4 py-3">Alıcı</th>
                  <th className="px-4 py-3">Konu</th>
                  <th className="px-4 py-3">Kaynak</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3 text-center">Açılma</th>
                  <th className="px-4 py-3 text-center">Tıklama</th>
                  <th className="px-4 py-3">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline" /></td></tr>}
                {!loading && messages.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Kayıt yok.</td></tr>}
                {!loading && messages.map((m) => (
                  <tr key={m.id} className="border-b border-border/20 hover:bg-secondary/20">
                    <td className="px-4 py-3 font-medium">{m.to_email}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[220px] truncate">{m.subject || "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{CTX_TR[m.context] || m.context}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold border ${STATUS_BADGE[m.status] || STATUS_BADGE.queued}`}>{STATUS_TR[m.status] || m.status}</span>
                      {m.error && <span title={m.error} className="ml-1 text-red-400 text-xs">⚠</span>}
                    </td>
                    <td className="px-4 py-3 text-center">{m.open_count > 0 ? m.open_count : "—"}</td>
                    <td className="px-4 py-3 text-center">{m.click_count > 0 ? m.click_count : "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{fmt(m.sent_at || m.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Not: “Açıldı” sinyali (Apple Mail gizliliği vb.) her zaman güvenilmez; “Tıklandı” daha sağlam ilgi göstergesidir.</p>
        </>
      )}

      {tab === "in" && <InboundList inbound={inbound} loading={loading} onChange={load} />}
      {tab === "compose" && <Composer onSent={load} />}
      {tab === "blocked" && <BlockedList rows={suppressions} loading={loading} onChange={load} />}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value?: number; sub?: string; tone: string }) {
  return (
    <div className="glass-panel rounded-2xl border border-border/50 p-4">
      <Icon className={`h-4 w-4 ${tone} mb-2`} />
      <div className="text-2xl font-extrabold">{value ?? "—"}</div>
      <div className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</div>
      {sub && <div className="text-[11px] text-primary font-semibold mt-0.5">{sub}</div>}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`px-4 h-10 rounded-xl text-sm font-semibold transition-all flex items-center ${active ? "bg-primary text-background" : "bg-secondary/40 text-muted-foreground hover:text-foreground"}`}>
      {children}
    </button>
  );
}

function InboundList({ inbound, loading, onChange }: { inbound: Inbound[]; loading: boolean; onChange: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const post = (payload: Record<string, unknown>) =>
    fetch("/api/admin/mail", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: getPw(), ...payload }) });

  const toggle = async (id: string, handled: boolean) => {
    setBusy(id);
    try {
      await post({ action: "mark_handled", id, handled });
      onChange();
    } finally { setBusy(null); }
  };

  // "çıkar / yazma" diyen kişiyi tek tıkla engelle + işlendi işaretle.
  const block = async (r: Inbound) => {
    if (!r.from_email) return;
    if (!confirm(`${r.from_email} engelleme listesine eklensin mi? Bu adrese bir daha mail gitmez.`)) return;
    setBusy(r.id);
    try {
      await post({ action: "suppress_add", email: r.from_email, notes: `Cevapta çıkış istedi: ${r.subject || ""}`.slice(0, 200) });
      await post({ action: "mark_handled", id: r.id, handled: true });
      onChange();
    } finally { setBusy(null); }
  };
  if (loading) return <div className="py-10 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline" /></div>;
  if (inbound.length === 0) return <div className="glass-panel rounded-2xl border border-border/50 p-10 text-center text-muted-foreground">Henüz cevap yok.</div>;
  return (
    <div className="space-y-3">
      {inbound.map((r) => (
        <div key={r.id} className={`glass-panel rounded-2xl border p-4 ${r.handled ? "border-border/40 opacity-60" : "border-primary/30"}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold">{r.from_name || r.from_email}</span>
                <span className="text-xs text-muted-foreground">{r.from_email}</span>
                {r.matched_investor && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-accent/10 text-accent border border-accent/20"><Building2 className="h-3 w-3" />{r.matched_investor.firm_name}</span>}
              </div>
              <div className="text-sm font-semibold mt-1">{r.subject || "(konu yok)"}</div>
              {r.preview ? (
                <div className="text-sm text-foreground/90 mt-2 whitespace-pre-wrap bg-background/40 border border-border/30 rounded-lg p-3">{r.preview}</div>
              ) : (
                <div className="text-xs text-muted-foreground/70 mt-2 italic">(içerik alınamadı)</div>
              )}
              <div className="text-[11px] text-muted-foreground mt-2">{fmt(r.received_at)}</div>
            </div>
            <div className="shrink-0 flex flex-col gap-2">
              <button onClick={() => toggle(r.id, !r.handled)} disabled={busy === r.id}
                className={`btn text-xs gap-1 ${r.handled ? "btn-ghost" : "btn-primary"}`}>
                {busy === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : r.handled ? <XCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                {r.handled ? "Geri al" : "İşlendi"}
              </button>
              <button onClick={() => block(r)} disabled={busy === r.id || !r.from_email} title="Bu adrese bir daha mail gitmesin"
                className="btn btn-ghost text-xs gap-1 text-red-400 hover:text-red-300">
                <ShieldOff className="h-3 w-3" /> Engelle
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BlockedList({ rows, loading, onChange }: { rows: Suppression[]; loading: boolean; onChange: () => void }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const post = async (payload: Record<string, unknown>) => {
    setBusy(true); setMsg("");
    try {
      const res = await fetch("/api/admin/mail", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: getPw(), ...payload }),
      });
      const d = await res.json();
      if (!res.ok) setMsg(d.error || "Hata.");
      else onChange();
    } finally { setBusy(false); }
  };

  const add = async () => {
    if (!email.includes("@")) { setMsg("Geçerli e-posta girin."); return; }
    await post({ action: "suppress_add", email });
    setEmail("");
  };

  return (
    <div className="space-y-4">
      <div className="glass-panel rounded-2xl border border-border/50 p-4">
        <div className="text-sm font-bold mb-1 flex items-center gap-2"><ShieldOff className="h-4 w-4 text-slate-400" /> Engelleme Listesi</div>
        <p className="text-xs text-muted-foreground mb-3">
          Bu adreslere <strong className="text-foreground">hiçbir</strong> pazarlama maili gitmez (drip, bülten, yatırımcı).
          Ulaşılamayan ve şikâyet edenler otomatik eklenir; “bir daha yazmayın” diyeni elle ekleyebilirsin.
        </p>
        <div className="flex flex-wrap gap-2">
          <input value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="engellenecek@adres.com"
            className="flex-1 min-w-[220px] h-10 px-3 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none" />
          <button onClick={add} disabled={busy} className="btn btn-primary gap-2 text-sm">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Ekle
          </button>
        </div>
        {msg && <p className="text-sm text-primary mt-2">{msg}</p>}
      </div>

      <div className="glass-panel rounded-2xl border border-border/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/40">
              <th className="px-4 py-3">E-posta</th>
              <th className="px-4 py-3">Neden</th>
              <th className="px-4 py-3">Kaynak</th>
              <th className="px-4 py-3">Tarih</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline" /></td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">Liste boş — henüz engellenen adres yok.</td></tr>}
            {!loading && rows.map((r) => (
              <tr key={r.id} className="border-b border-border/20 hover:bg-secondary/20">
                <td className="px-4 py-3 font-medium">{r.email}</td>
                <td className="px-4 py-3"><span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold border bg-slate-500/10 text-slate-400 border-slate-500/20">{REASON_TR[r.reason] || r.reason}</span></td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{r.source || "—"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{fmt(r.created_at)}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => { if (confirm(`${r.email} listeden çıkarılsın mı? (Tekrar mail alabilir)`)) post({ action: "suppress_remove", id: r.id }); }}
                    disabled={busy} title="Listeden çıkar"
                    className="h-8 w-8 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 inline-flex items-center justify-center hover:bg-red-500/20">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">Not: Şikâyet edeni (spam işaretleyen) listeden çıkarma — itibar riski.</p>
    </div>
  );
}

function Composer({ onSent }: { onSent: () => void }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [segStatus, setSegStatus] = useState("verified");
  const [limit, setLimit] = useState(50);
  const [testEmail, setTestEmail] = useState("");
  const [eligible, setEligible] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const preview = async () => {
    const params = new URLSearchParams({ password: getPw(), status: segStatus });
    const res = await fetch(`/api/admin/invest/send?${params}`);
    const d = await res.json();
    if (res.ok) setEligible(d.eligible);
  };
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps -- segment değişince alıcı sayısını çek
  useEffect(() => { preview(); }, [segStatus]);

  const send = async (test: boolean) => {
    if (!subject.trim() || !body.trim()) { setMsg("Konu ve içerik gerekli."); return; }
    if (test && !testEmail.includes("@")) { setMsg("Geçerli test adresi girin."); return; }
    if (!test && !confirm(`${Math.min(limit, eligible || 0)} yatırımcıya mail gönderilecek. Emin misin?`)) return;
    setBusy(true); setMsg("");
    try {
      const res = await fetch("/api/admin/invest/send", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: getPw(), subject, body_html: body, limit, segment: { status: segStatus }, testEmail: test ? testEmail : undefined }),
      });
      const d = await res.json();
      if (!res.ok) { setMsg(d.error || "Hata."); return; }
      if (d.skipped) setMsg("Resend yapılandırılmamış (RESEND_API_KEY yok) — gönderilemedi.");
      else if (test) setMsg(`Test ${d.sent ? "gönderildi" : "gönderilemedi"}.`);
      else { setMsg(`${d.sent} gönderildi, ${d.failed} başarısız.`); onSent(); }
    } finally { setBusy(false); }
  };

  return (
    <div className="glass-panel rounded-2xl border border-border/50 p-6 max-w-2xl">
      <h3 className="font-bold text-lg mb-1 flex items-center gap-2"><Building2 className="h-5 w-5 text-accent" /> Yatırımcı Segmentine Mail</h3>
      <p className="text-xs text-muted-foreground mb-5">
        KVKK: yalnız “outreach için yayınlanmış” (pitch@ / info@) adreslere gider. Cevaplar “Gelen Cevaplar” sekmesine düşer.
        Değişkenler: <code>{"{{firm}}"}</code>, <code>{"{{partner}}"}</code>, <code>{"{{site}}"}</code>.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <label className="text-sm">
          <span className="text-muted-foreground text-xs">Segment (durum)</span>
          <select value={segStatus} onChange={(e) => setSegStatus(e.target.value)} className="w-full h-10 mt-1 px-3 rounded-xl bg-background border border-border text-sm outline-none">
            <option value="verified">Onaylı</option>
            <option value="pending">Bekleyen</option>
            <option value="all">Tümü</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="text-muted-foreground text-xs">Bu partide en fazla</span>
          <input type="number" min={1} max={200} value={limit} onChange={(e) => setLimit(Number(e.target.value))}
            className="w-full h-10 mt-1 px-3 rounded-xl bg-background border border-border text-sm outline-none" />
        </label>
      </div>

      <div className="text-xs text-muted-foreground mb-3">
        Uygun alıcı: <span className="font-bold text-foreground">{eligible ?? "…"}</span> · bu partide gidecek: <span className="font-bold text-foreground">{Math.min(limit, eligible || 0)}</span>
      </div>

      <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Konu"
        className="w-full h-11 px-4 mb-3 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} placeholder="İçerik (HTML destekli)…"
        className="w-full px-4 py-3 mb-3 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none font-mono" />

      <div className="flex flex-wrap items-center gap-2">
        <input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="test@adres.com"
          className="h-10 px-3 rounded-xl bg-background border border-border text-sm outline-none flex-1 min-w-[180px]" />
        <button onClick={() => send(true)} disabled={busy} className="btn btn-ghost gap-2 text-sm">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Test gönder
        </button>
        <button onClick={() => send(false)} disabled={busy} className="btn btn-primary gap-2 text-sm">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Segmente gönder
        </button>
      </div>
      {msg && <p className="text-sm mt-3 text-primary">{msg}</p>}
    </div>
  );
}
