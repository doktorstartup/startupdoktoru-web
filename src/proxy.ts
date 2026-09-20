import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_LOCALE, LOCALES } from "./lib/i18n";

// Next 16 adıyla "proxy" (eski adı middleware).
// Öneksiz adresler (/ebook) içeride /tr/ebook'a rewrite edilir: URL değişmez.
// /tr/... ile doğrudan gelen istek öneksiz hâline yönlendirilir ki aynı sayfa
// iki adresten indekslenmesin.
export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // new URL(pathname, req.url) sorgu dizesini DÜŞÜRÜR: yalnız yolu taşır.
  // Bu yüzden ?onizleme=... sayfaya hiç ulaşmıyordu ve taslak önizlemesi
  // 404 veriyordu. nextUrl.clone() sorguyu olduğu gibi korur.
  if (pathname === `/${DEFAULT_LOCALE}` || pathname.startsWith(`/${DEFAULT_LOCALE}/`)) {
    const hedef = req.nextUrl.clone();
    hedef.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(hedef);
  }

  const hasLocale = LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasLocale) return NextResponse.next();

  const hedef = req.nextUrl.clone();
  hedef.pathname = `/${DEFAULT_LOCALE}${pathname}`;
  return NextResponse.rewrite(hedef);
}

export const config = {
  // /api, /admin, Next içsel yolları ve uzantılı dosyalar (robots.txt, sitemap.xml,
  // görseller) dil önekinin dışında.
  matcher: ["/((?!api|admin|_next|.*\\..*).*)"],
};
