"use client";

import { useEffect, useState } from "react";
import { Megaphone, Loader2, Send, Check, X } from "lucide-react";

function getPw() {
  try {
    return sessionStorage.getItem("ds_admin_pw") || "";
  } catch {
    return "";
  }
}

export default function BroadcastAdmin() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("<p>Merhaba {{name}},</p>\n<p>Bu hafta startup dünyasından öne çıkanlar...</p>");
  const [testEmail, setTestEmail] = useState("");
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState<"test" | "all" | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/admin/broadcast?password=${encodeURIComponent(getPw())}`)
      .then((r) => r.json())
      .then((d) => setCount(d.count ?? 0))
      .catch(() => setCount(0));
  }, []);

  const send = async (mode: "test" | "all") => {
    setMsg(null);
    if (!subject.trim() || !body.trim()) return setMsg({ type: "err", text: "Konu ve içerik gerekli." });
    if (mode === "test" && !testEmail.includes("@")) return setMsg({ type: "err", text: "Test için geçerli e-posta gir." });
    if (mode === "all" && !confirm(`${count} kişiye bülten gönderilecek. Emin misin?`)) return;

    setLoading(mode);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: getPw(), subject, body_html: body, ...(mode === "test" ? { testEmail } : {}) }),
      });
      const d = await res.json();
      if (!res.ok) setMsg({ type: "err", text: d.error || "Gönderilemedi." });
      else if (d.skipped) setMsg({ type: "err", text: "Resend bağlı değil — mail gitmedi. RESEND_API_KEY ekle." });
      else if (d.test) setMsg({ type: "ok", text: `Test maili ${testEmail} adresine gönderildi.` });
      else setMsg({ type: "ok", text: `${d.sent}/${d.total} kişiye gönderildi.${d.failed ? ` (${d.failed} başarısız)` : ""}` });
    } catch {
      setMsg({ type: "err", text: "Bağlantı hatası." });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <span className="text-primary text-xs font-bold font-mono tracking-widest uppercase">Bülten</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-primary" /> Toplu Bilgilendirme Maili
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Tüm kayıtlı kişilere tek seferlik mail (ör. haftalık startup haberleri). Şu an <strong className="text-foreground">{count ?? "…"}</strong> kişi. <code className="text-foreground">{`{{name}}`}</code> kullanılabilir.
        </p>
      </div>

      <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.05] px-4 py-2.5 text-xs text-amber-300/90">
        Önce <strong>kendine test</strong> gönder, görünümü kontrol et; sonra herkese yolla. (Resend ücretsiz planı günlük limitlidir — büyük listede limite takılabilirsin.)
      </div>

      <div className="glass-panel rounded-2xl border border-border/40 p-6 space-y-4">
        <div>
          <label className="text-[10px] font-bold text-muted-foreground block mb-1.5 uppercase tracking-wider">Konu</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Haftalık Startup Haberleri — Bu hafta..."
            className="w-full h-11 px-4 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted-foreground block mb-1.5 uppercase tracking-wider">İçerik (HTML)</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)}
            className="w-full h-56 p-3 rounded-xl bg-background border border-border focus:border-primary/50 text-xs font-mono outline-none resize-y leading-relaxed" />
        </div>

        {msg && (
          <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-2.5 ${msg.type === "ok" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
            {msg.type === "ok" ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}{msg.text}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <div className="flex gap-2 flex-1">
            <input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="test@mail.com"
              className="flex-1 h-11 px-4 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none" />
            <button onClick={() => send("test")} disabled={loading !== null} className="btn btn-secondary disabled:opacity-60">
              {loading === "test" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test Gönder"}
            </button>
          </div>
          <button onClick={() => send("all")} disabled={loading !== null} className="btn btn-primary disabled:opacity-60">
            {loading === "all" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Herkese Gönder ({count ?? 0})
          </button>
        </div>
      </div>
    </div>
  );
}
