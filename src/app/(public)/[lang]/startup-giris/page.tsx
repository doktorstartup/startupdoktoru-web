import { TrainingSalesPage } from "../../../../components/TrainingSalesPage";
import { pageMeta } from "../../../../lib/seo";
import { getDict } from "../../../../lib/dict";
import { isLocale } from "../../../../lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const m = getDict(lang).pageMeta.startupGiris;
  return pageMeta({ lang, path: "/startup-giris", title: m.title, description: m.description });
}

export default function StartupGirisPage() {
  return <TrainingSalesPage trainingId="startup_giris" />;
}
