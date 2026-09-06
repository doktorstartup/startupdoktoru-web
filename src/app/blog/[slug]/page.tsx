import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { SiteHeader } from "../../../components/SiteHeader";
import { SiteFooter } from "../../../components/SiteFooter";
import { supabaseAdmin } from "../../../lib/supabase";
import { verifyAdminPassword } from "../../../lib/adminAuth";

export const dynamic = "force-dynamic";

type Post = {
  title: string;
  slug: string;
  content: string;
  seo_title: string | null;
  seo_description: string | null;
  cover_image: string | null;
  created_at: string;
  durum: string;
};

type Arama = Promise<{ [k: string]: string | string[] | undefined }>;

// Taslak yazı herkese kapalı. Tek istisna: admin panelindeki önizleme bağlantısı
// ?onizleme=<yönetici şifresi> ile gelir — panel şifreyi zaten sorguda taşıyor.
async function onizlemeMi(searchParams?: Arama) {
  const sp = searchParams ? await searchParams : undefined;
  const t = sp?.onizleme;
  return verifyAdminPassword(Array.isArray(t) ? t[0] : t).ok;
}

async function getPost(slug: string): Promise<Post | null> {
  const { data } = await supabaseAdmin
    .from("ds_blog_posts")
    .select("title, slug, content, seo_title, seo_description, cover_image, created_at, durum")
    .eq("slug", slug)
    .single();
  return (data as Post) || null;
}

export async function generateMetadata({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Arama }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Yazı bulunamadı — Startup Doktoru" };
  if (post.durum !== "yayinda") {
    if (!(await onizlemeMi(searchParams))) return { title: "Yazı bulunamadı — Startup Doktoru" };
    // Önizleme: arama motorlarına kapalı.
    return { title: `[TASLAK] ${post.title}`, robots: { index: false, follow: false } };
  }

  const title = post.seo_title || `${post.title} — Startup Doktoru`;
  const description = post.seo_description || undefined;
  // Kapak varsa önizleme görseli o; yoksa kök layout'un varsayılanı devreye girer.
  const images = post.cover_image ? [{ url: post.cover_image, alt: post.title }] : undefined;

  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      url: `/blog/${post.slug}`,
      title,
      description,
      publishedTime: post.created_at,
      images,
    },
    twitter: { card: "summary_large_image", title, description, images: images?.map((i) => i.url) },
  };
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}

export default async function BlogPost({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Arama }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  const taslak = post.durum !== "yayinda";
  if (taslak && !(await onizlemeMi(searchParams))) notFound();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="max-w-3xl mx-auto px-6 sm:px-8 py-16 md:py-20">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
          <ChevronLeft className="h-4 w-4" /> Tüm yazılar
        </Link>

        {taslak && (
          <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            <strong>Taslak önizlemesi.</strong> Bu yazı yayında değil — site ziyaretçileri göremez, arama motorlarına kapalı.
            Yayına almak için admin panelindeki <em>Yayınla</em> düğmesini kullan.
          </div>
        )}

        <p className="text-xs text-muted-foreground font-mono mb-3">{fmtDate(post.created_at)}</p>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.1] mb-8">{post.title}</h1>

        {post.cover_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.cover_image} alt={post.title} className="w-full rounded-2xl border border-border/40 mb-10" />
        )}

        {/* İçerik "<" ile başlıyorsa HTML olarak render edilir (haber paketleri böyle yazılır);
            aksi halde eski yazıların düz metin davranışı aynen korunur.
            HTML'i her zaman bizim şablonumuz üretir — model çıktısı içine kaçırılmış metin olarak girer. */}
        {post.content.trimStart().startsWith("<") ? (
          <div className="ds-prose" dangerouslySetInnerHTML={{ __html: post.content }} />
        ) : (
          <div className="text-foreground/90 leading-relaxed text-base whitespace-pre-wrap [&>*]:mb-4">
            {post.content}
          </div>
        )}

        <div className="mt-16 pt-8 border-t border-border/40 text-center">
          <p className="text-muted-foreground mb-4">Girişimini bir üst seviyeye taşımaya hazır mısın?</p>
          <Link href="/ebook" className="btn btn-lg btn-primary">E-Kitabı İncele (6 $)</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
