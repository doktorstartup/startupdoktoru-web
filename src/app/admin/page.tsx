"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  CheckCircle2,
  Eye,
  UserPlus,
  ChevronRight,
  ShoppingCart,
  Phone,
} from "lucide-react";

type Stats = {
  visitors: number;
  leads: number;
  customers: number;
  revenue: number;
  conversion: { leadRate: number; saleRate: number; overallRate: number };
  topPages?: { path: string; views: number; visitors: number }[];
  abandoned?: { id: string; name: string | null; email: string; phone: string | null; created_at: string }[];
  recentLeads: { id: string; name: string; email: string; company: string | null; score: number; stage: string; status: string; created_at: string }[];
  recentOrders: { id: string; email: string | null; product_id: string | null; amount: number; currency: string; payment_status: string; created_at: string }[];
};

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Şifre admin kapısından (layout) sessionStorage'a yazıldı.
    let pw = "";
    try {
      pw = sessionStorage.getItem("ds_admin_pw") || "";
    } catch {
      /* yoksa boş */
    }
    fetch(`/api/admin/stats?password=${encodeURIComponent(pw)}`)
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { name: "Ziyaretçi", value: stats ? `${stats.visitors}` : "—", icon: Eye, color: "text-cyan-400", hint: "Siteye gelen tekil kişi" },
    { name: "Lead (Üye)", value: stats ? `${stats.leads}` : "—", icon: UserPlus, color: "text-primary", hint: "Form/pop-up ile kaydolan" },
    { name: "Müşteri", value: stats ? `${stats.customers}` : "—", icon: CheckCircle2, color: "text-emerald-400", hint: "Satın alım yapan" },
    { name: "Net Gelir", value: stats ? `$${stats.revenue.toLocaleString("en-US")}` : "—", icon: DollarSign, color: "text-accent", hint: "Ödenmiş siparişler" },
  ];

  // Funnel barı için oransal genişlikler (ziyaretçi = %100 taban)
  const v = stats?.visitors || 0;
  const funnel = [
    { label: "Ziyaretçi", count: stats?.visitors || 0, pct: 100, color: "bg-cyan-400/70" },
    { label: "Lead (Üye)", count: stats?.leads || 0, pct: v > 0 ? Math.min(100, ((stats?.leads || 0) / v) * 100) : 0, color: "bg-primary/70" },
    { label: "Müşteri", count: stats?.customers || 0, pct: v > 0 ? Math.min(100, ((stats?.customers || 0) / v) * 100) : 0, color: "bg-emerald-400/70" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-primary text-xs font-bold font-mono tracking-widest uppercase">Kontrol Paneli</span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1 text-foreground">
            Startup Doktoru Yönetim Paneli
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kaç kişi geldi, kaçı üye oldu, kaçı satın aldı — funnel performansının anlık görünümü.
          </p>
        </div>

        <Link href="/portal/course" className="btn btn-sm btn-secondary">
          Öğrenci Portalını Aç
          <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="glass-panel p-6 rounded-2xl border border-border/40 relative overflow-hidden flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-muted-foreground">{stat.name}</span>
                <div className={`p-2 bg-secondary/60 rounded-lg border border-border/40 ${stat.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className={`text-2xl font-black text-foreground font-mono ${loading ? "opacity-40" : ""}`}>{stat.value}</div>
                <div className="text-[10px] text-muted-foreground mt-1.5">{stat.hint}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Funnel + dönüşüm oranları */}
      <div className="glass-panel p-6 rounded-2xl border border-border/40">
        <div className="flex items-center justify-between border-b border-border/20 pb-4 mb-6">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Dönüşüm Hunisi
          </h3>
          <div className="flex gap-4 text-[11px] font-mono text-muted-foreground">
            <span>Ziyaretçi→Lead: <span className="text-primary font-bold">%{(stats?.conversion.leadRate || 0).toFixed(1)}</span></span>
            <span>Lead→Satış: <span className="text-emerald-400 font-bold">%{(stats?.conversion.saleRate || 0).toFixed(1)}</span></span>
            <span>Toplam: <span className="text-accent font-bold">%{(stats?.conversion.overallRate || 0).toFixed(1)}</span></span>
          </div>
        </div>
        <div className="space-y-4">
          {funnel.map((f) => (
            <div key={f.label}>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-foreground">{f.label}</span>
                <span className="font-mono text-muted-foreground">{f.count}</span>
              </div>
              <div className="h-3 rounded-full bg-secondary/40 overflow-hidden">
                <div className={`h-full rounded-full ${f.color} transition-all duration-500`} style={{ width: `${f.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sayfa görüntüleme kırılımı — hangi sayfa kaç kez/kaç kişi tarafından görüldü */}
      <div className="glass-panel p-6 rounded-2xl border border-border/40">
        <div className="flex justify-between items-center border-b border-border/20 pb-4 mb-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Eye className="h-4 w-4 text-cyan-400" /> Sayfa Görüntüleme Kırılımı
          </h3>
          <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">En çok görüntülenen</span>
        </div>
        {(stats?.topPages || []).length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">Henüz görüntüleme verisi yok.</p>
        ) : (
          <div className="space-y-2.5">
            {(stats?.topPages || []).map((p) => {
              const max = stats?.topPages?.[0]?.views || 1;
              const pct = Math.round((p.views / max) * 100);
              return (
                <div key={p.path} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-foreground w-48 truncate shrink-0">{p.path}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-secondary/40 overflow-hidden">
                    <div className="h-full rounded-full bg-cyan-400/70" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-mono text-foreground shrink-0 w-28 text-right">
                    {p.views} görüntüleme <span className="text-muted-foreground">· {p.visitors} kişi</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sepeti bırakanlar — ödeme adımına gelip tamamlamayanlar */}
      {(stats?.abandoned || []).length > 0 && (
        <div className="glass-panel p-6 rounded-2xl border border-amber-500/30 bg-amber-500/[0.04]">
          <div className="flex justify-between items-center border-b border-border/20 pb-4 mb-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-amber-400" /> Sepeti Bırakanlar
              <span className="text-[10px] font-mono bg-amber-500/15 text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded-full">{stats?.abandoned?.length}</span>
            </h3>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Ödemeye geldi, tamamlamadı</span>
          </div>
          <div className="space-y-2.5">
            {(stats?.abandoned || []).map((a) => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/15 border border-border/20 text-xs">
                <div>
                  <div className="font-bold text-foreground">{a.name || "—"}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-2">
                    <span>{a.email}</span>
                    {a.phone && (<span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {a.phone}</span>)}
                  </div>
                </div>
                <span className="text-[9px] text-muted-foreground font-mono">{fmtDate(a.created_at)}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">Bu kişilere günlük otomasyon &quot;ödemeni tamamla&quot; maili yollar (Resend bağlıysa).</p>
        </div>
      )}

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Recent Leads */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-border/40">
            <div className="flex justify-between items-center border-b border-border/20 pb-4 mb-4">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Son Lead Girişleri (CRM)
              </h3>
              <Link href="/admin/leads" className="text-xs text-primary font-bold hover:underline flex items-center gap-0.5">
                CRM Tablosuna Git <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {(stats?.recentLeads || []).length === 0 && (
                <p className="text-xs text-muted-foreground py-4 text-center">Henüz lead kaydı yok.</p>
              )}
              {(stats?.recentLeads || []).map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/15 border border-border/20 hover:border-primary/20 transition-all text-xs">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                      {(lead.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-foreground">{lead.name}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <span>{lead.email}</span>
                        {lead.company && (<><span className="text-muted-foreground/40">•</span><span>{lead.company}</span></>)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold text-foreground">Skor: {lead.score}</div>
                      <div className="text-[9px] text-muted-foreground font-mono mt-0.5">{fmtDate(lead.created_at)}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold tracking-wide ${
                      lead.status === "HOT" ? "bg-red-500/10 border border-red-500/25 text-red-400"
                      : lead.status === "CUSTOMER" ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-400"
                      : lead.status === "WARM" ? "bg-accent/10 border border-accent/25 text-accent"
                      : "bg-muted border border-border text-muted-foreground"
                    }`}>
                      {lead.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Recent Orders */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-border/40">
            <div className="flex justify-between items-center border-b border-border/20 pb-4 mb-4">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-accent" /> Son Satış Hareketleri
              </h3>
            </div>

            <div className="space-y-4">
              {(stats?.recentOrders || []).length === 0 && (
                <p className="text-xs text-muted-foreground py-4 text-center">Henüz satış kaydı yok.</p>
              )}
              {(stats?.recentOrders || []).map((order) => (
                <div key={order.id} className="text-xs border-b border-border/10 pb-3 last:border-none last:pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-foreground truncate max-w-[180px]">{order.product_id}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{order.email}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-foreground font-mono">${Number(order.amount).toLocaleString("en-US")} {order.currency}</div>
                      <div className="text-[9px] text-muted-foreground mt-0.5 font-mono">{fmtDate(order.created_at)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${order.payment_status === "paid" ? "bg-emerald-500" : "bg-accent"}`} />
                    <span className="text-[10px] text-muted-foreground">{order.payment_status === "paid" ? "Tamamlandı" : "Beklemede"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
