"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { stripLocale } from "../lib/i18n";
import { ONAY_OLAYI, onayOku } from "../lib/consent";

// Creato web sohbet widget'ı (üçüncü taraf script).
// - Çerez onayı "evet" olmadan HİÇ yüklenmez; onay sonradan verilirse sayfa yenilenmeden yüklenir.
// - Üye alanında (/portal) yüklenmez. /admin ayrı layout'ta olduğu için zaten kapsam dışı.
// - NEXT_PUBLIC_CREATO_WIDGET_SRC yoksa sessizce hiçbir şey yapmaz.
// - Onay sonradan geri çekilirse eklenen script sayfa yenilenene kadar çalışır; kaldırma
//   üçüncü taraf kodunun kendi DOM'unu bilmeden güvenilir değil. Reddet sonrası yenileme yeterli.
const SRC = process.env.NEXT_PUBLIC_CREATO_WIDGET_SRC;
const SCRIPT_ID = "creato-sohbet";

export function CreatoSohbet() {
  const yol = stripLocale(usePathname() || "/");
  const kapsamDisi = yol === "/portal" || yol.startsWith("/portal/");

  useEffect(() => {
    if (!SRC || kapsamDisi) return;
    const yukle = () => {
      if (onayOku() !== "evet" || document.getElementById(SCRIPT_ID)) return;
      const s = document.createElement("script");
      s.id = SCRIPT_ID;
      s.src = SRC;
      s.async = true;
      document.body.appendChild(s);
    };
    yukle();
    window.addEventListener(ONAY_OLAYI, yukle);
    return () => window.removeEventListener(ONAY_OLAYI, yukle);
  }, [kapsamDisi]);

  return null;
}
