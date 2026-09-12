import { pageMeta } from "../../lib/seo";

export const metadata = pageMeta({
  path: "/investor-training",
  title: "Yatırımcı Sunumu Nasıl Yapılır? Video Eğitim | Startup Doktoru",
  description:
    "Yatırım almış gerçek bir pitch deck üzerinden slayt slayt yatırımcı sunumu hazırlama eğitimi. 5 modül, 134 dakika. Yatırımcıların anında 'hayır' dediği 12 kritik hata.",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
