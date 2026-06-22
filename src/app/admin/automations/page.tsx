"use client";

import { useEffect, useState } from "react";
import { Zap, Loader2, Plus, Trash2, ChevronDown, Mail, Clock } from "lucide-react";
import { TRAININGS } from "../../../lib/trainings";

type Step = { id: string; step_order: number; delay_minutes: number; subject: string; body_html: string };
type Campaign = { id: string; name: string; trigger_type: string; trigger_value: string | null; enabled: boolean; steps: Step[] };

const TRIGGERS = [
  { v: "lead", label: "Yeni Lead / Kayıt" },
  { v: "abandoned", label: "Sepeti Bırakma" },
  { v: "interest", label: "Eğitime İlgi" },
];

function getPw() {
  try {
    return sessionStorage.getItem("ds_admin_pw") || "";
  } catch {
    return "";
  }
}

// delay_minutes → {value, unit}
function splitDelay(min: number): { value: number; unit: "dk" | "saat" | "gün" } {
  if (min > 0 && min % 1440 === 0) return { value: min / 1440, unit: "gün" };
  if (min > 0 && min % 60 === 0) return { value: min / 60, unit: "saat" };
  return { value: min, unit: "dk" };
}
function toMinutes(value: number, unit: string) {
  return unit === "gün" ? value * 1440 : unit === "saat" ? value * 60 : value;
}

export default function CampaignsAdmin() {
  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`/api/admin/campaigns?password=${encodeURIComponent(getPw())}`)
      .then((r) => r.json())
      .then((d) => setItems(d.campaigns || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);

  const act = async (payload: Record<string, unknown>) => {
    setBusy(true);
    try {
      await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: getPw(), ...payload }),
      });
      load();
    } finally {
      setBusy(false);
    }
  };

  const triggerLabel = (c: Campaign) => {
    const base = TRIGGERS.find((t) => t.v === c.trigger_type)?.label || c.trigger_type;
    if (c.trigger_type === "interest" && c.trigger_value) {
      const t = TRAININGS.find((x) => x.id === c.trigger_value);
      return `${base}: ${t?.title || c.trigger_value}`;
    }
    return base;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-4">
        <div>
          <span className="text-primary text-xs font-bold font-mono tracking-widest uppercase">Otomasyonlar</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" /> Drip Kampanyalar
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Tetik (lead / sepeti bırakma / <strong className="text-foreground">eğitime ilgi</strong>) + zamanlı adımlar.
            Kişi tetiği geçince seriye girer; adımlar gecikmesi gelince gönderilir. <code className="text-foreground">{`{{name}}`}</code>, <code className="text-foreground">{`{{site}}`}</code> kullanılabilir.
          </p>
        </div>
        <button onClick={() => act({ action: "create_campaign", name: "Yeni Kampanya", trigger_type: "lead" })} disabled={busy} className="btn btn-primary shrink-0">
          <Plus className="h-4 w-4" /> Kampanya
        </button>
      </div>

      <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.05] px-4 py-2.5 text-xs text-amber-300/90">
        Maillerin gitmesi için <strong>RESEND_API_KEY</strong> gerekli. Dakika/saat hassasiyeti için işleyiciyi sık tetikle (ücretsiz harici cron); Vercel günlük cron = gün hassasiyeti.
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {items.map((c) => {
            const open = openId === c.id;
            return (
              <div key={c.id} className="glass-panel rounded-2xl border border-border/40 overflow-hidden">
                <div className="flex items-center justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-bold text-foreground truncate">{c.name}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${c.enabled ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-secondary/40 text-muted-foreground border border-border/40"}`}>{c.enabled ? "Açık" : "Kapalı"}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{triggerLabel(c)} · {c.steps.length} adım</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button onClick={() => act({ action: "update_campaign", id: c.id, enabled: !c.enabled })} disabled={busy}
                      className={`relative h-6 w-11 rounded-full transition-colors ${c.enabled ? "bg-primary" : "bg-secondary/60 border border-border/60"}`} aria-label="Aç/Kapat">
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${c.enabled ? "left-[22px]" : "left-0.5"}`} />
                    </button>
                    <button onClick={() => setOpenId(open ? null : c.id)} className="text-muted-foreground hover:text-foreground"><ChevronDown className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`} /></button>
                  </div>
                </div>

                {open && (
                  <div className="border-t border-border/30 p-5 space-y-5 bg-background/30">
                    {/* Kampanya ayarları */}
                    <div className="grid sm:grid-cols-3 gap-3">
                      <input defaultValue={c.name} onBlur={(e) => e.target.value !== c.name && act({ action: "update_campaign", id: c.id, name: e.target.value })}
                        placeholder="Kampanya adı" className="h-10 px-3 rounded-lg bg-background border border-border focus:border-primary/50 text-sm outline-none" />
                      <select defaultValue={c.trigger_type} onChange={(e) => act({ action: "update_campaign", id: c.id, trigger_type: e.target.value, trigger_value: e.target.value === "interest" ? (c.trigger_value || TRAININGS[0].id) : null })}
                        className="h-10 px-3 rounded-lg bg-background border border-border focus:border-primary/50 text-sm outline-none">
                        {TRIGGERS.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
                      </select>
                      {c.trigger_type === "interest" && (
                        <select defaultValue={c.trigger_value || TRAININGS[0].id} onChange={(e) => act({ action: "update_campaign", id: c.id, trigger_value: e.target.value })}
                          className="h-10 px-3 rounded-lg bg-background border border-border focus:border-primary/50 text-sm outline-none">
                          {TRAININGS.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                        </select>
                      )}
                    </div>

                    {/* Adımlar */}
                    <div className="space-y-3">
                      {c.steps.map((s, i) => {
                        const d = splitDelay(s.delay_minutes);
                        return (
                          <div key={s.id} className="rounded-xl border border-border/40 p-4 bg-secondary/10 space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-muted-foreground">Adım {i + 1}</span>
                              <button onClick={() => act({ action: "delete_step", id: s.id })} disabled={busy} className="h-7 w-7 rounded-lg bg-red-950/20 border border-red-950/30 text-red-400 inline-flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="text-xs text-muted-foreground">Tetikten</span>
                              <input type="number" min={0} defaultValue={d.value}
                                onBlur={(e) => { const m = toMinutes(Number(e.target.value), d.unit); if (m !== s.delay_minutes) act({ action: "update_step", id: s.id, delay_minutes: m }); }}
                                className="w-20 h-9 px-2 rounded-lg bg-background border border-border text-sm outline-none focus:border-primary/50" />
                              <select defaultValue={d.unit} onChange={(e) => act({ action: "update_step", id: s.id, delay_minutes: toMinutes(d.value, e.target.value) })}
                                className="h-9 px-2 rounded-lg bg-background border border-border text-sm outline-none focus:border-primary/50">
                                <option value="dk">dakika</option><option value="saat">saat</option><option value="gün">gün</option>
                              </select>
                              <span className="text-xs text-muted-foreground">sonra gönder</span>
                            </div>
                            <input defaultValue={s.subject} onBlur={(e) => e.target.value !== s.subject && act({ action: "update_step", id: s.id, subject: e.target.value })}
                              placeholder="Konu" className="w-full h-10 px-3 rounded-lg bg-background border border-border focus:border-primary/50 text-sm outline-none" />
                            <textarea defaultValue={s.body_html} onBlur={(e) => e.target.value !== s.body_html && act({ action: "update_step", id: s.id, body_html: e.target.value })}
                              placeholder="İçerik (HTML)" className="w-full h-32 p-3 rounded-lg bg-background border border-border focus:border-primary/50 text-xs font-mono outline-none resize-y leading-relaxed" />
                          </div>
                        );
                      })}
                      <button onClick={() => act({ action: "add_step", campaign_id: c.id, delay_minutes: 60, subject: "Yeni adım konusu", body_html: "<p>Merhaba {{name}},</p><p>İçerik...</p>" })} disabled={busy}
                        className="btn btn-secondary btn-sm"><Plus className="h-3.5 w-3.5" /> Adım Ekle</button>
                    </div>

                    <div className="pt-2 border-t border-border/20">
                      <button onClick={() => { if (confirm("Bu kampanyayı silmek istiyor musun?")) act({ action: "delete_campaign", id: c.id }); }} disabled={busy}
                        className="text-xs text-red-400 hover:text-red-300 inline-flex items-center gap-1.5"><Trash2 className="h-3.5 w-3.5" /> Kampanyayı Sil</button>
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
