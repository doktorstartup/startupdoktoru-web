"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, Target } from "lucide-react";

// Reklam × sonuç: hangi reklam ne harcadı, kaç ziyaret/lead/satış getirdi.
// Harcama Meta'dan günlük çekilir; sonuçlar sitede utm_content (= reklam kimliği) ile eşleşir.

const PW_KEY = "ds_admin_pw";
const pw = () => {
  try {
    return sessionStorage.getItem(PW_KEY) || "";
  } catch {
    return "";
  }
};

type Reklam = {
  ad_id: string;
  ad_ad: string | null;
  kampanya_ad: string | null;
  adset_ad: string | null;
  para_birimi: string | null;
  harcama: number;
  gosterim: number;
  link_tiklama: number;
  video_3sn: number;
  siklik_max: number;
  ziyaretci: number;
  lead: number;
  odeme_formu: number;
  satis: number;
  ciro: number;
};

const sayi = (n: number) => n.toLocaleString("tr-TR");
const para = (n: number, pb?: string | null) => (pb ? `${n.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ${pb}` : "—");
const oran = (a: number, b: number) => (b > 0 ? `%${((a / b) * 100).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}` : "—");
const bol = (a: number, b: number, pb?: string | null) => (b > 0 && a > 0 ? para(a / b, pb) : "—");

const BAGLANTI = "utm_source=meta&utm_medium=paid&utm_campaign={{campaign.id}}&utm_term={{adset.id}}&utm_content={{ad.id}}";

export default function ReklamPage() {
  const [gun, setGun] = useState(30);
  const [veri, setVeri] = useState<{ reklamlar: Reklam[]; son_senkron: string | null; hesap_bagli: boolean } | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [cekiliyor, setCekiliyor] = useState(false);

  const yukle = useCallback(async () => {
    setHata(null);
    const r = await fetch(`/api/admin/reklam?gun=${gun}&password=${encodeURIComponent(pw())}`);
    const d = await r.json();
    if (!r.ok) return setHata(d.error || "Yüklenemedi.");
    setVeri(d);
  }, [gun]);

  useEffect(() => {
    (async () => {
      await yukle();
    })();
  }, [yukle]);

  const senkronla = async () => {
    setCekiliyor(true);
    setHata(null);
    const r = await fetch("/api/admin/reklam", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw() }) });
    const d = await r.json();
    setCekiliyor(false);
    if (!r.ok) return setHata(d.error || "Senkron başarısız.");
    if (d.atlandi) return setHata(`Reklam hesabı bağlı değil: ${d.atlandi}`);
    await yukle();
  };

  const reklamlar = veri?.reklamlar || [];
  const pb = reklamlar.find((r) => r.para_birimi)?.para_birimi || null;
  const top = reklamlar.reduce(
    (t, r) => ({ harcama: t.harcama + r.harcama, gosterim: t.gosterim + r.gosterim, lead: t.lead + r.lead, satis: t.satis + r.satis, ciro: t.ciro + r.ciro, ziyaretci: t.ziyaretci + r.ziyaretci }),
    { harcama: 0, gosterim: 0, lead: 0, satis: 0, ciro: 0, ziyaretci: 0 }
  );

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-[1400px]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2"><Target className="w-6 h-6 text-primary" /> Reklam Performansı</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Harcama Meta&apos;dan, sonuç siteden. Satış ve ciro sipariş kaydından (USD); harcama reklam hesabının para biriminde.
            {veri?.son_senkron && <> Son senkron: {new Date(veri.son_senkron).toLocaleString("tr-TR")}.</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 30, 90].map((g) => (
            <button key={g} onClick={() => setGun(g)} className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${gun === g ? "bg-primary text-primary-foreground border-primary" : "border-border/60 text-muted-foreground"}`}>
              {g} gün
            </button>
          ))}
          <button onClick={senkronla} disabled={cekiliyor} className="px-3 py-1.5 rounded-lg text-sm font-bold border border-border/60 flex items-center gap-1.5 disabled:opacity-50">
            {cekiliyor ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Meta&apos;dan çek
          </button>
        </div>
      </div>

      {hata && <p className="text-sm text-red-400">{hata}</p>}

      {veri && !veri.hesap_bagli && (
        <div className="glass-panel rounded-xl p-4 text-sm space-y-1 border border-amber-500/30">
          <p className="font-bold text-amber-300">Reklam hesabı henüz bağlı değil</p>
          <p className="text-muted-foreground">Site tarafı sonuçları yine toplanıyor. Harcamanın gelmesi için Vercel&apos;e META_AD_ACCOUNT_ID ve ads_read izinli anahtar eklenmeli.</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          ["Harcama", para(top.harcama, pb)],
          ["Reklamdan ziyaretçi", sayi(top.ziyaretci)],
          ["Lead", sayi(top.lead)],
          ["Lead başı maliyet", bol(top.harcama, top.lead, pb)],
          ["Satış / ciro", `${sayi(top.satis)} / ${top.ciro.toLocaleString("tr-TR")} $`],
        ].map(([ad, deger]) => (
          <div key={ad} className="glass-panel rounded-xl p-4">
            <p className="text-xs text-muted-foreground">{ad}</p>
            <p className="text-lg font-black mt-1">{deger}</p>
          </div>
        ))}
      </div>

      <div className="glass-panel rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground border-b border-border/40">
            <tr className="text-right">
              <th className="text-left p-3">Reklam</th>
              <th className="p-3">Harcama</th>
              <th className="p-3" title="İlk 3 saniyeyi izleyen / gösterim">Hook</th>
              <th className="p-3" title="Bağlantı tıklaması / gösterim">CTR</th>
              <th className="p-3" title="En yüksek günlük sıklık">Sıklık</th>
              <th className="p-3">Ziyaretçi</th>
              <th className="p-3">Lead</th>
              <th className="p-3">Lead maliyeti</th>
              <th className="p-3">Ödeme formu</th>
              <th className="p-3">Satış</th>
              <th className="p-3">Ciro</th>
              <th className="p-3">Satış maliyeti</th>
            </tr>
          </thead>
          <tbody>
            {reklamlar.length === 0 && (
              <tr><td colSpan={12} className="p-6 text-center text-muted-foreground">Bu aralıkta reklam verisi yok.</td></tr>
            )}
            {reklamlar.map((r) => (
              <tr key={r.ad_id} className="border-b border-border/20 text-right">
                <td className="text-left p-3">
                  <p className="font-bold">{r.ad_ad || <span className="text-amber-300">Harcaması olmayan kaynak</span>}</p>
                  <p className="text-xs text-muted-foreground">{[r.kampanya_ad, r.adset_ad].filter(Boolean).join(" › ") || r.ad_id}</p>
                </td>
                <td className="p-3">{para(r.harcama, r.para_birimi)}</td>
                <td className="p-3">{oran(r.video_3sn, r.gosterim)}</td>
                <td className="p-3">{oran(r.link_tiklama, r.gosterim)}</td>
                <td className={`p-3 ${r.siklik_max > 3 ? "text-amber-300" : ""}`}>{r.siklik_max ? r.siklik_max.toFixed(1) : "—"}</td>
                <td className="p-3">{sayi(r.ziyaretci)}</td>
                <td className="p-3 font-bold">{sayi(r.lead)}</td>
                <td className="p-3">{bol(r.harcama, r.lead, r.para_birimi)}</td>
                <td className="p-3">{sayi(r.odeme_formu)}</td>
                <td className="p-3 font-bold">{sayi(r.satis)}</td>
                <td className="p-3">{r.ciro ? `${r.ciro.toLocaleString("tr-TR")} $` : "—"}</td>
                <td className="p-3">{bol(r.harcama, r.satis, r.para_birimi)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="glass-panel rounded-xl p-4 text-xs text-muted-foreground space-y-2">
        <p className="font-bold text-foreground text-sm">Reklam bağlantısına eklenecek parametre (Meta › Reklam › URL parametreleri)</p>
        <code className="block break-all bg-black/30 rounded p-2 text-foreground">{BAGLANTI}</code>
        <p>Çerez onayı vermeyen ziyaretçi kaynaksız sayılır; site sonuçları bu yüzden Meta&apos;nın tıklama sayısından düşük çıkar. Sıklık 3&apos;ün üstü sarı: kreatif yorulmuş olabilir.</p>
      </div>
    </div>
  );
}
