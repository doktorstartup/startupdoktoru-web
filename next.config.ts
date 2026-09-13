import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
