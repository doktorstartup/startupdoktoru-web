"use client";

import { useEffect, useMemo, useState } from "react";
import { KeyRound, UserPlus, Loader2, Check, X, ShieldCheck, Search } from "lucide-react";

const PRODUCTS = [
  { id: "ebook_13_steps", label: "E-Kitap (13 Adımda Milyon Dolarlık Startup)" },
  { id: "investor_training", label: "Yatırımcı Sunumu Hazırlama" },
  { id: "startup_giris", label: "Startup Giriş Rehberi" },
  { id: "degerleme", label: "Startup Değerleme & Pazarlık" },
  { id: "all_access_bundle", label: "Tüm Eğitimler Paketi (3 eğitim)" },
];

const PW_KEY = "ds_admin_pw";

type Person = { email: string; name: string };
type Lead = { id: string; name: string | null; email: string; phone: string | null; company: string | null };
type OwnedOrder = { product_id: string; payment_method: string };

function getPw() {
  try {
    return sessionStorage.getItem(PW_KEY) || "";
  } catch {
    return "";
  }
}

export default function AccessAdmin() {
  const [password, setPassword] = useState("");
  const [people, setPeople] = useState<Person[]>([]); // seçilen alıcılar
  const [query, setQuery] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState<"grant" | "revoke" | "lookup" | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [owned, setOwned] = useState<{ email: string; orders: OwnedOrder[] } | null>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(PW_KEY);
      if (saved) setPassword(saved);
    } catch {
      /* yoksa boş */
    }
  }, []);

  // Kişi listesini (lead'ler) bir kez çek — arama için.
  useEffect(() => {
    if (!password) return;
    fetch(`/api/admin/leads?password=${encodeURIComponent(password)}`)
      .then((r) => r.json())
      .then((d) => setLeads(d.leads || []))
      .catch(() => setLeads([]));
  }, [password]);

  const rememberPw = (pw: string) => {
    setPassword(pw);
    try {
      sessionStorage.setItem(PW_KEY, pw);
    } catch {
      /* sessizce geç */
    }
  };

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));

  // İsim veya e-postaya göre arama sonuçları (seçilmemiş olanlar)
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) return [];
    const chosen = new Set(people.map((p) => p.email));
    return leads
      .filter((l) => {
        if (chosen.has(l.email.toLowerCase())) return false;
        return (l.name || "").toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || (l.company || "").toLowerCase().includes(q);
      })
      .slice(0, 8);
  }, [query, leads, people]);

  const addPerson = (p: Person) => {
    const email = p.email.trim().toLowerCase();
    if (!email.includes("@")) return;
    if (people.some((x) => x.email === email)) return;
    setPeople((prev) => [...prev, { email, name: p.name || "" }]);
    setQuery("");
  };

  const removePerson = (email: string) => setPeople((prev) => prev.filter((p) => p.email !== email));

  const queryIsEmail = query.trim().includes("@") && query.trim().length > 3;

  const submit = async (action: "grant" | "revoke") => {
    setMsg(null);
    if (!password) return setMsg({ type: "err", text: "Önce yönetici şifresini gir." });
    if (people.length === 0) return setMsg({ type: "err", text: "En az bir kişi seç." });
    if (selected.length === 0) return setMsg({ type: "err", text: "En az bir ürün seç." });

    setLoading(action);
    try {
      const res = await fetch("/api/admin/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, recipients: people, productIds: selected, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: "err", text: data.error || "İşlem başarısız." });
      } else {
        setMsg({
          type: "ok",
          text: action === "grant" ? `${data.count} kişiye erişim açıldı.` : `${data.count} kişiden erişim kaldırıldı.`,
        });
      }
    } catch {
      setMsg({ type: "err", text: "Bağlantı hatası." });
    } finally {
      setLoading(null);
    }
  };

  const lookup = async (email: string) => {
    if (!password || !email.includes("@")) return;
    setLoading("lookup");
    try {
      const res = await fetch(`/api/admin/grant?password=${encodeURIComponent(password)}&email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (res.ok) setOwned({ email, orders: data.orders || [] });
      else setMsg({ type: "err", text: data.error || "Sorgu başarısız." });
    } catch {
      setMsg({ type: "err", text: "Bağlantı hatası." });
    } finally {
      setLoading(null);
    }
  };

  const labelFor = (id: string) => PRODUCTS.find((p) => p.id === id)?.label || id;

  return (
    <div className="space-y-8">
      <div>
        <span className="text-primary text-xs font-bold font-mono tracking-widest uppercase">Erişim Yönetimi</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 flex items-center gap-2">
          <UserPlus className="h-6 w-6 text-primary" /> Manuel Erişim Aç / Kaldır
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          İsim veya e-posta ile kişi ara, <span className="text-foreground font-semibold">birden fazla kişi</span> seç, ürünleri aç/kaldır.
          Kişi <span className="text-foreground font-semibold">/portal</span>&apos;a bu e-posta ile girince içerik açılır.
        </p>
      </div>

      {/* Yönetici şifresi */}
      <div className="glass-panel rounded-2xl border border-border/40 p-5 max-w-2xl">
        <label className="text-[10px] font-bold text-muted-foreground block mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
          <KeyRound className="h-3.5 w-3.5" /> Yönetici Şifresi
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => rememberPw(e.target.value)}
          placeholder="ADMIN_PASSWORD"
          className="w-full h-11 px-4 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none transition-all"
        />
      </div>

      {/* Form */}
      <div className="glass-panel rounded-2xl border border-border/40 p-6 max-w-2xl space-y-5">
        {/* Kişi arama + çoklu seçim */}
        <div>
          <label className="text-[10px] font-bold text-muted-foreground block mb-1.5 uppercase tracking-wider">Kişi(ler) — isim veya e-posta ile ara</label>

          {/* Seçilen kişiler (chip) */}
          {people.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {people.map((p) => (
                <span key={p.email} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-semibold pl-3 pr-1.5 py-1">
                  {p.name ? `${p.name} · ${p.email}` : p.email}
                  <button onClick={() => removePerson(p.email)} className="hover:bg-primary/20 rounded-full p-0.5"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="İsim, e-posta veya şirket yaz…"
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none transition-all"
            />
            {/* Sonuç açılır listesi */}
            {(results.length > 0 || queryIsEmail) && (
              <div className="absolute z-20 mt-1 w-full rounded-xl border border-border/60 bg-[#0E1726] shadow-2xl overflow-hidden">
                {results.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => addPerson({ email: l.email, name: l.name || "" })}
                    className="w-full text-left px-4 py-2.5 hover:bg-secondary/40 transition-colors flex items-center justify-between gap-2"
                  >
                    <span className="text-sm font-semibold text-foreground truncate">{l.name || "(isimsiz)"}</span>
                    <span className="text-xs text-muted-foreground truncate">{l.email}{l.company ? ` · ${l.company}` : ""}</span>
                  </button>
                ))}
                {queryIsEmail && !results.some((r) => r.email.toLowerCase() === query.trim().toLowerCase()) && (
                  <button
                    onClick={() => addPerson({ email: query, name: "" })}
                    className="w-full text-left px-4 py-2.5 hover:bg-secondary/40 transition-colors text-sm text-primary font-semibold border-t border-border/30"
                  >
                    + Listede yok — &quot;{query.trim()}&quot; ekle
                  </button>
                )}
              </div>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">Listede yoksa tam e-postayı yazıp ekleyebilirsin. {leads.length > 0 && `(${leads.length} kayıtlı kişi)`}</p>
        </div>

        {/* Ürünler */}
        <div>
          <label className="text-[10px] font-bold text-muted-foreground block mb-2 uppercase tracking-wider">Ürünler</label>
          <div className="space-y-2">
            {PRODUCTS.map((p) => (
              <label
                key={p.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50 bg-secondary/15 cursor-pointer hover:border-primary/30 transition-all"
              >
                <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} className="h-4 w-4 accent-[color:var(--color-primary)]" />
                <span className="text-sm font-medium">{p.label}</span>
              </label>
            ))}
          </div>
        </div>

        {msg && (
          <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-2.5 ${msg.type === "ok" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
            {msg.type === "ok" ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            {msg.text}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button onClick={() => submit("grant")} disabled={loading !== null} className="btn btn-primary disabled:opacity-60">
            {loading === "grant" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Erişimi Aç {people.length > 1 ? `(${people.length} kişi)` : ""}
          </button>
          <button onClick={() => submit("revoke")} disabled={loading !== null} className="btn btn-secondary disabled:opacity-60">
            {loading === "revoke" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            Erişimi Kaldır
          </button>
          <button onClick={() => people[0] && lookup(people[0].email)} disabled={loading !== null || people.length === 0} className="btn btn-secondary disabled:opacity-60">
            {loading === "lookup" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            İlk Kişinin Erişimini Sorgula
          </button>
        </div>
      </div>

      {/* Mevcut erişim */}
      {owned && (
        <div className="glass-panel rounded-2xl border border-border/40 p-6 max-w-2xl">
          <h3 className="text-sm font-bold mb-3">{owned.email} — mevcut erişim</h3>
          {owned.orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Bu e-posta için ödenmiş/açılmış erişim yok.</p>
          ) : (
            <ul className="space-y-2">
              {owned.orders.map((o, i) => (
                <li key={i} className="flex items-center justify-between text-sm border border-border/40 rounded-lg px-3 py-2">
                  <span className="font-medium">{labelFor(o.product_id)}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${o.payment_method === "manual" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}>
                    {o.payment_method === "manual" ? "Manuel" : o.payment_method}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
