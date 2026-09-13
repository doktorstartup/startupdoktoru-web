"use client";

import { createContext, useContext } from "react";
import { DEFAULT_LOCALE, localePath, type Locale } from "./i18n";
import { getDict, type Dict } from "./dict";

// Yalnızca dil kodu context'ten geçer; sözlüğün kendisi istemci paketine
// gömülüdür. Böylece her sayfa isteğinde sunucudan metin taşınmaz.
const LangContext = createContext<Locale>(DEFAULT_LOCALE);

export function LangProvider({ lang, children }: { lang: Locale; children: React.ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useLang(): Locale {
  return useContext(LangContext);
}

export function useT(): Dict {
  return getDict(useContext(LangContext));
}

// Aktif dile göre bağlantı: useHref()("/ebook") → "/ebook" ya da "/en/ebook".
export function useHref(): (path: string) => string {
  const lang = useContext(LangContext);
  return (path: string) => localePath(lang, path);
}
