import type { MetadataRoute } from "next";
import { supabaseAdmin } from "../lib/supabase";

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
  const entries: MetadataRoute.Sitemap = STATIC.map((s) => ({
    url: `${SITE}${s.path}`,
    lastModified: now,
    changeFrequency: s.changeFrequency,
    priority: s.priority,
  }));

  const { data } = await supabaseAdmin
    .from("ds_blog_posts")
    .select("slug, created_at")
    .eq("durum", "yayinda")
    .order("created_at", { ascending: false })
    .limit(1000);

  for (const p of (data as { slug: string; created_at: string }[]) || []) {
    entries.push({
      url: `${SITE}/blog/${p.slug}`,
      lastModified: new Date(p.created_at),
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  return entries;
}
