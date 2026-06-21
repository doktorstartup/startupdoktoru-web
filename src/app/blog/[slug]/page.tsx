import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { SiteHeader } from "../../../components/SiteHeader";
import { SiteFooter } from "../../../components/SiteFooter";
import { supabaseAdmin } from "../../../lib/supabase";

export const dynamic = "force-dynamic";

type Post = {
  title: string;
  slug: string;
  content: string;
  seo_title: string | null;
  seo_description: string | null;
  cover_image: string | null;
  created_at: string;
};

async function getPost(slug: string): Promise<Post | null> {
  const { data } = await supabaseAdmin
    .from("ds_blog_posts")
    .select("title, slug, content, seo_title, seo_description, cover_image, created_at")
    .eq("slug", slug)
    .single();
  return (data as Post) || null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Yazı bulunamadı — Startup Doktoru" };
  return {
    title: post.seo_title || `${post.title} — Startup Doktoru`,
    description: post.seo_description || undefined,
  };
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-6 sm:px-8 py-16 md:py-20">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
          <ChevronLeft className="h-4 w-4" /> Tüm yazılar
        </Link>

        <p className="text-xs text-muted-foreground font-mono mb-3">{fmtDate(post.created_at)}</p>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.1] mb-8">{post.title}</h1>

        {post.cover_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.cover_image} alt={post.title} className="w-full rounded-2xl border border-border/40 mb-10" />
        )}

        <div className="text-foreground/90 leading-relaxed text-base whitespace-pre-wrap [&>*]:mb-4">
          {post.content}
        </div>

        <div className="mt-16 pt-8 border-t border-border/40 text-center">
          <p className="text-muted-foreground mb-4">Girişimini bir üst seviyeye taşımaya hazır mısın?</p>
          <Link href="/ebook" className="btn btn-lg btn-primary">E-Kitabı İncele (6 $)</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
