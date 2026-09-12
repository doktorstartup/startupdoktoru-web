import { pageMeta } from "../../lib/seo";

export const metadata = pageMeta({
  path: "/egitimler",
  title: "Startup Video Eğitimleri — 3 Eğitim, Tek Paket | Startup Doktoru",
  description:
    "Yatırımcı sunumu hazırlama, startup giriş rehberi ve şirket değerleme eğitimleri. Tek tek 70 dolar, üçü birden 99 dolarlık tek pakette.",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
