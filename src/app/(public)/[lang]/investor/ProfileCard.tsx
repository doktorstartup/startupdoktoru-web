"use client";

import { useState } from "react";
import { Loader2, Pencil } from "lucide-react";

export type Investor = { firm_name: string; partner_name: string | null; role: string | null; thesis: string | null; sectors: string[]; stages: string[]; ticket: string | null };
type Patch = Omit<Investor, "firm_name">;

const input = "w-full rounded-lg bg-secondary/30 border border-border/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50";
const label = "block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1";
const list = (v: string) => v.split(",").map((x) => x.trim()).filter(Boolean);

// Yatırımcının kendi profili: görüntüleme + yerinde düzenleme. Firma adı düzenlenmez (kimlik).
export default function ProfileCard({ investor, onSave }: { investor: Investor; onSave: (p: Patch) => Promise<boolean> }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const [f, setF] = useState({ partner_name: "", role: "", thesis: "", sectors: "", stages: "", ticket: "" });

  const open = () => {
    setF({
      partner_name: investor.partner_name || "",
      role: investor.role || "",
      thesis: investor.thesis || "",
      sectors: investor.sectors.join(", "),
      stages: investor.stages.join(", "),
      ticket: investor.ticket || "",
    });
    setFailed(false);
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    const ok = await onSave({ ...f, sectors: list(f.sectors), stages: list(f.stages) });
    setSaving(false);
    if (ok) setEditing(false);
    else setFailed(true);
  };

  const name = investor.partner_name || investor.firm_name;
  const initials = name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  if (editing) {
    return (
      <div className="glass-panel rounded-2xl border border-border/40 p-6 space-y-3.5">
        <h2 className="font-bold">Edit your profile</h2>
        <div><label className={label}>Name</label><input className={input} value={f.partner_name} onChange={(e) => setF({ ...f, partner_name: e.target.value })} /></div>
        <div><label className={label}>Role</label><input className={input} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} placeholder="Partner at …" /></div>
        <div><label className={label}>Investment thesis</label><textarea className={`${input} min-h-28`} value={f.thesis} onChange={(e) => setF({ ...f, thesis: e.target.value })} placeholder="What do you look for in a company?" /></div>
        <div><label className={label}>Sectors</label><input className={input} value={f.sectors} onChange={(e) => setF({ ...f, sectors: e.target.value })} placeholder="AI, FinTech, SaaS" /></div>
        <div><label className={label}>Stages</label><input className={input} value={f.stages} onChange={(e) => setF({ ...f, stages: e.target.value })} placeholder="pre-seed, seed" /></div>
        <div><label className={label}>Ticket size</label><input className={input} value={f.ticket} onChange={(e) => setF({ ...f, ticket: e.target.value })} placeholder="$100k–$1M" /></div>
        <p className="text-[11px] text-muted-foreground">Separate sectors and stages with commas. We use these to pick your matches.</p>
        {failed && <p className="text-xs text-red-400">Couldn&apos;t save — please try again.</p>}
        <div className="flex items-center gap-2 pt-1">
          <button onClick={save} disabled={saving} className="btn btn-primary btn-sm flex-1">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save</button>
          <button onClick={() => setEditing(false)} disabled={saving} className="btn btn-secondary btn-sm">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl border border-border/40 p-6">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br from-primary to-primary-foreground flex items-center justify-center text-background font-black">{initials}</div>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-foreground leading-tight">{name}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{investor.role || investor.firm_name}</p>
        </div>
        <button onClick={open} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"><Pencil className="h-3.5 w-3.5" /> Edit</button>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <p className={label}>Investment thesis</p>
          {investor.thesis
            ? <p className="text-sm text-muted-foreground leading-relaxed line-clamp-6">{investor.thesis}</p>
            : <button onClick={open} className="text-sm text-primary hover:underline">Add your thesis to sharpen your matches →</button>}
        </div>
        {investor.sectors.length > 0 && (
          <div>
            <p className={label}>Sectors</p>
            <div className="flex flex-wrap gap-1.5">
              {investor.sectors.map((x) => <span key={x} className="text-[11px] px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary">{x}</span>)}
            </div>
          </div>
        )}
        {investor.stages.length > 0 && (
          <div>
            <p className={label}>Stages</p>
            <div className="flex flex-wrap gap-1.5">
              {investor.stages.map((x) => <span key={x} className="text-[11px] px-2 py-0.5 rounded bg-secondary/40 border border-border/40 text-muted-foreground capitalize">{x}</span>)}
            </div>
          </div>
        )}
        {investor.ticket && (
          <div>
            <p className={label}>Ticket size</p>
            <p className="text-sm text-foreground/90">{investor.ticket.replace("tipik", "typically")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
