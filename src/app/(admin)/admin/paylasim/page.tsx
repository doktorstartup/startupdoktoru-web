"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Share2, Plus, Trash2, Check, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import Istatistik from "./Istatistik";

// Paylaşım — kameraya konuşulan kısa videoların takibi.
// Fikirden paylaşıma aşama + her platform (Instagram / Shorts / LinkedIn) için
// ayrı metin, link ve "paylaşıldı" işareti. Video dosyaları Drive'da, burada linki.

const PW_KEY = "ds_admin_pw";
const HAFTALIK_HEDEF = 5;

const DURUMLAR = [
  { k: "fikir", ad: "Fikir" },
  { k: "senaryo", ad: "Senaryo hazır" },
  { k: "cekildi", ad: "Çekildi" },
  { k: "kurguda", ad: "Kurguda" },
  { k: "hazir", ad: "Hazır" },
  { k: "paylasildi", ad: "Paylaşıldı" },
] as const;
type Durum = (typeof DURUMLAR)[number]["k"];

const PLATFORMLAR = [
  { k: "instagram", ad: "Instagram" },
  { k: "shorts", ad: "YouTube Shorts" },
  { k: "linkedin", ad: "LinkedIn" },
] as const;
type PlatformK = (typeof PLATFORMLAR)[number]["k"];
type PlatformBilgi = { metin?: string; link?: string; paylasildi_at?: string | null };

// Videodaki 20 efekt — kurgu aşamasında hangisinin kullanılacağı seçilir.
const EFEKTLER = [
  "orbit", "screenwall", "UI world", "frame break", "digital zoom", "phone mockup", "checklist",
  "headline wall", "zoom through cut", "chart grow", "pullback reveal", "greenscreen", "paper cut",
  "doodle boil", "vertigo", "cover story", "glass type", "kinetic captions", "freeze frame", "speed ramp",
];

type Video = {
  id: string;
  baslik: string;
  durum: Durum;
  notlar: string | null;
  efektler: string[];
  ham_link: string | null;
  kurgu_link: string | null;
  hedef_tarih: string | null;
  platformlar: Partial<Record<PlatformK, PlatformBilgi>>;
  created_at: string;
};

const pw = () => {
  try {
    return sessionStorage.getItem(PW_KEY) || "";
  } catch {
    return "";
  }
};

const haftaBasi = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // pazartesi
  return d;
};

const inputCls = "w-full h-10 px-3 rounded-xl bg-background border border-border focus:border-primary/50 text-sm outline-none";

export default function PaylasimAdmin() {
  const [videolar, setVideolar] = useState<Video[] | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [filtre, setFiltre] = useState<Durum | "hepsi">("hepsi");
  const [acik, setAcik] = useState<string | null>(null);
  const [yeniBaslik, setYeniBaslik] = useState("");

  const yukle = useCallback(async () => {
    const r = await fetch(`/api/admin/paylasim?password=${encodeURIComponent(pw())}`);
    const d = await r.json();
    if (!r.ok) return setHata(d.error || "Yüklenemedi.");
    setVideolar(d.videolar);
  }, []);

  useEffect(() => {
    (async () => {
      await yukle();
    })();
  }, [yukle]);

  const istek = async (method: string, body: object) => {
    const r = await fetch("/api/admin/paylasim", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw(), ...body }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) setHata(d.error || "Kaydedilemedi.");
    else setHata(null);
    return r.ok ? d : null;
  };

  const ekle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yeniBaslik.trim()) return;
    const d = await istek("POST", { baslik: yeniBaslik.trim() });
    if (d) {
      setYeniBaslik("");
      setAcik(d.video.id);
      await yukle();
    }
  };

  const bastan = haftaBasi();
  const buHafta = (videolar || []).filter((v) =>
    Object.values(v.platformlar || {}).some((p) => p?.paylasildi_at && new Date(p.paylasildi_at) >= bastan)
  ).length;

  const gorunen = (videolar || []).filter((v) => filtre === "hepsi" || v.durum === filtre);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <Share2 className="h-6 w-6 text-primary" /> Paylaşım
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kameraya konuştuğun videolar: fikirden paylaşıma. Paylaştığın platformu elle işaretle.
        </p>
      </div>

      <div className="glass-panel rounded-2xl border border-border/40 p-5">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-bold">Bu hafta paylaşılan</span>
          <span className="text-muted-foreground">
            {buHafta} / {HAFTALIK_HEDEF}
          </span>
        </div>
        <div className="h-2 rounded-full bg-secondary/40 overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, (buHafta / HAFTALIK_HEDEF) * 100)}%` }} />
        </div>
      </div>

      <form onSubmit={ekle} className="flex gap-2">
        <input value={yeniBaslik} onChange={(e) => setYeniBaslik(e.target.value)} placeholder="Yeni video fikri / başlık" className={inputCls} />
        <button type="submit" className="btn btn-primary btn-sm shrink-0">
          <Plus className="h-4 w-4" /> Ekle
        </button>
      </form>

      <div className="flex flex-wrap gap-2 text-xs">
        {[{ k: "hepsi" as const, ad: "Tümü" }, ...DURUMLAR].map((d) => {
          const sayi = d.k === "hepsi" ? videolar?.length || 0 : (videolar || []).filter((v) => v.durum === d.k).length;
          return (
            <button
              key={d.k}
              onClick={() => setFiltre(d.k)}
              className={`px-3 py-1.5 rounded-lg border ${filtre === d.k ? "border-primary/60 bg-primary/10 text-primary" : "border-border/40 bg-secondary/20"}`}
            >
              {d.ad} <span className="opacity-60">{sayi}</span>
            </button>
          );
        })}
      </div>

      {hata && <p className="text-sm text-red-400">{hata}</p>}
      {!videolar && !hata && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
      {videolar && gorunen.length === 0 && <p className="text-sm text-muted-foreground">Bu aşamada video yok.</p>}

      <div className="space-y-3">
        {gorunen.map((v) => (
          <div key={v.id} className="glass-panel rounded-2xl border border-border/40">
            <button onClick={() => setAcik(acik === v.id ? null : v.id)} className="w-full p-4 flex flex-wrap items-center gap-3 text-left">
              <span className="font-bold flex-1 min-w-[12rem]">{v.baslik}</span>
              <span className="px-2 py-1 rounded-md bg-secondary/40 text-xs">{DURUMLAR.find((d) => d.k === v.durum)?.ad}</span>
              {PLATFORMLAR.map((p) => (
                <span
                  key={p.k}
                  className={`px-2 py-1 rounded-md text-xs ${v.platformlar?.[p.k]?.paylasildi_at ? "bg-emerald-500/15 text-emerald-300" : "bg-secondary/20 text-muted-foreground"}`}
                >
                  {p.ad}
                </span>
              ))}
              {v.hedef_tarih && <span className="text-xs text-muted-foreground">{new Date(v.hedef_tarih).toLocaleDateString("tr-TR")}</span>}
              {acik === v.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {acik === v.id && (
              <Duzenleyici
                video={v}
                kaydet={async (degisen) => {
                  if (await istek("PATCH", { id: v.id, ...degisen })) await yukle();
                }}
                sil={async () => {
                  if (!confirm(`"${v.baslik}" silinsin mi?`)) return;
                  if (await istek("DELETE", { id: v.id })) await yukle();
                }}
              />
            )}
          </div>
        ))}
      </div>

      <Istatistik pw={pw} basliklar={Object.fromEntries((videolar || []).map((v) => [v.id, v.baslik]))} />
    </div>
  );
}

function Duzenleyici({ video, kaydet, sil }: { video: Video; kaydet: (d: Partial<Video>) => Promise<void>; sil: () => void }) {
  const [t, setT] = useState<Video>(video);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const platform = (k: PlatformK, alan: Partial<PlatformBilgi>) =>
    setT({ ...t, platformlar: { ...t.platformlar, [k]: { ...t.platformlar?.[k], ...alan } } });

  const efektDegistir = (e: string) =>
    setT({ ...t, efektler: t.efektler.includes(e) ? t.efektler.filter((x) => x !== e) : [...t.efektler, e] });

  const gonder = async () => {
    setKaydediliyor(true);
    // Üç platformda da paylaşıldıysa aşama kendiliğinden "Paylaşıldı" olur.
    const hepsi = PLATFORMLAR.every((p) => t.platformlar?.[p.k]?.paylasildi_at);
    await kaydet({
      baslik: t.baslik,
      durum: hepsi ? "paylasildi" : t.durum,
      notlar: t.notlar,
      efektler: t.efektler,
      ham_link: t.ham_link,
      kurgu_link: t.kurgu_link,
      hedef_tarih: t.hedef_tarih,
      platformlar: t.platformlar,
    });
    setKaydediliyor(false);
  };

  return (
    <div className="border-t border-border/40 p-4 space-y-4 text-sm">
      <div className="grid sm:grid-cols-3 gap-3">
        <label className="sm:col-span-3 space-y-1">
          <span className="text-xs text-muted-foreground">Başlık</span>
          <input value={t.baslik} onChange={(e) => setT({ ...t, baslik: e.target.value })} className={inputCls} />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Aşama</span>
          <select value={t.durum} onChange={(e) => setT({ ...t, durum: e.target.value as Durum })} className={inputCls}>
            {DURUMLAR.map((d) => (
              <option key={d.k} value={d.k}>
                {d.ad}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs text-muted-foreground">Hedef paylaşım tarihi</span>
          <input type="date" value={t.hedef_tarih || ""} onChange={(e) => setT({ ...t, hedef_tarih: e.target.value })} className={inputCls} />
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-xs text-muted-foreground">Senaryo / notlar</span>
        <textarea value={t.notlar || ""} onChange={(e) => setT({ ...t, notlar: e.target.value })} rows={4} className={`${inputCls} h-auto py-2`} />
      </label>

      <div className="grid sm:grid-cols-2 gap-3">
        {(["ham_link", "kurgu_link"] as const).map((k) => (
          <label key={k} className="space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              {k === "ham_link" ? "Ham video (Drive)" : "Kurgulanmış video (Drive)"}
              {t[k] && (
                <a href={t[k]!} target="_blank" rel="noreferrer" className="text-primary">
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </span>
            <input value={t[k] || ""} onChange={(e) => setT({ ...t, [k]: e.target.value })} placeholder="https://drive.google.com/..." className={inputCls} />
          </label>
        ))}
      </div>

      <div className="space-y-1">
        <span className="text-xs text-muted-foreground">Efektler</span>
        <div className="flex flex-wrap gap-1.5">
          {EFEKTLER.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => efektDegistir(e)}
              className={`px-2 py-1 rounded-md text-xs border ${t.efektler.includes(e) ? "border-primary/60 bg-primary/10 text-primary" : "border-border/40 text-muted-foreground"}`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        {PLATFORMLAR.map((p) => {
          const b = t.platformlar?.[p.k] || {};
          return (
            <div key={p.k} className="rounded-xl border border-border/40 p-3 space-y-2">
              <label className="flex items-center justify-between gap-2 font-bold">
                {p.ad}
                <span className="flex items-center gap-1.5 text-xs font-normal">
                  {b.paylasildi_at ? new Date(b.paylasildi_at).toLocaleDateString("tr-TR") : "Paylaşılmadı"}
                  <input
                    type="checkbox"
                    checked={!!b.paylasildi_at}
                    onChange={(e) => platform(p.k, { paylasildi_at: e.target.checked ? new Date().toISOString() : null })}
                  />
                </span>
              </label>
              <textarea
                value={b.metin || ""}
                onChange={(e) => platform(p.k, { metin: e.target.value })}
                rows={4}
                placeholder="Açıklama + hashtag"
                className={`${inputCls} h-auto py-2`}
              />
              <input value={b.link || ""} onChange={(e) => platform(p.k, { link: e.target.value })} placeholder="Gönderi linki" className={inputCls} />
            </div>
          );
        })}
      </div>

      <div className="flex justify-between">
        <button onClick={sil} className="btn btn-secondary btn-sm">
          <Trash2 className="h-4 w-4" /> Sil
        </button>
        <button onClick={gonder} disabled={kaydediliyor} className="btn btn-primary btn-sm">
          {kaydediliyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Kaydet
        </button>
      </div>
    </div>
  );
}
