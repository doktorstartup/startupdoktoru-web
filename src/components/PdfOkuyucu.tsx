"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";

// Site içi PDF okuyucu. Tarayıcının kendi PDF görüntüleyicisine (iframe)
// güvenmiyor: Android Chrome iframe'de PDF göstermiyor, iOS çoğu zaman yalnız
// ilk sayfayı gösteriyor. Sayfaları pdf.js ile canvas'a kendimiz çiziyoruz.
//
// - Yalnız ekrana yakın sayfalar çizilir, uzaklaşanların canvas'ı boşaltılır:
//   274 sayfalık kitapta telefon belleği şişmesin.
// - Kaldığı sayfa tarayıcıda saklanır; okur geri gelince oradan devam eder.
// - Belge tek seferde indirilir (disableRange): imzalı URL 1 saatte dolar,
//   uzun okumada parça parça istek süresi dolmuş URL'ye çarpardı.

type Props = {
  url: string;
  kimlik: string; // kaldığı sayfanın saklandığı anahtar (belge adı)
  sayfaMetni: string; // "Sayfa {n} / {toplam}"
  hataMetni: string;
  onSayfa?: (no: number) => void; // okurun ekranın ortasındaki sayfası değiştikçe
};

const CIZIM_PAYI = "1500px 0px"; // ekranın bu kadar yakınındaki sayfalar çizilir

export function PdfOkuyucu({ url, kimlik, sayfaMetni, hataMetni, onSayfa }: Props) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [oran, setOran] = useState(1.414); // yükseklik / genişlik
  const [hata, setHata] = useState(false);
  const [aktifSayfa, setAktifSayfa] = useState(1);
  const sayfaRefs = useRef<(HTMLDivElement | null)[]>([]);
  const anahtar = `okuyucu:${kimlik}`;

  useEffect(() => {
    onSayfa?.(aktifSayfa);
  }, [aktifSayfa, onSayfa]);

  // Belgeyi yükle (üst bileşen key={url} verir: belge değişince okuyucu sıfırdan kurulur)
  useEffect(() => {
    let iptal = false;
    let yuklenen: PDFDocumentProxy | null = null;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
        const belge = await pdfjs.getDocument({ url, disableRange: true, disableStream: true }).promise;
        yuklenen = belge;
        if (iptal) return void belge.destroy();
        const ilk = (await belge.getPage(1)).getViewport({ scale: 1 });
        setOran(ilk.height / ilk.width);
        setPdf(belge);
      } catch (e) {
        console.error("PDF yüklenemedi:", e);
        if (!iptal) setHata(true);
      }
    })();
    return () => {
      iptal = true;
      yuklenen?.destroy();
    };
  }, [url]);

  // Sayfaları ekrana yaklaştıkça çiz, uzaklaşınca boşalt
  useEffect(() => {
    if (!pdf) return;
    const gorevler = new Map<number, { cancel: () => void }>();
    const gozcu = new IntersectionObserver(
      (girdiler) => {
        for (const g of girdiler) {
          const kap = g.target as HTMLDivElement;
          const no = Number(kap.dataset.sayfa);
          const canvas = kap.querySelector("canvas")!;
          if (g.isIntersecting) {
            if (canvas.dataset.cizildi || gorevler.has(no)) continue;
            pdf.getPage(no).then((sayfa) => {
              const dpr = Math.min(window.devicePixelRatio || 1, 2);
              const olcek = (kap.clientWidth * dpr) / sayfa.getViewport({ scale: 1 }).width;
              const vp = sayfa.getViewport({ scale: olcek });
              canvas.width = Math.floor(vp.width);
              canvas.height = Math.floor(vp.height);
              const gorev = sayfa.render({ canvas, viewport: vp });
              gorevler.set(no, gorev);
              gorev.promise
                .then(() => { canvas.dataset.cizildi = "1"; })
                .catch(() => {})
                .finally(() => gorevler.delete(no));
            });
          } else {
            gorevler.get(no)?.cancel();
            gorevler.delete(no);
            delete canvas.dataset.cizildi;
            canvas.width = 0;
            canvas.height = 0;
          }
        }
      },
      { rootMargin: CIZIM_PAYI }
    );
    sayfaRefs.current.forEach((el) => el && gozcu.observe(el));
    return () => {
      gozcu.disconnect();
      gorevler.forEach((g) => g.cancel());
    };
  }, [pdf]);

  // Hangi sayfada olduğunu izle ve sakla; açılışta kaldığı yere götür
  useEffect(() => {
    if (!pdf) return;
    let kayitli = 1;
    try { kayitli = Number(localStorage.getItem(anahtar)) || 1; } catch {}
    if (kayitli > 1 && kayitli <= pdf.numPages) {
      sayfaRefs.current[kayitli - 1]?.scrollIntoView({ block: "start" });
    }
    const gozcu = new IntersectionObserver(
      (girdiler) => {
        for (const g of girdiler) {
          if (!g.isIntersecting) continue;
          const no = Number((g.target as HTMLDivElement).dataset.sayfa);
          setAktifSayfa(no);
          try { localStorage.setItem(anahtar, String(no)); } catch {}
        }
      },
      { rootMargin: "-45% 0px -45% 0px" } // ekranın ortasındaki sayfa
    );
    sayfaRefs.current.forEach((el) => el && gozcu.observe(el));
    return () => gozcu.disconnect();
  }, [pdf, anahtar]);

  if (hata) {
    return <p className="text-sm text-muted-foreground px-6 py-20 text-center">{hataMetni}</p>;
  }
  if (!pdf) {
    return <div className="flex justify-center py-32"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="relative">
      <div className="mx-auto max-w-3xl space-y-3 select-none" onContextMenu={(e) => e.preventDefault()}>
        {Array.from({ length: pdf.numPages }, (_, i) => (
          <div
            key={i}
            ref={(el) => { sayfaRefs.current[i] = el; }}
            data-sayfa={i + 1}
            className="bg-white shadow-lg rounded-sm overflow-hidden"
            style={{ aspectRatio: `1 / ${oran}` }}
          >
            <canvas className="block w-full h-full" />
          </div>
        ))}
      </div>
      <div className="sticky bottom-4 flex justify-center pointer-events-none mt-4">
        <span className="px-3 py-1.5 rounded-full bg-background/90 border border-border/60 text-xs font-mono shadow-lg">
          {sayfaMetni.replace("{n}", String(aktifSayfa)).replace("{toplam}", String(pdf.numPages))}
        </span>
      </div>
    </div>
  );
}
