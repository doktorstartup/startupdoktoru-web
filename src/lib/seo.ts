import type { Metadata } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://startupdoktoru.com";

// Her sayfanın kendi title/description'ı ve kendi canonical'ı olmalı.
// Aksi halde tüm sayfalar kök layout'un metadata'sını miras alıp
// ana sayfaya canonical verir ve arama motorunda tek sayfaya katlanır.
export function pageMeta({
  path,
  title,
  description,
}: {
  path: string;
  title: string;
  description: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: "Startup Doktoru",
      locale: "tr_TR",
      url: `${SITE}${path}`,
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
