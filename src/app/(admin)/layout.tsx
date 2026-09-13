import { Space_Grotesk } from "next/font/google";
import "../globals.css";

// Yönetim paneli dil desteğinin dışında: yalnızca site sahibi kullanıyor, Türkçe kalır.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin", "latin-ext"],
});

export const metadata = {
  title: "Yönetim — Startup Doktoru",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" className={`${spaceGrotesk.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-primary/30 selection:text-primary">
        {children}
      </body>
    </html>
  );
}
