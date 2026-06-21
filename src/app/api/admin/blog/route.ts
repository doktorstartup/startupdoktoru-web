import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { verifyAdminPassword } from "../../../../lib/adminAuth";

// Admin blog yönetimi: liste (+ görüntülenme) / oluştur / güncelle / sil. Şifre korumalı.

const TR_MAP: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", İ: "i" };
function slugify(s: string) {
  return (s || "")
    .trim()
    .replace(/[çğıöşüİ]/g, (m) => TR_MAP[m] || m)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET(req: NextRequest) {
  const auth = verifyAdminPassword(req.nextUrl.searchParams.get("password"));
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data: posts, error } = await supabaseAdmin
    .from("ds_blog_posts")
    .select("id, title, slug, content, seo_title, seo_description, cover_image, created_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Görüntülenme: ds_events page_view, path /blog/<slug>.
  const { data: views } = await supabaseAdmin
    .from("ds_events")
    .select("path")
    .eq("event_type", "page_view")
    .like("path", "/blog/%");
  const viewMap = new Map<string, number>();
  for (const v of views || []) {
    const slug = (v.path || "").replace(/^\/blog\//, "").replace(/\/$/, "");
    if (slug) viewMap.set(slug, (viewMap.get(slug) || 0) + 1);
  }

  const withViews = (posts || []).map((p) => ({ ...p, views: viewMap.get(p.slug) || 0 }));
  return NextResponse.json({ posts: withViews });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const auth = verifyAdminPassword(body.password);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { title, content } = body;
  if (!title || !content) return NextResponse.json({ error: "Başlık ve içerik zorunlu." }, { status: 400 });

  const slug = body.slug ? slugify(body.slug) : slugify(title);
  const { error } = await supabaseAdmin.from("ds_blog_posts").insert([
    {
      title,
      slug,
      content,
      seo_title: body.seo_title || null,
      seo_description: body.seo_description || null,
      cover_image: body.cover_image || null,
    },
  ]);
  if (error) {
    const msg = error.message.includes("duplicate") ? "Bu slug zaten kullanılıyor." : error.message;
    return NextResponse.json({ error: msg }, { status: 500 });
  }
  return NextResponse.json({ ok: true, slug });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const auth = verifyAdminPassword(body.password);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = body;
  if (!id) return NextResponse.json({ error: "id gerekli." }, { status: 400 });

  const patch: Record<string, unknown> = {};
  for (const k of ["title", "content", "seo_title", "seo_description", "cover_image"]) {
    if (body[k] !== undefined) patch[k] = body[k] || null;
  }
  if (body.slug !== undefined) patch.slug = slugify(body.slug);

  const { error } = await supabaseAdmin.from("ds_blog_posts").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const auth = verifyAdminPassword(req.nextUrl.searchParams.get("password"));
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id gerekli." }, { status: 400 });
  const { error } = await supabaseAdmin.from("ds_blog_posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
