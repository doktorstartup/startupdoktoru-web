"use client";

import { useEffect, useState } from "react";
import { Loader2, Star, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useT } from "../lib/i18n-client";

// Okuyucuda, 1. bölümü bitiren okura yorum soran kart. Ekranı kapatmaz; altta durur.
//   - İlk soru: ILK_SORU sayfasını geçince (kitapta 1. bölüm PDF'in ~32. sayfasında biter;
//     öncesi kapak, içindekiler ve sözlük — o noktada okur henüz içerik okumamıştır).
//   - "Şimdi değil" → TEKRAR_ARALIGI sayfa sonra bir kez daha; ikinci kez de geçerse bir daha sorulmaz.
//   - Yorumu zaten varsa (sunucu söyler) hiç gösterilmez.
const ILK_SORU = 32;
const TEKRAR_ARALIGI = 60;
const DURUM_ANAHTARI = "kitap-yorum";

type Durum = { erteleme: number; sonSayfa: number } | "gonderildi";

function durumOku(): Durum {
  try {
    const v = localStorage.getItem(DURUM_ANAHTARI);
    if (v === "gonderildi") return v;
    if (v) return JSON.parse(v);
  } catch {}
  return { erteleme: 0, sonSayfa: 0 };
}

function durumYaz(d: Durum) {
  try {
    localStorage.setItem(DURUM_ANAHTARI, typeof d === "string" ? d : JSON.stringify(d));
  } catch {}
}

async function yetki() {
  const { data } = await supabase.auth.getSession();
  return { Authorization: `Bearer ${data.session?.access_token || ""}` };
}

export function KitapYorumKarti({ sayfa }: { sayfa: number }) {
  const t = useT().portal.yorum;
  const [durum, setDurum] = useState<Durum | null>(null);
  const [kapali, setKapali] = useState(false);
  const [puan, setPuan] = useState(0);
  const [meslek, setMeslek] = useState("");
  const [metin, setMetin] = useState("");
  const [izin, setIzin] = useState(false); // KVKK: açık izin, varsayılan kapalı
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [bitti, setBitti] = useState(false);

  // Yerel durum + sunucuda yorumu var mı
  useEffect(() => {
    let iptal = false;
    (async () => {
      const yerel = durumOku();
      if (yerel === "gonderildi") return setDurum(yerel);
      const r = await fetch("/api/ebook/yorum", { headers: await yetki() }).catch(() => null);
      const d = r?.ok ? await r.json() : null;
      if (iptal) return;
      if (d?.var) {
        durumYaz("gonderildi");
        setDurum("gonderildi");
      } else setDurum(yerel);
    })();
    return () => {
      iptal = true;
    };
  }, []);

  if (!durum || durum === "gonderildi" || kapali) return null;
  const esik = durum.erteleme === 0 ? ILK_SORU : durum.sonSayfa + TEKRAR_ARALIGI;
  if (!bitti && (durum.erteleme >= 2 || sayfa < esik)) return null;

  const ertele = () => {
    durumYaz({ erteleme: durum.erteleme + 1, sonSayfa: sayfa });
    setKapali(true);
  };

  const gonder = async () => {
    setGonderiliyor(true);
    setHata(null);
    try {
      const r = await fetch("/api/ebook/yorum", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await yetki()) },
        body: JSON.stringify({ puan, meslek, yorum: metin, yayinIzni: izin }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Hata");
      durumYaz("gonderildi");
      setBitti(true);
    } catch (e) {
      setHata(e instanceof Error ? e.message : "Hata");
    } finally {
      setGonderiliyor(false);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 p-3 sm:p-4 flex justify-center pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-primary/40 bg-background/95 backdrop-blur shadow-2xl p-4 sm:p-5 max-h-[85vh] overflow-y-auto">
        {bitti ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">{t.tesekkur}</p>
            <button onClick={() => setKapali(true)} className="btn btn-secondary">{t.kapat}</button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-extrabold">{t.baslik}</p>
                <p className="text-xs text-muted-foreground mt-1">{t.lead}</p>
              </div>
              <button onClick={ertele} aria-label={t.sonra} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-1" role="radiogroup" aria-label={t.puan}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={puan === n} aria-label={String(n)} onClick={() => setPuan(n)}>
                  <Star className={`h-7 w-7 ${n <= puan ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>

            <label className="block text-xs font-semibold">
              {t.meslek}
              <input value={meslek} onChange={(e) => setMeslek(e.target.value)} placeholder={t.meslekOrnek} maxLength={120}
                className="mt-1 w-full h-10 rounded-lg bg-secondary/30 border border-border/60 px-3 text-sm font-normal" />
            </label>
            <label className="block text-xs font-semibold">
              {t.metin}
              <textarea value={metin} onChange={(e) => setMetin(e.target.value)} placeholder={t.metinOrnek} rows={3} maxLength={2000}
                className="mt-1 w-full rounded-lg bg-secondary/30 border border-border/60 px-3 py-2 text-sm font-normal" />
            </label>
            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={izin} onChange={(e) => setIzin(e.target.checked)} className="mt-0.5" />
              {t.izin}
            </label>

            {hata && <p className="text-xs text-red-400">{hata}</p>}
            <div className="flex gap-2 justify-end">
              <button onClick={ertele} className="btn btn-secondary">{t.sonra}</button>
              <button onClick={gonder} disabled={gonderiliyor || puan === 0 || metin.trim().length < 10} className="btn btn-primary disabled:opacity-50">
                {gonderiliyor && <Loader2 className="h-4 w-4 animate-spin" />}
                {t.gonder}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
