"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Newspaper, Plus, Edit3, Trash2, Loader2, Eye, X, Check, ExternalLink } from "lucide-react";

type Post = {
  id: string;
  title: string;
  slug: string;
  content: string;
  seo_title: string | null;
  seo_description: string | null;
  cover_image: string | null;
  created_at: string;
  views: number;
};

type Draft = {
  id?: string;
  title: string;
  slug: string;
  content: string;
  seo_title: string;
  seo_description: string;
  cover_image: string;
};

const EMPTY: Draft = { title: "", slug: "", content: "", seo_title: "", seo_description: "", cover_image: "" };

function getPw() {
  try {
    return sessionStorage.getItem("ds_admin_pw") || "";
  } catch {
    return "";
  }
}

export default function BlogAdmin() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const load = () => {
    setLoading(true);
    fetch(`/api/admin/blog?password=${encodeURIComponent(getPw())}`)
      .then((r) => r.json())
      .then((d) => setPosts(d.posts || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    if (!draft) return;
    setErr("");
    if (!draft.title || !draft.content) {
      setErr("Başlık ve içerik zorunlu.");
      return;
    }
    setSaving(true);
    try {
      const isEdit = !!draft.id;
      const res = await fetch("/api/admin/blog", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: getPw(), ...draft }),
      });
      const d = await res.json();
      if (!res.ok) {
        setErr(d.error || "Kaydedilemedi.");
      } else {
        setDraft(null);
        load();
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Bu yazıyı silmek istediğine emin misin?")) return;
    await fetch(`/api/admin/blog?password=${encodeURIComponent(getPw())}&id=${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-4">
        <div>
          <span className="text-primary text-xs font-bold font-mono tracking-widest uppercase">Blog Yönetimi</span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1 flex items-center gap-2">
            <Newspaper className="h-7 w-7 text-primary" /> Yazılar
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Yazı ekle/düzenle. Her yazının okunma sayısı yanında görünür.</p>
        </div>
        {!draft && (
          <button onClick={() => setDraft({ ...EMPTY })} className="btn btn-primary shrink-0">
            <Plus className="h-4 w-4" /> Yeni Yazı
          </button>
        )}
      </div>

      {/* Editör */}
      {draft && (
        <div className="glass-panel rounded-2xl border border-primary/30 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">{draft.id ? "Yazıyı Düzenle" : "Yeni Yazı"}</h3>
            <button onClick={() => setDraft(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Başlık *"
              className="w-full h-11 px-4 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none" />
            <input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} placeholder="URL (boşsa başlıktan üretilir)"
              className="w-full h-11 px-4 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none font-mono" />
          </div>
          <textarea value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} placeholder="İçerik (düz metin, paragraflar satır boşluğuyla ayrılır) *"
            className="w-full h-64 p-4 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none resize-y leading-relaxed" />
          <input value={draft.cover_image} onChange={(e) => setDraft({ ...draft, cover_image: e.target.value })} placeholder="Kapak görseli URL (opsiyonel)"
            className="w-full h-11 px-4 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none" />
          <div className="grid sm:grid-cols-2 gap-4">
            <input value={draft.seo_title} onChange={(e) => setDraft({ ...draft, seo_title: e.target.value })} placeholder="SEO başlığı (opsiyonel)"
              className="w-full h-11 px-4 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none" />
            <input value={draft.seo_description} onChange={(e) => setDraft({ ...draft, seo_description: e.target.value })} placeholder="SEO açıklaması (opsiyonel)"
              className="w-full h-11 px-4 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none" />
          </div>
          {err && <p className="text-xs text-red-400">{err}</p>}
          <div className="flex gap-3">
            <button onClick={save} disabled={saving} className="btn btn-primary disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Kaydet
            </button>
            <button onClick={() => setDraft(null)} className="btn btn-secondary">Vazgeç</button>
          </div>
        </div>
      )}

      {/* Liste */}
      <div className="glass-panel rounded-2xl border border-border/40 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Henüz yazı yok. &quot;Yeni Yazı&quot; ile başla.</div>
        ) : (
          <div className="divide-y divide-border/20">
            {posts.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-4 p-4 hover:bg-secondary/10 transition-colors">
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate">{p.title}</div>
                  <div className="text-[11px] text-muted-foreground font-mono mt-0.5 flex items-center gap-3">
                    <span>/blog/{p.slug}</span>
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {p.views} okunma</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/blog/${p.slug}`} target="_blank" className="h-8 w-8 rounded-lg bg-secondary/80 border border-border/80 text-muted-foreground hover:text-primary inline-flex items-center justify-center transition-all">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                  <button onClick={() => setDraft({ id: p.id, title: p.title, slug: p.slug, content: p.content, seo_title: p.seo_title || "", seo_description: p.seo_description || "", cover_image: p.cover_image || "" })}
                    className="h-8 w-8 rounded-lg bg-secondary/80 border border-border/80 text-muted-foreground hover:text-primary inline-flex items-center justify-center transition-all">
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => remove(p.id)} className="h-8 w-8 rounded-lg bg-red-950/20 border border-red-950/30 text-red-400 hover:bg-red-500/10 inline-flex items-center justify-center transition-all">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
