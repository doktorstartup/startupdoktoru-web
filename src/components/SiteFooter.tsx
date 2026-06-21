export function SiteFooter() {
  return (
    <footer className="border-t border-border/40 py-12 bg-black/20">
      <div className="container-page flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-background font-bold text-sm">
            SD
          </div>
          <span className="text-base font-bold tracking-tight text-foreground">
            STARTUP<span className="text-primary">DOKTORU</span>
          </span>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          © 2026 Startup Doktoru. Tüm Hakları Saklıdır. &quot;Kervan yolda değil, stratejiyle düzülür.&quot;
        </p>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <a href="/egitimler" className="hover:text-primary transition-colors">Eğitimler</a>
          <a href="/free-training" className="hover:text-primary transition-colors">Ücretsiz Eğitim</a>
          <a href="/blog" className="hover:text-primary transition-colors">Blog</a>
          <a href="#" className="hover:text-primary transition-colors">Gizlilik Politikası</a>
          <a href="#" className="hover:text-primary transition-colors">Mesafeli Satış Sözleşmesi</a>
          <a href="#" className="hover:text-primary transition-colors">Kullanım Şartları</a>
        </div>
      </div>
    </footer>
  );
}
