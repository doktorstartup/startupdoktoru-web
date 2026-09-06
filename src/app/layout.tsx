import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Analytics } from "../components/Analytics";
import { DiscountPopup } from "../components/DiscountPopup";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  // latin-ext şart: ğ Ğ ş Ş İ latin setinde YOK (U+0100-02BA aralığında).
  // Onlarsız Türkçe metinde bu harfler sistem fontuna düşer.
  subsets: ["latin", "latin-ext"],
});

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://startupdoktoru.com";
const TITLE = "Startup Doktoru — Yatırımcı Sunumu Nasıl Yapılır & Ücretsiz Startup Eğitimi";
const DESC =
  "Yatırım almış gerçek bir sunum üzerinden yatırımcı sunumu nasıl yapılır öğrenin. 12 dakikalık ücretsiz startup eğitimi ile başlayın. 10 yıllık startup ve yatırım tecrübesi.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: TITLE,
  description: DESC,
  alternates: { canonical: "/" },
  // Sosyal medyada paylaşılan linkin önizlemesi (LinkedIn, X, WhatsApp).
  openGraph: {
    type: "website",
    siteName: "Startup Doktoru",
    locale: "tr_TR",
    url: SITE,
    title: TITLE,
    description: DESC,
    images: [{ url: "/eser-memisoglu.png", width: 2048, height: 2048, alt: "Startup Doktoru" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESC,
    images: ["/eser-memisoglu.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-primary/30 selection:text-primary">
        <Analytics />
        {children}
        <DiscountPopup />
      </body>
    </html>
  );
}

