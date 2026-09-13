import type { MetadataRoute } from "next";
import { supabaseAdmin } from "../lib/supabase";
import { LOCALES, localePath } from "../lib/i18n";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://startupdoktoru.com";

// Statik ticari sayfalar. /admin, /portal ve /thank-you bilerek dışarıda.
const STATIC: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "", priority: 1.0, changeFrequency: "weekly" },
  { path: "/ebook", priority: 0.9, changeFrequency: "monthly" },
  { path: "/egitimler", priority: 0.9, changeFrequency: "monthly" },
  { path: "/free-training", priority: 0.8, changeFrequency: "monthly" },
  { path: "/investor-training", priority: 0.7, changeFrequency: "monthly" },
  { path: "/startup-giris", priority: 0.7, changeFrequency: "monthly" },
  { path: "/degerleme", priority: 0.7, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.8, changeFrequency: "daily" },
];

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  // Site iki dilli: her sayfa hem Türkçe (öneksiz) hem İngilizce (/en) adresiyle listelenir.
  const entries: MetadataRoute.Sitemap = [];
  for (const s of STATIC) {
    for (const lang of LOCALES) {
      entries.push({
        url: `${SITE}${localePath(lang, s.path || "/")}`,
        lastModified: now,
        changeFrequency: s.changeFrequency,
        priority: s.priority,
      });
    }
  }

  // Blog yazıları dil başına ayrı satır; İngilizcesi yazılmamış yazı /en'de çıkmaz.
  const { data } = await supabaseAdmin
    .from("ds_blog_posts")
    .select("slug, lang, created_at")
    .eq("durum", "yayinda")
    .order("created_at", { ascending: false })
    .limit(1000);

  for (const p of (data as { slug: string; lang: "tr" | "en"; created_at: string }[]) || []) {
    entries.push({
      url: `${SITE}${localePath(p.lang, `/blog/${p.slug}`)}`,
      lastModified: new Date(p.created_at),
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  return entries;
}
