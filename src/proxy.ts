import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_LOCALE, LOCALES } from "./lib/i18n";

// Next 16 adıyla "proxy" (eski adı middleware).
// Öneksiz adresler (/ebook) içeride /tr/ebook'a rewrite edilir: URL değişmez.
// /tr/... ile doğrudan gelen istek öneksiz hâline yönlendirilir ki aynı sayfa
// iki adresten indekslenmesin.
export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === `/${DEFAULT_LOCALE}` || pathname.startsWith(`/${DEFAULT_LOCALE}/`)) {
    return NextResponse.redirect(new URL(pathname.slice(3) || "/", req.url));
  }

  const hasLocale = LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasLocale) return NextResponse.next();

  return NextResponse.rewrite(new URL(`/${DEFAULT_LOCALE}${pathname}`, req.url));
}

export const config = {
  // /api, /admin, Next içsel yolları ve uzantılı dosyalar (robots.txt, sitemap.xml,
  // görseller) dil önekinin dışında.
  matcher: ["/((?!api|admin|_next|.*\\..*).*)"],
};
