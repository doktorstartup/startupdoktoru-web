import { HukukiMetin } from "../../../../components/HukukiMetin";
import { KVKK } from "../../../../lib/hukuk/kvkk";
import { pageMeta } from "../../../../lib/seo";
import { isLocale, DEFAULT_LOCALE } from "../../../../lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const m = KVKK[lang];
  return pageMeta({ lang, path: "/kvkk", title: `${m.baslik} | Startup Doktoru`, description: m.giris[0] });
}

export default async function Kvkk({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <HukukiMetin metin={KVKK[isLocale(lang) ? lang : DEFAULT_LOCALE]} />;
}
