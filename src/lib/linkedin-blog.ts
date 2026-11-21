import { supabaseAdmin } from "./supabase";
import { notifyAdmin } from "./email";
import { linkedinMakale } from "./paylasim-platform";
import { linkedinHesap, paylasimAktif } from "./paylasim-yayin";

// Günde bir blog yazısını LinkedIn kişisel profilinde paylaşır (pg_cron 12:00 TR → /api/cron/linkedin-blog).
// Metin mekaniktir: başlık + yazının kendi özet cümlesi; bağlantı kartta. Model yeni metin yazmaz.
// Yazı seçimi ve çift paylaşım koruması veritabanında: linkedin_blog_al (migration 0044).
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://startupdoktoru.com";

// Yazının künyesindeki "Yatırımcılar:" satırı, ilk 3 ad. Adlar metinde geçince ds_linkedin_etiket'tekiler etiketlenir.
export function yatirimciSatiri(icerik: string | null) {
  const m = (icerik || "").match(/Yatırımcılar:<\/strong>\s*([^<]+)/);
  if (!m) return "";
  const adlar = m[1].split(",").map((s) => s.trim()).filter(Boolean);
  return `Yatırımcılar: ${adlar.slice(0, 3).join(", ")}${adlar.length > 3 ? " ve diğerleri" : ""}`;
}

export async function blogPaylas() {
  if (!(await paylasimAktif())) return { pasif: true as const };
  const hesap = await linkedinHesap();
  const { data, error } = await supabaseAdmin.rpc("linkedin_blog_al");
  if (error) throw new Error(error.message);
  const yazi = data?.[0];
  if (!yazi) return { yazi: null };

  const url = `${SITE}/blog/${yazi.slug}`;
  const aciklama = yazi.seo_description || "";
  try {
    const link = await linkedinMakale(hesap, {
      metin: [yazi.title, aciklama, yatirimciSatiri(yazi.content), "#startup #girişimcilik #yatırım"].filter(Boolean).join("\n\n"),
      url,
      baslik: yazi.title,
      aciklama,
      kapakUrl: yazi.cover_image ? new URL(yazi.cover_image, SITE).toString() : null,
    });
    await supabaseAdmin.from("ds_blog_posts").update({ linkedin_link: link }).eq("id", yazi.id);
    return { yazi: yazi.slug, link };
  } catch (e) {
    // Açık ret: gönderi çıkmadı, yazı serbest kalır. Belirsiz hata: tekrar gönderilmez, profil elle kontrol edilir.
    const ret = (e as { ret?: boolean }).ret === true;
    if (ret) await supabaseAdmin.from("ds_blog_posts").update({ linkedin_at: null }).eq("id", yazi.id);
    const mesaj = (e as Error).message;
    await notifyAdmin(`LinkedIn blog paylaşımı ${ret ? "reddedildi" : "yarıda kaldı"}: ${yazi.title}`, `<p>${mesaj}</p>${ret ? "" : "<p>Gönderi çıkmış olabilir: profili kontrol et.</p>"}`);
    return { yazi: yazi.slug, hata: mesaj };
  }
}
