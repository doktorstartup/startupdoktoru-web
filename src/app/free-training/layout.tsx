import { pageMeta } from "../../lib/seo";

export const metadata = pageMeta({
  path: "/free-training",
  title: "Ücretsiz Startup Eğitimi — 12 Dakikalık Video | Startup Doktoru",
  description:
    "12 dakikada startup kurmanın temelleri: doğru inovasyon, MVP ve yatırımcının aradığı ilk sinyaller. Ücretsiz video eğitimi, kayıt olmanız yeterli.",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
