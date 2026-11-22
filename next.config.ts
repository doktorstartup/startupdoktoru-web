import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Kişiye özel kitap indirme, Türkçe karakter basabilmek için fontu diskten okur;
  // Vercel paketine dahil edilsin.
  outputFileTracingIncludes: {
    "/api/ebook/indir": ["./src/assets/fonts/**"],
  },
  async redirects() {
    return [
      // Google ve ChatGPT bu eski adresi indekslemiş; arama sonucundan gelen
      // ziyaretçi 404 görüyordu. Kalıcı (301) yönlendirme sıralamayı da taşır.
      { source: "/startup-ucretsiz-egitim", destination: "/free-training", permanent: true },
      { source: "/en/startup-ucretsiz-egitim", destination: "/en/free-training", permanent: true },
    ];
  },
  async rewrites() {
    return [
      // TikTok fotoğraf gönderisi görseli yalnız doğrulanmış alan adından çeker (PULL_FROM_URL):
      // söz hikâyesi görseli depodan bu adres üzerinden verilir (lib/instagram-hikaye.ts sozTiktok).
      { source: "/tiktok-medya/hikaye/:dosya", destination: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/paylasim-video/hikaye/:dosya` },
    ];
  },
};

export default nextConfig;
