import { pageMeta } from "../../../../lib/seo";
import { getDict } from "../../../../lib/dict";
import { isLocale } from "../../../../lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const m = getDict(lang).pageMeta.ebook;
  return pageMeta({ lang, path: "/ebook", title: m.title, description: m.description });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
