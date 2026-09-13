import { redirect } from "next/navigation";
import { isLocale, localePath, DEFAULT_LOCALE } from "../../../../lib/i18n";

export default async function PortalIndex({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  redirect(localePath(isLocale(lang) ? lang : DEFAULT_LOCALE, "/portal/course"));
}
