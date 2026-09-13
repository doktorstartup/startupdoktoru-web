import type { Metadata } from "next";
import { DEFAULT_LOCALE, LOCALES, localePath, type Locale } from "./i18n";
import { getDict } from "./dict";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://startupdoktoru.com";

// Aynı sayfanın diğer dildeki karşılığı. Bu olmadan Google iki dili ayrı ayrı
// değerlendirir ve yanlış dili yanlış kitleye gösterir.
export function altLanguages(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[l] = localePath(l, path);
  languages["x-default"] = localePath(DEFAULT_LOCALE, path);
  return languages;
}

// Her sayfanın kendi title/description'ı ve kendi canonical'ı olmalı.
// Aksi halde tüm sayfalar kök layout'un metadata'sını miras alıp
// ana sayfaya canonical verir ve arama motorunda tek sayfaya katlanır.
export function pageMeta({
  lang,
  path,
  title,
  description,
}: {
  lang: Locale;
  path: string;
  title: string;
  description: string;
}): Metadata {
  const url = `${SITE}${localePath(lang, path)}`;
  return {
    title,
    description,
    alternates: { canonical: localePath(lang, path), languages: altLanguages(path) },
    openGraph: {
      type: "website",
      siteName: "Startup Doktoru",
      locale: getDict(lang).meta.ogLocale,
      url,
      title,
      description,
      images: [{ url: "/eser-memisoglu.png", width: 2048, height: 2048, alt: "Startup Doktoru" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/eser-memisoglu.png"],
    },
  };
}
