"use client";

import { useEffect, useState } from "react";
import { Loader2, TrendingUp, MailOpen, MousePointerClick, Eye, FileText, Handshake, RefreshCw } from "lucide-react";

type Data = {
  email: { sent: number; opened: number; clicked: number; sent7: number; opened7: number; clicked7: number };
  funnel: { pick: string | null; matched: number; viewed: number; deckReaders: number; requested: number; skipped: number; score: number };
  pending: { investor: { firm_name: string; partner_name: string | null; country: string | null } | null; startup: { startup_name: string } | null; action_at: string | null }[];
  totals: { interested: number; followed: number };
};

function getPw() { try { return sessionStorage.getItem("ds_admin_pw") || ""; } catch { return ""; } }
function pct(n: number, d: number) { return d > 0 ? Math.round((n / d) * 100) : 0; }
function fmtDate(iso: string | null) {
  if (!iso) return "";
  try { return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch { return ""; }
}

export default function InvestFunnelAdmin() {
  const [d, setD] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch(`/api/admin/invest-funnel?password=${encodeURIComponent(getPw())}`)
      .then((r) => r.json())
      .then((j) => { if (!j.error) setD(j); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  if (loading && !d) {
    return <div className="flex items-center justify-center py-32 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (!d) return <p className="text-sm text-muted-foreground">Veri yüklenemedi.</p>;

  const e = d.email;
  const f = d.funnel;
  // Huni adımları — eşleşmeden başlayarak daralan funnel
  const steps = [
    { label: "Eşleşti", val: f.matched, icon: Handshake, base: f.matched },
    { label: "Sayfayı gördü", val: f.viewed, icon: Eye, base: f.matched },
    { label: "Deck okudu", val: f.deckReaders, icon: FileText, base: f.matched },
    { label: "Görüşme istedi", val: f.requested, icon: TrendingUp, base: f.matched },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" /> INVEST Hunisi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Yatırımcı maili açılma/tıklama oranları ve eşleşme → görüşme hunisi. Kuzey yıldızı: <strong>deck okuma = 1 puan, görüşme = 3 puan.</strong>
          </p>
        </div>
        <button onClick={load} className="btn btn-secondary shrink-0 h-10" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="ml-1.5">Yenile</span>
        </button>
      </div>

      {/* E-posta oranları */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">E-posta Performansı (tüm yatırımcı maili)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Tile label="Gönderildi" value={e.sent} />
          <Tile label="Açılma oranı" value={`%${pct(e.opened, e.sent)}`} sub={`${e.opened} açıldı`} icon={MailOpen} accent />
          <Tile label="Tıklama oranı" value={`%${pct(e.clicked, e.sent)}`} sub={`${e.clicked} tıklandı`} icon={MousePointerClick} />
          <Tile label="Son 7 gün" value={e.sent7} sub={`%${pct(e.opened7, e.sent7)} açılma · %${pct(e.clicked7, e.sent7)} tıklama`} />
        </div>
      </section>

      {/* Huni + puan */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Dönüşüm Hunisi {f.pick ? <span className="text-primary normal-case">· Haftanın girişimi: {f.pick}</span> : <span className="normal-case text-muted-foreground">· featured girişim seçilmedi</span>}
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {/* Funnel barları */}
          <div className="md:col-span-2 glass-panel rounded-2xl border border-border/40 p-5 space-y-3">
            {steps.map((s) => {
              const Icon = s.icon;
              const p = pct(s.val, s.base);
              return (
                <div key={s.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="flex items-center gap-2 text-foreground font-semibold"><Icon className="h-4 w-4 text-muted-foreground" />{s.label}</span>
                    <span className="font-mono text-muted-foreground">{s.val} <span className="text-[11px]">(%{p})</span></span>
                  </div>
                  <div className="h-2.5 rounded-full bg-secondary/40 overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${p}%` }} />
                  </div>
                </div>
              );
            })}
            {f.skipped > 0 && <p className="text-xs text-muted-foreground pt-1">{f.skipped} yatırımcı bu girişimi geçti (skip).</p>}
          </div>
          {/* Puan */}
          <div className="glass-panel rounded-2xl border border-primary/30 bg-primary/5 p-5 flex flex-col items-center justify-center text-center">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Huni Puanı</div>
            <div className="text-5xl font-black text-primary my-2">{f.score}</div>
            <div className="text-xs text-muted-foreground">{f.deckReaders} deck × 1 + {f.requested} görüşme × 3</div>
          </div>
        </div>
      </section>

      {/* Bekleyen görüşmeler */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Bekleyen Görüşme Talepleri ({d.pending.length})</h2>
        {d.pending.length === 0 ? (
          <p className="text-sm text-muted-foreground glass-panel rounded-2xl border border-border/40 p-5">Şu an bekleyen görüşme talebi yok.</p>
        ) : (
          <div className="glass-panel rounded-2xl border border-border/40 divide-y divide-border/30 overflow-hidden">
            {d.pending.map((p, i) => (
              <div key={i} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <div>
                  <span className="font-semibold text-foreground">{p.investor?.partner_name || p.investor?.firm_name || "—"}</span>
                  {p.investor?.firm_name && p.investor?.partner_name && <span className="text-muted-foreground"> · {p.investor.firm_name}</span>}
                  {p.investor?.country && <span className="text-muted-foreground"> · {p.investor.country}</span>}
                  <span className="text-muted-foreground"> → {p.startup?.startup_name || "—"}</span>
                </div>
                <span className="text-xs text-muted-foreground font-mono shrink-0">{fmtDate(p.action_at)}</span>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-2">Talepleri <strong>Eşleştirme</strong> sayfasından (Ayarlandı/Tamamlandı/Vazgeç) kuyruktan düşürebilirsin.</p>
      </section>

      {/* Toplamlar */}
      <section className="grid grid-cols-2 gap-4">
        <Tile label="İlgi gösteren yatırımcı" value={d.totals.interested} />
        <Tile label="Follow-up gönderilen" value={d.totals.followed} />
      </section>
    </div>
  );
}

function Tile({ label, value, sub, icon: Icon, accent }: { label: string; value: number | string; sub?: string; icon?: React.ElementType; accent?: boolean }) {
  return (
    <div className={`glass-panel rounded-2xl border p-4 ${accent ? "border-primary/30 bg-primary/5" : "border-border/40"}`}>
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
        {Icon && <Icon className="h-3.5 w-3.5" />}{label}
      </div>
      <div className={`text-3xl font-black ${accent ? "text-primary" : "text-foreground"}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}
