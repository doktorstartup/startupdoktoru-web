import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
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
    .select("id, title, slug, content, seo_title, seo_description, cover_image, created_at, durum, lang")
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
  const lang = body.lang === "en" ? "en" : "tr";
  const { error } = await supabaseAdmin.from("ds_blog_posts").insert([
    {
      title,
      slug,
      content,
      lang,
      seo_title: body.seo_title || null,
      seo_description: body.seo_description || null,
      cover_image: body.cover_image || null,
    },
  ]);
  if (error) {
    const msg = error.message.includes("duplicate") ? "Bu slug bu dilde zaten kullanılıyor." : error.message;
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
  if (body.lang !== undefined) {
    if (body.lang !== "tr" && body.lang !== "en") {
      return NextResponse.json({ error: "lang yalnız 'tr' veya 'en' olabilir." }, { status: 400 });
    }
    patch.lang = body.lang;
  }
  if (body.durum !== undefined) {
    if (body.durum !== "taslak" && body.durum !== "yayinda") {
      return NextResponse.json({ error: "durum yalnız 'taslak' veya 'yayinda' olabilir." }, { status: 400 });
    }
    patch.durum = body.durum;
  }

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

// Bir Türkçe yazının İngilizcesini üretir ve aynı slug'la 'en' satırı olarak yazar.
// Çeviri TASLAK doğar; yayına alma kararı yine panelden verilir.
export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const auth = verifyAdminPassword(body.password);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = body;
  if (!id) return NextResponse.json({ error: "id gerekli." }, { status: 400 });
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY tanımlı değil." }, { status: 500 });
  }

  const { data: kaynak } = await supabaseAdmin
    .from("ds_blog_posts")
    .select("title, slug, content, seo_title, seo_description, cover_image, lang")
    .eq("id", id)
    .maybeSingle();
  if (!kaynak) return NextResponse.json({ error: "Yazı bulunamadı." }, { status: 404 });
  if (kaynak.lang !== "tr") return NextResponse.json({ error: "Yalnız Türkçe yazılar çevrilir." }, { status: 400 });

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "Translate Turkish startup blog posts into natural, idiomatic English for a founder audience. " +
          "Keep the HTML structure and tags byte-identical; translate only the text between them. " +
          "Do not add or remove sections. Reply with JSON only: " +
          '{"title": string, "content": string, "seo_title": string, "seo_description": string}',
      },
      {
        role: "user",
        content: JSON.stringify({
          title: kaynak.title,
          content: kaynak.content,
          seo_title: kaynak.seo_title || "",
          seo_description: kaynak.seo_description || "",
        }),
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  let ceviri: { title?: string; content?: string; seo_title?: string; seo_description?: string };
  try {
    ceviri = JSON.parse(completion.choices[0]?.message?.content || "{}");
  } catch {
    return NextResponse.json({ error: "Çeviri çözümlenemedi." }, { status: 500 });
  }
  if (!ceviri.title || !ceviri.content) {
    return NextResponse.json({ error: "Çeviri boş döndü." }, { status: 500 });
  }

  const satir = {
    title: ceviri.title,
    slug: kaynak.slug,
    content: ceviri.content,
    seo_title: ceviri.seo_title || null,
    seo_description: ceviri.seo_description || null,
    cover_image: kaynak.cover_image,
    lang: "en",
  };

  // Aynı slug'ın İngilizcesi varsa üzerine yaz; durum'a dokunma.
  const { data: mevcut } = await supabaseAdmin
    .from("ds_blog_posts")
    .select("id")
    .eq("slug", kaynak.slug)
    .eq("lang", "en")
    .maybeSingle();

  const { error } = mevcut
    ? await supabaseAdmin.from("ds_blog_posts").update(satir).eq("id", mevcut.id)
    : await supabaseAdmin.from("ds_blog_posts").insert([{ ...satir, durum: "taslak" }]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, guncellendi: !!mevcut });
}
