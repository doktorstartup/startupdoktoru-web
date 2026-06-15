"use client";

import React from "react";
import Link from "next/link";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  Clock, 
  Mail, 
  ChevronRight,
  BookOpen,
  Award
} from "lucide-react";

// Mock Statistics
const STATS = [
  {
    name: "Toplam Lead (CRM)",
    value: "148 Girişimci",
    change: "+24% bu hafta",
    trend: "up",
    icon: Users,
    color: "text-primary"
  },
  {
    name: "Net Gelir",
    value: "$1,842 USD",
    change: "+18% bu ay",
    trend: "up",
    icon: DollarSign,
    color: "text-accent"
  },
  {
    name: "Dönüşüm Oranı",
    value: "6.4%",
    change: "+1.2% artış",
    trend: "up",
    icon: TrendingUp,
    color: "text-cyan-400"
  },
  {
    name: "Toplam Sipariş",
    value: "52 Adet",
    change: "-3% bu hafta",
    trend: "down",
    icon: CheckCircle2,
    color: "text-emerald-400"
  }
];

// Mock Recent Leads
const RECENT_LEADS = [
  { id: "1", name: "Can Yılmaz", email: "can@fintechpay.co", score: 85, stage: "HOT", time: "10 dk önce", startup: "FintechPay" },
  { id: "2", name: "Elif Demir", email: "elif.demir@biotech.io", score: 60, stage: "WARM", time: "1 saat önce", startup: "BioTech" },
  { id: "3", name: "Mert Kaya", email: "mert@gamestudio.com", score: 45, stage: "NEW", time: "3 saat önce", startup: "Game Studio" },
  { id: "4", name: "Zeynep Aksoy", email: "zeynep@edutrack.net", score: 90, stage: "CUSTOMER", time: "5 saat önce", startup: "EduTrack" }
];

// Mock Recent Orders
const RECENT_ORDERS = [
  { id: "o1", email: "zeynep@edutrack.net", product: "Yatırımcı Sunumu Eğitimi", amount: "$49 USD", status: "Tamamlandı", date: "Bugün, 11:20" },
  { id: "o2", email: "bugra@iot-node.com", product: "Milyon Dolarlık Startup E-Kitap", amount: "$9 USD", status: "Tamamlandı", date: "Dün, 18:45" },
  { id: "o3", email: "ayse@greentech.org", product: "Milyon Dolarlık Startup E-Kitap", amount: "$9 USD", status: "Beklemede", date: "Dün, 15:30" }
];

export default function AdminDashboard() {
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
            Girişimci hunileri, lead'ler, satışlar ve dijital eğitim içeriklerinin anlık izleme alanı.
          </p>
        </div>
        
        {/* Quick Link to Portal */}
        <Link
          href="/portal/course"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-secondary border border-border/85 hover:border-primary/30 px-5 text-xs font-bold text-foreground transition-all"
        >
          Öğrenci Portalını Aç
          <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS.map((stat, i) => {
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
                <div className="text-2xl font-black text-foreground font-mono">{stat.value}</div>
                <div className="flex items-center gap-1 mt-1.5">
                  {stat.trend === "up" ? (
                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />
                  )}
                  <span className={`text-[10px] font-bold ${stat.trend === "up" ? "text-emerald-400" : "text-red-400"}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Recent Leads CRM */}
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
              {RECENT_LEADS.map((lead) => (
                <div 
                  key={lead.id} 
                  className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/15 border border-border/20 hover:border-primary/20 transition-all text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                      {lead.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-foreground">{lead.name}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <span>{lead.email}</span>
                        <span className="text-muted-foreground/40">•</span>
                        <span>{lead.startup}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold text-foreground">Skor: {lead.score}</div>
                      <div className="text-[9px] text-muted-foreground font-mono mt-0.5">{lead.time}</div>
                    </div>
                    
                    <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold tracking-wide ${
                      lead.stage === "HOT" 
                        ? "bg-red-500/10 border border-red-500/25 text-red-400"
                        : lead.stage === "CUSTOMER"
                        ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-400"
                        : lead.stage === "WARM"
                        ? "bg-accent/10 border border-accent/25 text-accent"
                        : "bg-muted border border-border text-muted-foreground"
                    }`}>
                      {lead.stage}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Recent Sales / Orders */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-border/40">
            <div className="flex justify-between items-center border-b border-border/20 pb-4 mb-4">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-accent" /> Son Satış Hareketleri
              </h3>
              <span className="text-[10px] text-muted-foreground font-mono">Otomatik Güncelleme</span>
            </div>

            <div className="space-y-4">
              {RECENT_ORDERS.map((order) => (
                <div key={order.id} className="text-xs border-b border-border/10 pb-3 last:border-none last:pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-foreground truncate max-w-[180px]">{order.product}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{order.email}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-foreground font-mono">{order.amount}</div>
                      <div className="text-[9px] text-muted-foreground mt-0.5 font-mono">{order.date}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                      order.status === "Tamamlandı" ? "bg-emerald-500" : "bg-accent"
                    }`} />
                    <span className="text-[10px] text-muted-foreground">{order.status}</span>
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
