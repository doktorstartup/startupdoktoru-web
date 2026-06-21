import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Analytics } from "../components/Analytics";
import { DiscountPopup } from "../components/DiscountPopup";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Startup Doktoru — Yatırımcı Sunumu Nasıl Yapılır & Ücretsiz Startup Eğitimi",
  description:
    "Yatırım almış gerçek bir sunum üzerinden yatırımcı sunumu nasıl yapılır öğrenin. 12 dakikalık ücretsiz startup eğitimi ile başlayın. 10 yıllık startup ve yatırım tecrübesi.",
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

