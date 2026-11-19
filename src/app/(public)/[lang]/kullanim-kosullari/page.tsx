import { HukukiMetin } from "../../../../components/HukukiMetin";
import { KOSULLAR } from "../../../../lib/hukuk/kosullar";
import { pageMeta } from "../../../../lib/seo";
import { isLocale, DEFAULT_LOCALE } from "../../../../lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const m = KOSULLAR[lang];
  return pageMeta({ lang, path: "/kullanim-kosullari", title: `${m.baslik} | Startup Doktoru`, description: m.giris[0] });
}

export default async function KullanimKosullari({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <HukukiMetin metin={KOSULLAR[isLocale(lang) ? lang : DEFAULT_LOCALE]} />;
}
