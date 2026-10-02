"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Star, Check, X, MessageSquare } from "lucide-react";

// Kitap yorumları — okuyucu portalında 1. bölümü bitirenlerden gelir.
// Sitede yalnız ONAYLI ve okurun YAYIN İZNİ verdiği yorumlar görünür.

const PW_KEY = "ds_admin_pw";

type Yorum = {
  id: string;
  email: string;
  ad: string | null;
  meslek: string | null;
  puan: number;
  yorum: string;
  yayin_izni: boolean;
  durum: "bekliyor" | "onayli" | "reddedildi";
  updated_at: string;
};

const DURUM_ETIKET = { bekliyor: "Onay bekliyor", onayli: "Sitede", reddedildi: "Reddedildi" };

export default function KitapYorumlariAdmin() {
  const [yorumlar, setYorumlar] = useState<Yorum[] | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [isleniyor, setIsleniyor] = useState<string | null>(null);

  const pw = () => {
    try {
      return sessionStorage.getItem(PW_KEY) || "";
    } catch {
      return "";
    }
  };

  const yukle = useCallback(async () => {
    const r = await fetch(`/api/admin/kitap-yorumlari?password=${encodeURIComponent(pw())}`);
    const d = await r.json();
    if (!r.ok) return setHata(d.error || "Yüklenemedi.");
    setYorumlar(d.yorumlar);
  }, []);

  useEffect(() => {
    (async () => {
      await yukle();
    })();
  }, [yukle]);

  const durumDegistir = async (id: string, durum: Yorum["durum"]) => {
    setIsleniyor(id);
    const r = await fetch("/api/admin/kitap-yorumlari", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw(), id, durum }),
    });
    if (!r.ok) setHata((await r.json().catch(() => ({}))).error || "Kaydedilemedi.");
    await yukle();
    setIsleniyor(null);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" /> Kitap Yorumları
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Okuyucu 1. bölümü bitirince sorulur. Sitede yalnız onayladığın ve okurun yayın izni verdiği yorumlar görünür.
        </p>
      </div>

      {hata && <p className="text-sm text-red-400">{hata}</p>}
      {!yorumlar && !hata && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
      {yorumlar?.length === 0 && <p className="text-sm text-muted-foreground">Henüz yorum yok.</p>}

      <div className="space-y-3">
        {yorumlar?.map((y) => (
          <div key={y.id} className="glass-panel rounded-2xl border border-border/40 p-5 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold">
                  {y.ad || "(isimsiz)"} {y.meslek && <span className="font-normal text-muted-foreground">· {y.meslek}</span>}
                </p>
                <p className="text-xs text-muted-foreground">{y.email} · {new Date(y.updated_at).toLocaleDateString("tr-TR")}</p>
              </div>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={`h-4 w-4 ${n <= y.puan ? "fill-primary text-primary" : "text-muted-foreground/40"}`} />
                ))}
              </div>
            </div>
            <p className="text-sm whitespace-pre-wrap">{y.yorum}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2 py-1 rounded-md bg-secondary/40">{DURUM_ETIKET[y.durum]}</span>
              <span className={`px-2 py-1 rounded-md ${y.yayin_izni ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
                {y.yayin_izni ? "Yayın izni var" : "Yayın izni YOK — sitede gösterilmez"}
              </span>
              <div className="ml-auto flex gap-2">
                {y.durum !== "onayli" && (
                  <button onClick={() => durumDegistir(y.id, "onayli")} disabled={isleniyor === y.id} className="btn btn-primary btn-sm">
                    <Check className="h-4 w-4" /> Onayla
                  </button>
                )}
                {y.durum !== "reddedildi" && (
                  <button onClick={() => durumDegistir(y.id, "reddedildi")} disabled={isleniyor === y.id} className="btn btn-secondary btn-sm">
                    <X className="h-4 w-4" /> {y.durum === "onayli" ? "Siteden kaldır" : "Reddet"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
