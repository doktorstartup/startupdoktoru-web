import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://startupdoktoru.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Yönetim, üye alanı ve teşekkür sayfası indekslenmez — iki dilde de.
        disallow: ["/admin", "/portal", "/thank-you", "/api/", "/en/portal", "/en/thank-you"],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
