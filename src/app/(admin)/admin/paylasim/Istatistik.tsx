"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, BarChart3 } from "lucide-react";

// Platformdan SALT OKUNAN video istatistikleri (şimdilik YouTube).
// Günlük cron doldurur; "Şimdi senkronla" beklemeden çeker.

type SosyalVideo = {
  id: string;
  platform: string;
  video_id: string;
  paylasim_id: string | null;
  baslik: string | null;
  yayin_at: string | null;
  sure_sn: number | null;
  metrikler: { views?: number; dakika?: number; ort_sure_sn?: number; ort_yuzde?: number; begeni?: number; yorum?: number; paylasim?: number; abone?: number };
  tutma: [number, number][] | null;
  guncellendi_at: string;
};

const sayi = (n?: number) => (n == null ? "—" : n.toLocaleString("tr-TR"));

// Ardışık iki nokta arasındaki en büyük düşüş → "en büyük kopuş" saniyesi
const enBuyukKopus = (t: [number, number][], sure: number) => {
  let en = { sn: 0, dusus: 0 };
  for (let i = 1; i < t.length; i++) {
    const d = t[i - 1][1] - t[i][1];
    if (d > en.dusus) en = { sn: Math.round(t[i][0] * sure), dusus: d };
  }
  return en;
};

function TutmaEgrisi({ t, sure }: { t: [number, number][]; sure: number }) {
  const W = 320, H = 90;
  const yMax = Math.max(1, ...t.map((p) => p[1]));
  const yol = t.map((p, i) => `${i ? "L" : "M"}${(p[0] * W).toFixed(1)},${(H - (p[1] / yMax) * H).toFixed(1)}`).join(" ");
  const k = enBuyukKopus(t, sure);
  return (
    <div className="space-y-1">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-sm h-24 overflow-visible">
        {yMax > 1 && <line x1={0} x2={W} y1={H - H / yMax} y2={H - H / yMax} className="stroke-border" strokeDasharray="3 3" />}
        <path d={yol} fill="none" className="stroke-primary" strokeWidth={2} />
        {sure > 0 && <line x1={(k.sn / sure) * W} x2={(k.sn / sure) * W} y1={0} y2={H} className="stroke-red-400" strokeDasharray="2 3" />}
      </svg>
      <p className="text-xs text-muted-foreground">
        İzleyici tutma (100% = başlangıç{yMax > 1 ? "; kesikli çizginin üstü = tekrar izlenme" : ""}). En büyük kopuş:{" "}
        <span className="text-red-400 font-bold">{k.sn}. sn</span>
      </p>
    </div>
  );
}

export default function Istatistik({ pw, basliklar }: { pw: () => string; basliklar: Record<string, string> }) {
  const [videolar, setVideolar] = useState<SosyalVideo[] | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [cekiliyor, setCekiliyor] = useState(false);
  const [acik, setAcik] = useState<string | null>(null);

  const yukle = useCallback(async () => {
    const r = await fetch(`/api/admin/sosyal?password=${encodeURIComponent(pw())}`);
    const d = await r.json();
    if (!r.ok) return setHata(d.error || "Yüklenemedi.");
    setVideolar(d.videolar);
  }, [pw]);

  useEffect(() => {
    (async () => {
      await yukle();
    })();
  }, [yukle]);

  const senkronla = async () => {
    setCekiliyor(true);
    const r = await fetch("/api/admin/sosyal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw() }),
    });
    const d = await r.json().catch(() => ({}));
    setHata(r.ok ? null : d.error || "Senkron başarısız.");
    await yukle();
    setCekiliyor(false);
  };

  const sonGuncelleme = videolar?.[0] && videolar.reduce((a, v) => (v.guncellendi_at > a ? v.guncellendi_at : a), "");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-extrabold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" /> YouTube istatistikleri
        </h2>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {sonGuncelleme && <span>Son: {new Date(sonGuncelleme).toLocaleString("tr-TR")}</span>}
          <button onClick={senkronla} disabled={cekiliyor} className="btn btn-secondary btn-sm">
            {cekiliyor ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Şimdi senkronla
          </button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Ortalama izlenme ve tutma eğrisi YouTube&apos;dan 2-3 gün gecikmeli gelir.</p>

      {hata && <p className="text-sm text-red-400">{hata}</p>}
      {!videolar && !hata && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
      {videolar && videolar.length === 0 && <p className="text-sm text-muted-foreground">Henüz veri yok — &quot;Şimdi senkronla&quot;.</p>}

      {videolar && videolar.length > 0 && (
        <div className="glass-panel rounded-2xl border border-border/40 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground text-left">
              <tr className="border-b border-border/40">
                <th className="p-3">Video</th>
                <th className="p-3 text-right">Görüntülenme</th>
                <th className="p-3 text-right">Ort. izlenme</th>
                <th className="p-3 text-right">Beğeni</th>
                <th className="p-3 text-right">Paylaşım</th>
                <th className="p-3 text-right">Abone</th>
              </tr>
            </thead>
            <tbody>
              {videolar.map((v) => {
                const m = v.metrikler || {};
                return [
                  <tr
                    key={v.id}
                    onClick={() => setAcik(acik === v.id ? null : v.id)}
                    className="border-b border-border/20 cursor-pointer hover:bg-secondary/20"
                  >
                    <td className="p-3">
                      <div className="font-bold">{v.baslik}</div>
                      <div className="text-xs text-muted-foreground">
                        {v.yayin_at && new Date(v.yayin_at).toLocaleDateString("tr-TR")} · {v.sure_sn} sn
                        {v.paylasim_id && basliklar[v.paylasim_id] && <span className="text-primary"> · {basliklar[v.paylasim_id]}</span>}
                      </div>
                    </td>
                    <td className="p-3 text-right">{sayi(m.views)}</td>
                    <td className="p-3 text-right">
                      {m.ort_yuzde == null ? "—" : `%${Math.round(m.ort_yuzde)}`}
                      {m.ort_sure_sn != null && <div className="text-xs text-muted-foreground">{m.ort_sure_sn} sn</div>}
                    </td>
                    <td className="p-3 text-right">{sayi(m.begeni)}</td>
                    <td className="p-3 text-right">{sayi(m.paylasim)}</td>
                    <td className="p-3 text-right">{sayi(m.abone)}</td>
                  </tr>,
                  acik === v.id && (
                    <tr key={`${v.id}-t`} className="border-b border-border/20">
                      <td colSpan={6} className="p-3">
                        {v.tutma && v.sure_sn ? (
                          <TutmaEgrisi t={v.tutma} sure={v.sure_sn} />
                        ) : (
                          <p className="text-xs text-muted-foreground">Tutma eğrisi henüz yok (yeni video ya da az izlenme).</p>
                        )}
                        <a href={`https://youtube.com/shorts/${v.video_id}`} target="_blank" rel="noreferrer" className="text-xs text-primary">
                          YouTube&apos;da aç
                        </a>
                      </td>
                    </tr>
                  ),
                ];
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
