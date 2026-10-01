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
};

export default nextConfig;
