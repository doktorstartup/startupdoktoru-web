import { HukukiMetin } from "../../../../components/HukukiMetin";
import { GIZLILIK } from "../../../../lib/hukuk/gizlilik";
import { pageMeta } from "../../../../lib/seo";
import { isLocale, DEFAULT_LOCALE } from "../../../../lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const m = GIZLILIK[lang];
  return pageMeta({ lang, path: "/gizlilik", title: `${m.baslik} | Startup Doktoru`, description: m.giris[0] });
}

export default async function Gizlilik({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <HukukiMetin metin={GIZLILIK[isLocale(lang) ? lang : DEFAULT_LOCALE]} />;
}
