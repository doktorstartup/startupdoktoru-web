"use client";

import React, { useState } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Check, 
  MessageSquare,
  Star,
  Download,
  Plus,
  Mail,
  Phone,
  Building2,
  Calendar
} from "lucide-react";

// Mock Database Leads
const INITIAL_LEADS = [
  { id: "1", name: "Can Yılmaz", email: "can@fintechpay.co", phone: "+90 532 111 2233", company: "FintechPay", stage: "NEW_LEAD", status: "HOT", score: 85, date: "02.06.2026", notes: "Ön görüşme yapıldı. Yatırımcı sunum şablonu arıyor." },
  { id: "2", name: "Elif Demir", email: "elif.demir@biotech.io", phone: "+90 555 444 5566", company: "BioTech", stage: "FREE_TRAINING", status: "WARM", score: 60, date: "01.06.2026", notes: "Ücretsiz eğitimi tamamladı. E-kitap teklifine baktı." },
  { id: "3", name: "Mert Kaya", email: "mert@gamestudio.com", phone: "+90 541 333 4455", company: "Game Studio", stage: "EBOOK_CUSTOMER", status: "CUSTOMER", score: 95, date: "30.05.2026", notes: "E-kitap satın aldı. Eğitim upsell teklifini inceliyor." },
  { id: "4", name: "Zeynep Aksoy", email: "zeynep@edutrack.net", phone: "+90 533 222 1100", company: "EduTrack", stage: "COURSE_CUSTOMER", status: "CUSTOMER", score: 100, date: "29.05.2026", notes: "Eğitimi satın aldı. Aktif olarak modülleri izliyor." },
  { id: "5", name: "Bora Çelik", email: "bora@cleanenergy.org", phone: "+90 505 999 8877", company: "CleanEnergy", stage: "NEW_LEAD", status: "COLD", score: 35, date: "28.05.2026", notes: "Sadece bültene kayıt oldu." }
];

export default function LeadsCRM() {
  const [leads, setLeads] = useState(INITIAL_LEADS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editStage, setEditStage] = useState("");

  // Filter & Search Logic
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === "ALL" || lead.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleEditClick = (lead: typeof INITIAL_LEADS[0]) => {
    setEditingLeadId(lead.id);
    setEditNotes(lead.notes);
    setEditStatus(lead.status);
    setEditStage(lead.stage);
  };

  const handleSaveEdit = (leadId: string) => {
    setLeads(leads.map(lead => {
      if (lead.id === leadId) {
        // Recalculate score based on stage/status updates
        let newScore = lead.score;
        if (editStatus === "HOT") newScore = Math.max(newScore, 85);
        if (editStatus === "CUSTOMER") newScore = 100;
        
        return {
          ...lead,
          status: editStatus,
          stage: editStage,
          notes: editNotes,
          score: newScore
        };
      }
      return lead;
    }));
    setEditingLeadId(null);
  };

  const handleDeleteLead = (leadId: string) => {
    if (confirm("Bu lead kaydını silmek istediğinize emin misiniz?")) {
      setLeads(leads.filter(lead => lead.id !== leadId));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-primary text-xs font-bold font-mono tracking-widest uppercase">CRM Müşteri Yönetimi</span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1 text-foreground">Lead Adayı Takip Paneli</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Dönüşüm hunisindeki tüm girişimcilerin temas durumları, lead skorları ve detaylı görüşme notları.
          </p>
        </div>
        
        {/* Export Action */}
        <button
          onClick={() => alert("CSV aktarımı yapıldı (Mock export).")}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-secondary border border-border/80 hover:border-primary/30 px-5 text-xs font-bold text-foreground transition-all"
        >
          <Download className="h-4 w-4" /> CSV İndir
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="glass-panel p-4 rounded-2xl border border-border/40 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Search */}
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

        {/* Filters Status Pills */}
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
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border/40 bg-secondary/15 text-muted-foreground uppercase font-bold tracking-wider">
                <th className="p-4">Ad Soyad / Girişim</th>
                <th className="p-4">İletişim Bilgileri</th>
                <th className="p-4">Huni Aşaması</th>
                <th className="p-4">Aday Durumu</th>
                <th className="p-4 text-center">Lead Skoru</th>
                <th className="p-4">Notlar</th>
                <th className="p-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {filteredLeads.map((lead) => {
                const isEditing = editingLeadId === lead.id;
                
                return (
                  <tr key={lead.id} className="hover:bg-secondary/10 transition-colors">
                    {/* User Info */}
                    <td className="p-4">
                      <div className="font-bold text-foreground text-sm">{lead.name}</div>
                      <div className="text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Building2 className="h-3 w-3 text-primary shrink-0" />
                        <span>{lead.company}</span>
                      </div>
                    </td>

                    {/* Contact details */}
                    <td className="p-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" /> <span>{lead.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" /> <span>{lead.phone}</span>
                      </div>
                    </td>

                    {/* Sales Stage */}
                    <td className="p-4">
                      {isEditing ? (
                        <select
                          value={editStage}
                          onChange={(e) => setEditStage(e.target.value)}
                          className="h-8 rounded bg-secondary border border-border text-foreground px-2 focus:outline-none focus:border-primary text-xs"
                        >
                          <option value="NEW_LEAD">Yeni Lead (NEW_LEAD)</option>
                          <option value="FREE_TRAINING">Ücretsiz Eğitim (FREE_TRAINING)</option>
                          <option value="EBOOK_CUSTOMER">E-Kitap Alıcısı (EBOOK_CUSTOMER)</option>
                          <option value="COURSE_CUSTOMER">Kurs Alıcısı (COURSE_CUSTOMER)</option>
                        </select>
                      ) : (
                        <span className="font-mono bg-secondary/50 border border-border/60 px-2 py-0.5 rounded text-[10px] text-foreground">
                          {lead.stage}
                        </span>
                      )}
                    </td>

                    {/* Lead Status */}
                    <td className="p-4">
                      {isEditing ? (
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          className="h-8 rounded bg-secondary border border-border text-foreground px-2 focus:outline-none focus:border-primary text-xs"
                        >
                          <option value="NEW">NEW</option>
                          <option value="HOT">HOT</option>
                          <option value="WARM">WARM</option>
                          <option value="COLD">COLD</option>
                          <option value="CUSTOMER">CUSTOMER</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded font-mono font-bold ${
                          lead.status === "HOT"
                            ? "bg-red-500/10 border border-red-500/20 text-red-400"
                            : lead.status === "CUSTOMER"
                            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                            : lead.status === "WARM"
                            ? "bg-accent/10 border border-accent/20 text-accent"
                            : lead.status === "COLD"
                            ? "bg-blue-500/10 border border-blue-500/20 text-blue-400"
                            : "bg-muted border border-border text-muted-foreground"
                        }`}>
                          {lead.status}
                        </span>
                      )}
                    </td>

                    {/* Lead Score */}
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center gap-1 font-mono font-black text-sm bg-primary/5 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full">
                        <Star className="h-3 w-3 fill-primary" /> {lead.score}
                      </div>
                    </td>

                    {/* Lead CRM Notes */}
                    <td className="p-4 max-w-[220px]">
                      {isEditing ? (
                        <textarea
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          className="w-full h-16 p-2 rounded bg-secondary border border-border text-foreground focus:outline-none focus:border-primary text-xs resize-none"
                        />
                      ) : (
                        <div className="text-muted-foreground truncate hover:text-foreground cursor-pointer" title={lead.notes}>
                          {lead.notes || "Henüz not eklenmedi."}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      {isEditing ? (
                        <button
                          onClick={() => handleSaveEdit(lead.id)}
                          className="h-8 w-8 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 inline-flex items-center justify-center transition-colors"
                        >
                          <Check className="h-4 w-4" />
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

        {/* Empty State */}
        {filteredLeads.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Arama kriterlerine uygun aday bulunamadı.
          </div>
        )}
      </div>
    </div>
  );
}
