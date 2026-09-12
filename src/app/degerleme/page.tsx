import { TrainingSalesPage } from "../../components/TrainingSalesPage";
import { pageMeta } from "../../lib/seo";

export const metadata = pageMeta({
  path: "/degerleme",
  title: "Startup Değerleme Nasıl Yapılır? Berkus & DCF | Startup Doktoru",
  description:
    "Berkus, puan kartı, risk faktörleri ve DCF yöntemleriyle şirket değerleme; yatırımcıyla pazarlıkta masaya güçlü oturmanın yolları. Video eğitim.",
});

export default function DegerlemePage() {
  return <TrainingSalesPage trainingId="degerleme" />;
}
