"use client";

import { useState } from "react";
import { Ban, CalendarClock, RotateCcw } from "lucide-react";

// Otomatik paylaşım kuyruğu: sıradaki videolar, platform durumu, iptal ve stok.

type Kayit = { durum: string; hata?: string | null; link?: string | null };
export type KuyrukVideo = {
  id: string;
  baslik: string;
  durum: string;
  yayin_at: string | null;
  yayin_bitti_at: string | null;
  iptal_at: string | null;
  video_yol: string | null;
  yayin: { shorts?: Kayit; instagram?: Kayit };
};

const GUN = 24 * 3600000;
const STOK_ALT = 3;
const PLATFORM = [
  ["shorts", "YouTube"],
  ["instagram", "Instagram"],
] as const;
const ETIKET: Record<string, { ad: string; cls: string }> = {
  bekliyor: { ad: "Bekliyor", cls: "bg-secondary/30 text-muted-foreground" },
  isleniyor: { ad: "İşleniyor", cls: "bg-amber-500/15 text-amber-300" },
  yayinda: { ad: "Yayında", cls: "bg-emerald-500/15 text-emerald-300" },
  atlandi: { ad: "Elle paylaşıldı", cls: "bg-secondary/30 text-muted-foreground" },
  hata: { ad: "Hata", cls: "bg-red-500/15 text-red-300" },
  kilitli: { ad: "Kilitli", cls: "bg-red-500/15 text-red-300" },
};

const tarih = (s: string) => new Date(s).toLocaleString("tr-TR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function Kuyruk({ videolar, islem }: { videolar: KuyrukVideo[]; islem: (id: string, islem: string, platform?: string) => Promise<void> }) {
  const [simdi] = useState(() => Date.now()); // 24 saat sınırını asıl sunucu uygular
  // Bitmiş satırlar hata varsa görünür kalır; temiz bitenler listeden düşer.
  const liste = videolar
    .filter((v) => v.yayin_at && (!v.yayin_bitti_at || v.durum !== "paylasildi"))
    .sort((a, b) => a.yayin_at!.localeCompare(b.yayin_at!));
  const stok = liste.filter((v) => new Date(v.yayin_at!).getTime() > simdi).length;
  const iptaller = videolar.filter((v) => v.iptal_at && !v.yayin_at && v.video_yol);

  return (
    <div className="glass-panel rounded-2xl border border-border/40 p-5 space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-bold flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" /> Otomatik paylaşım kuyruğu
        </span>
        <span className={stok < STOK_ALT ? "font-bold text-red-400" : "text-muted-foreground"}>{stok} günlük stok</span>
      </div>
      {stok < STOK_ALT && <p className="text-xs text-red-400">Stok {STOK_ALT} günün altında: yeni video gerekiyor.</p>}
      {liste.length === 0 && <p className="text-sm text-muted-foreground">Kuyrukta video yok.</p>}

      {liste.map((v) => {
        const kalan = new Date(v.yayin_at!).getTime() - simdi;
        return (
          <div key={v.id} className="rounded-xl border border-border/40 p-3 space-y-2 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground w-36 shrink-0">{tarih(v.yayin_at!)}</span>
              <span className="font-bold flex-1 min-w-[10rem]">{v.baslik}</span>
              {kalan > 0 && (
                <button
                  disabled={kalan <= GUN}
                  title={kalan <= GUN ? "Yayına 24 saatten az kaldı" : undefined}
                  onClick={() => confirm(`"${v.baslik}" kuyruktan çıkarılsın mı?`) && islem(v.id, "iptal")}
                  className="btn btn-secondary btn-sm disabled:opacity-40"
                >
                  <Ban className="h-4 w-4" /> İptal
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {PLATFORM.map(([k, ad]) => {
                const s = v.yayin?.[k];
                const e = ETIKET[s?.durum || "bekliyor"];
                return (
                  <span key={k} className="flex flex-wrap items-center gap-1.5">
                    <span className={`px-2 py-1 rounded-md ${e.cls}`}>
                      {ad}: {e.ad}
                    </span>
                    {s?.hata && <span className="text-red-400">{s.hata}</span>}
                    {s?.durum === "hata" && (
                      <button
                        onClick={() => confirm("Yeniden denensin mi? Hata metni kanalı kontrol etmeni söylüyorsa önce kontrol et.") && islem(v.id, "yeniden_dene", k)}
                        className="text-primary flex items-center gap-1"
                      >
                        <RotateCcw className="h-3 w-3" /> Yeniden dene
                      </button>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}

      {iptaller.map((v) => (
        <div key={v.id} className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="flex-1">İptal edildi: {v.baslik}</span>
          <button onClick={() => islem(v.id, "kuyruga_al")} className="btn btn-secondary btn-sm">
            Kuyruğa al
          </button>
        </div>
      ))}
    </div>
  );
}
