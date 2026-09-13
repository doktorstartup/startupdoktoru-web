"use client";

import React, { useEffect, useState } from "react";
import {
  Search,
  Edit3,
  Trash2,
  Check,
  Star,
  Download,
  Mail,
  Phone,
  Building2,
  Loader2,
} from "lucide-react";

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  stage: string;
  status: string;
  score: number;
  notes: string | null;
  source: string | null;
  created_at: string;
};

function getPw() {
  try {
    return sessionStorage.getItem("ds_admin_pw") || "";
  } catch {
    return "";
  }
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return iso;
  }
}

export default function LeadsCRM() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editStage, setEditStage] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`/api/admin/leads?password=${encodeURIComponent(getPw())}`)
      .then((r) => r.json())
      .then((d) => setLeads(d.leads || []))
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredLeads = leads.filter((lead) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (lead.name || "").toLowerCase().includes(q) ||
      (lead.email || "").toLowerCase().includes(q) ||
      (lead.company || "").toLowerCase().includes(q);
    const matchesStatus = selectedStatus === "ALL" || lead.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleEditClick = (lead: Lead) => {
    setEditingLeadId(lead.id);
    setEditNotes(lead.notes || "");
    setEditStatus(lead.status);
    setEditStage(lead.stage);
  };

  const handleSaveEdit = async (leadId: string) => {
    setSaving(true);
    let newScore: number | undefined;
    const current = leads.find((l) => l.id === leadId);
    if (current) {
      newScore = current.score;
      if (editStatus === "HOT") newScore = Math.max(newScore, 85);
      if (editStatus === "CUSTOMER") newScore = 100;
    }
    try {
      await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: getPw(), id: leadId, status: editStatus, stage: editStage, notes: editNotes, score: newScore }),
      });
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: editStatus, stage: editStage, notes: editNotes, score: newScore ?? l.score } : l))
      );
      setEditingLeadId(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm("Bu lead kaydını silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/admin/leads?password=${encodeURIComponent(getPw())}&id=${leadId}`, { method: "DELETE" });
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
  };

  const exportCsv = () => {
    const header = ["Ad", "E-posta", "Telefon", "Şirket/Proje", "Aşama", "Durum", "Skor", "Kaynak", "Tarih", "Not"];
    const rows = filteredLeads.map((l) => [
      l.name, l.email, l.phone || "", l.company || "", l.stage, l.status, l.score, l.source || "", fmtDate(l.created_at), (l.notes || "").replace(/\n/g, " "),
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leadler.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-primary text-xs font-bold font-mono tracking-widest uppercase">CRM Müşteri Yönetimi</span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1 text-foreground">Lead Adayı Takip Paneli</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tüm kayıtlar gerçek veriden gelir. Aşama/durum/not güncelleyebilir, kaydı silebilirsin.
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-secondary border border-border/80 hover:border-primary/30 px-5 text-xs font-bold text-foreground transition-all"
        >
          <Download className="h-4 w-4" /> CSV İndir
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="glass-panel p-4 rounded-2xl border border-border/40 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-6 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="İsim, e-posta veya şirket adına göre ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-black/40 border border-border/60 text-sm focus:outline-none focus:border-primary text-foreground transition-colors"
          />
        </div>
        <div className="md:col-span-6 flex flex-wrap gap-2 justify-end">
          {["ALL", "NEW", "HOT", "WARM", "COLD", "CUSTOMER"].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`h-9 px-3 rounded-lg text-xs font-bold font-mono transition-all ${
                selectedStatus === st
                  ? "bg-primary text-background"
                  : "bg-secondary/40 border border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary/70"
              }`}
            >
              {st === "ALL" ? "Tümü" : st}
            </button>
          ))}
        </div>
      </div>

      {/* Leads Table Container */}
      <div className="glass-panel rounded-2xl border border-border/40 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/15 text-muted-foreground uppercase font-bold tracking-wider">
                  <th className="p-4">Ad / Proje</th>
                  <th className="p-4">İletişim</th>
                  <th className="p-4">Huni Aşaması</th>
                  <th className="p-4">Durum</th>
                  <th className="p-4 text-center">Skor</th>
                  <th className="p-4">Notlar</th>
                  <th className="p-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {filteredLeads.map((lead) => {
                  const isEditing = editingLeadId === lead.id;
                  return (
                    <tr key={lead.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-foreground text-sm">{lead.name}</div>
                        {lead.company && (
                          <div className="text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Building2 className="h-3 w-3 text-primary shrink-0" />
                            <span>{lead.company}</span>
                          </div>
                        )}
                        {lead.source && <div className="text-[10px] text-muted-foreground/70 font-mono mt-0.5">{lead.source}</div>}
                      </td>

                      <td className="p-4 space-y-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" /> <span>{lead.email}</span>
                        </div>
                        {lead.phone && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" /> <span>{lead.phone}</span>
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        {isEditing ? (
                          <select
                            value={editStage}
                            onChange={(e) => setEditStage(e.target.value)}
                            className="h-8 rounded bg-secondary border border-border text-foreground px-2 focus:outline-none focus:border-primary text-xs"
                          >
                            <option value="NEW_LEAD">Yeni Lead</option>
                            <option value="FREE_TRAINING">Ücretsiz Eğitim</option>
                            <option value="EBOOK_CUSTOMER">E-Kitap Alıcısı</option>
                            <option value="COURSE_CUSTOMER">Eğitim Alıcısı</option>
                            <option value="WORKSHOP_CANDIDATE">Workshop Adayı</option>
                            <option value="CONSULTING_CANDIDATE">Danışmanlık Adayı</option>
                          </select>
                        ) : (
                          <span className="font-mono bg-secondary/50 border border-border/60 px-2 py-0.5 rounded text-[10px] text-foreground">{lead.stage}</span>
                        )}
                      </td>

                      <td className="p-4">
                        {isEditing ? (
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="h-8 rounded bg-secondary border border-border text-foreground px-2 focus:outline-none focus:border-primary text-xs"
                          >
                            {["NEW", "HOT", "WARM", "COLD", "CUSTOMER", "LOST"].map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded font-mono font-bold ${
                            lead.status === "HOT" ? "bg-red-500/10 border border-red-500/20 text-red-400"
                            : lead.status === "CUSTOMER" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                            : lead.status === "WARM" ? "bg-accent/10 border border-accent/20 text-accent"
                            : lead.status === "COLD" ? "bg-blue-500/10 border border-blue-500/20 text-blue-400"
                            : "bg-muted border border-border text-muted-foreground"
                          }`}>{lead.status}</span>
                        )}
                      </td>

                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-1 font-mono font-black text-sm bg-primary/5 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full">
                          <Star className="h-3 w-3 fill-primary" /> {lead.score}
                        </div>
                      </td>

                      <td className="p-4 max-w-[220px]">
                        {isEditing ? (
                          <textarea
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            className="w-full h-16 p-2 rounded bg-secondary border border-border text-foreground focus:outline-none focus:border-primary text-xs resize-none"
                          />
                        ) : (
                          <div className="text-muted-foreground truncate hover:text-foreground cursor-pointer" title={lead.notes || ""}>
                            {lead.notes || "Henüz not eklenmedi."}
                          </div>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        {isEditing ? (
                          <button
                            onClick={() => handleSaveEdit(lead.id)}
                            disabled={saving}
                            className="h-8 w-8 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 inline-flex items-center justify-center transition-colors disabled:opacity-50"
                          >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          </button>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEditClick(lead)}
                              className="h-8 w-8 rounded-lg bg-secondary/80 hover:bg-primary/10 border border-border/80 hover:border-primary/30 text-muted-foreground hover:text-primary inline-flex items-center justify-center transition-all"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteLead(lead.id)}
                              className="h-8 w-8 rounded-lg bg-red-950/20 hover:bg-red-500/10 border border-red-950/30 hover:border-red-500/30 text-red-400 inline-flex items-center justify-center transition-all"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredLeads.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">Kayıt bulunamadı.</div>
        )}
      </div>
    </div>
  );
}
