import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { SiteHeader } from "../../components/SiteHeader";
import { SiteFooter } from "../../components/SiteFooter";
import { supabaseAdmin } from "../../lib/supabase";

export const metadata = {
  title: "Blog — Startup Doktoru",
  description: "Girişimcilik, yatırım, değerleme ve büyüme üzerine uygulanabilir yazılar.",
};

// Her istekte tazele (yeni yazılar anında görünsün)
export const dynamic = "force-dynamic";

type Post = { id: string; title: string; slug: string; seo_description: string | null; cover_image: string | null; created_at: string };

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}

export default async function BlogList() {
  const { data } = await supabaseAdmin
    .from("ds_blog_posts")
    .select("id, title, slug, seo_description, cover_image, created_at")
    .order("created_at", { ascending: false });

  const posts = (data as Post[]) || [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="max-w-5xl mx-auto px-6 sm:px-8 py-16 md:py-24">
        <div className="text-center mb-14">
          <span className="text-primary text-xs font-bold font-mono tracking-widest uppercase">Blog</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mt-2">Girişimcilik Yazıları</h1>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Yatırım, değerleme, inovasyon ve büyüme üzerine sahadan, uygulanabilir içerikler.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-4 opacity-40" />
            Henüz yazı yayınlanmadı. Çok yakında.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((p) => (
              <Link
                key={p.id}
                href={`/blog/${p.slug}`}
                className="glass-panel rounded-2xl border border-border/40 overflow-hidden hover:border-primary/30 transition-all flex flex-col group"
              >
                {p.cover_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.cover_image} alt={p.title} className="w-full h-44 object-cover" />
                ) : (
                  <div className="w-full h-44 bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center">
                    <BookOpen className="h-10 w-10 text-primary/40" />
                  </div>
                )}
                <div className="p-6 flex flex-col flex-1">
                  <p className="text-[11px] text-muted-foreground font-mono mb-2">{fmtDate(p.created_at)}</p>
                  <h2 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">{p.title}</h2>
                  {p.seo_description && <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">{p.seo_description}</p>}
                  <span className="text-primary text-sm font-bold inline-flex items-center gap-1 mt-4">
                    Oku <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
