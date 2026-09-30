"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "../lib/track";

// Site sahibinin kendi ziyaretleri sayılmasın. İşaret admin paneline
// girildiğinde konuyor (localStorage, tarayıcıda kalıcı) ve /admin'i her
// açışta tazeleniyor. Kaldırmak için tarayıcı deposunu temizlemek yeterli.
export const SAHIP_ANAHTARI = "ds_sahip";

function sayilmasinMi(pathname: string): boolean {
  // Admin panelinin kendi sayfaları funnel verisi değil.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return true;

  // Taslak önizlemesi: ?onizleme=<şifre> ile açılır, okuyucu ziyareti değildir.
  try {
    if (new URLSearchParams(window.location.search).has("onizleme")) return true;
  } catch {
    /* URL okunamadıysa sayıma devam */
  }

  try {
    if (localStorage.getItem(SAHIP_ANAHTARI) === "1") return true;
  } catch {
    /* localStorage kapalıysa sayıma devam */
  }
  return false;
}

// Her route değişiminde page_view gönderir. Root layout'a mount edilir.
export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (sayilmasinMi(pathname)) return;
    track("page_view");
  }, [pathname]);

  return null;
}
