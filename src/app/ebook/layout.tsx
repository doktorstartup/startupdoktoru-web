import { pageMeta } from "../../lib/seo";

export const metadata = pageMeta({
  path: "/ebook",
  title: "Startup E-Kitabı: MVP'den Değerlemeye 13 Bölüm | Startup Doktoru",
  description:
    "İnovasyon, MVP, ürün-pazar uyumu, ekip kurma, nakit akışı, şirket değerleme ve yatırımcı pazarlığı — 13 bölümlük startup e-kitabı, 6 dolar.",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
