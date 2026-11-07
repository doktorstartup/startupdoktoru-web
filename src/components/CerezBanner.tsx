"use client";

import { useEffect, useState } from "react";
import { useHref, useT } from "../lib/i18n-client";
import { ONAY_OLAYI, onayOku, onayYaz } from "../lib/consent";

// Çerez/izleme onayı. "Kabul et" ve "Reddet" eşit ağırlıkta (KVKK çerez rehberi).
// Seçim yapılana kadar görünür; footer'daki "Çerez tercihleri" seçimi sıfırlar.
export function CerezBanner() {
  const t = useT().cookieBanner;
  const href = useHref();
  const [goster, setGoster] = useState(false);

  useEffect(() => {
    const bak = () => setGoster(onayOku() === null);
    bak();
    window.addEventListener(ONAY_OLAYI, bak);
    return () => window.removeEventListener(ONAY_OLAYI, bak);
  }, []);

  if (!goster) return null;

  const btn =
    "flex-1 h-9 px-4 rounded-xl border border-border bg-secondary/40 text-sm font-bold text-foreground hover:border-primary/40 transition-colors";

  return (
    // Sol altta, dar: sayfanın sağındaki formları/butonları kapatmasın.
    <div role="dialog" aria-live="polite" aria-label={t.title} className="fixed bottom-4 inset-x-4 sm:right-auto z-50 flex pointer-events-none">
      <div className="pointer-events-auto w-full sm:max-w-sm rounded-2xl border border-border/80 bg-[#0E1726]/95 backdrop-blur p-4 shadow-2xl flex flex-col gap-3">
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t.text}{" "}
          <a href={href("/gizlilik")} className="underline hover:text-primary">
            {t.more}
          </a>
        </p>
        <div className="flex gap-2">
          <button type="button" className={btn} onClick={() => onayYaz("hayir")}>
            {t.reject}
          </button>
          <button type="button" className={btn} onClick={() => onayYaz("evet")}>
            {t.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
