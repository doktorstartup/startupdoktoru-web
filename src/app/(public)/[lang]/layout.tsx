import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Space_Grotesk } from "next/font/google";
import "../../globals.css";
import { Analytics } from "../../../components/Analytics";
import { DiscountPopup } from "../../../components/DiscountPopup";
import { LangProvider } from "../../../lib/i18n-client";
import { LOCALES, isLocale, localePath } from "../../../lib/i18n";
import { getDict } from "../../../lib/dict";
import { altLanguages } from "../../../lib/seo";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  // latin-ext şart: ğ Ğ ş Ş İ latin setinde YOK (U+0100-02BA aralığında).
  // Onlarsız Türkçe metinde bu harfler sistem fontuna düşer.
  subsets: ["latin", "latin-ext"],
});

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://startupdoktoru.com";

type Params = Promise<{ lang: string }>;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = getDict(lang);

  return {
    metadataBase: new URL(SITE),
    title: t.meta.title,
    description: t.meta.description,
    alternates: { canonical: localePath(lang, "/"), languages: altLanguages("/") },
    // Sosyal medyada paylaşılan linkin önizlemesi (LinkedIn, X, WhatsApp).
    openGraph: {
      type: "website",
      siteName: "Startup Doktoru",
      locale: t.meta.ogLocale,
      url: `${SITE}${localePath(lang, "/")}`,
      title: t.meta.title,
      description: t.meta.description,
      images: [{ url: "/eser-memisoglu.png", width: 2048, height: 2048, alt: "Startup Doktoru" }],
    },
    twitter: {
      card: "summary_large_image",
      title: t.meta.title,
      description: t.meta.description,
      images: ["/eser-memisoglu.png"],
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Params;
}>) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <html
      lang={lang}
      className={`${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-primary/30 selection:text-primary">
        <Analytics />
        <LangProvider lang={lang}>
          {children}
          <DiscountPopup />
        </LangProvider>
      </body>
    </html>
  );
}
