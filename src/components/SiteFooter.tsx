"use client";

import { useHref, useT } from "../lib/i18n-client";

export function SiteFooter() {
  const t = useT();
  const href = useHref();

  return (
    <footer className="border-t border-border/40 py-12 bg-black/20">
      <div className="container-page flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-sd-beyaz.png" alt="Startup Doktoru" className="h-9 w-auto" />
        </div>

        <p className="text-xs text-muted-foreground text-center">{t.footer.rights}</p>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <a href={href("/egitimler")} className="hover:text-primary transition-colors">{t.footer.trainings}</a>
          <a href={href("/free-training")} className="hover:text-primary transition-colors">{t.footer.freeTraining}</a>
          <a href={href("/blog")} className="hover:text-primary transition-colors">{t.footer.blog}</a>
          <a href="#" className="hover:text-primary transition-colors">{t.footer.privacy}</a>
          <a href="#" className="hover:text-primary transition-colors">{t.footer.distanceSales}</a>
          <a href="#" className="hover:text-primary transition-colors">{t.footer.terms}</a>
        </div>
      </div>
    </footer>
  );
}
