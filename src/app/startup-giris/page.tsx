import { TrainingSalesPage } from "../../components/TrainingSalesPage";
import { pageMeta } from "../../lib/seo";

export const metadata = pageMeta({
  path: "/startup-giris",
  title: "Startup Nasıl Kurulur? Giriş Rehberi Eğitimi | Startup Doktoru",
  description:
    "Doğru inovasyon, over-engineering'den kurtulma, marka konumlandırma, MVP geliştirme, ekip kurma ve rakip analizi — startup kurulumunun tamamı tek eğitimde.",
});

export default function StartupGirisPage() {
  return <TrainingSalesPage trainingId="startup_giris" />;
}
