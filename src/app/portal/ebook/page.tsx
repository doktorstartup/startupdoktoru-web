"use client";

import React, { useState } from "react";
import { 
  Download, 
  BookOpen, 
  ArrowRight, 
  FileText, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
  HelpCircle
} from "lucide-react";

const CHAPTERS = [
  {
    num: "01",
    title: "Startup Zihniyeti ve Hata Filtreleri",
    description: "Neden geleneksel iş modelleri startup dünyasında başarısız olur? Yatırımcı zihniyetini kavramak ve 'kervan yolda düzülmez' mottosunun temelleri.",
    pages: "5-18"
  },
  {
    num: "02",
    title: "Problem Doğrulama ve Müşteri Keşfi",
    description: "Varsayımsal problemler yerine gerçek acı noktalarını bulmak. Müşteri görüşmeleri yapma rehberi ve soru sorma sanatı.",
    pages: "19-35"
  },
  {
    num: "03",
    title: "Hızlı MVP (Minimum Değerli Ürün) Geliştirme",
    description: "Kod yazmadan veya büyük bütçeler harcamadan fikrinizi 1 haftada nasıl doğrularsınız? No-code araçları ve prototipleme taktikleri.",
    pages: "36-52"
  },
  {
    num: "04",
    title: "İlk Müşterileri Kazanmak (Cold Outreach)",
    description: "İlk 10 ve ilk 100 müşteriyi bulma stratejisi. E-posta, LinkedIn ve sıcak temas kanalları ile sıfır bütçeli satış modelleri.",
    pages: "53-70"
  },
  {
    num: "05",
    title: "Ürün-Pazar Uyumu (Product-Market Fit)",
    description: "Müşterilerin ürününüzü bırakamadığı aşamaya nasıl gelirsiniz? PMF metrikleri, anket tasarımları ve büyüme öncesi kritik optimizasyon.",
    pages: "71-88"
  },
  {
    num: "06",
    title: "Growth Funnel (Büyüme Hunisi) Kurulumu",
    description: "Ziyaretçiyi lead'e, lead'i müşteriye dönüştüren otomatik hunilerin mimarisi. Değer merdiveni kurma ve dönüşüm oranı optimizasyonu.",
    pages: "89-110"
  },
  {
    num: "07",
    title: "Delegasyon ve Yapay Zeka (AI) Dönüşümü",
    description: "Kurucunun operasyondan kurtulması. ChatGPT, Claude ve otomasyon araçlarıyla günlük işlerin %70'ini otopilota alma formülleri.",
    pages: "111-135"
  }
];

export default function EBookPage() {
  const [selectedChapter, setSelectedChapter] = useState(CHAPTERS[0]);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      setDownloadSuccess(true);
      
      // Simulate file download
      const link = document.createElement("a");
      link.href = "#";
      link.setAttribute("download", "13-Adimda-Milyon-Dolar-Startup.pdf");
      document.body.appendChild(link);
      
      setTimeout(() => setDownloadSuccess(false), 4000);
    }, 1500);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <span className="text-primary text-xs font-bold font-mono tracking-widest uppercase">Kütüphane</span>
        <h1 className="text-3xl font-extrabold tracking-tight mt-1 text-foreground">
          E-Kitap İndirme & Okuma Alanı
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          "13 Adımda Milyon Dolarlık Startup" kitabınızın tam sürüm PDF dosyasını indirebilir veya bölümleri özet olarak inceleyebilirsiniz.
        </p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Book Details & Mock Preview */}
        <div className="lg:col-span-5 space-y-6">
          {/* Stunning 3D Book Mockup Card */}
          <div className="glass-panel p-8 rounded-2xl border border-border/40 flex flex-col items-center text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-primary/5 blur-2xl" />
            
            {/* Book Cover Design */}
            <div className="relative h-72 w-52 rounded-xl bg-gradient-to-br from-[#0F213A] to-[#050B14] border border-primary/30 shadow-2xl p-6 flex flex-col justify-between overflow-hidden mb-6">
              <div className="absolute top-0 right-0 h-28 w-28 rounded-full bg-primary/10 blur-xl animate-pulse" />
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-primary font-mono tracking-widest uppercase">E-Kitap</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-sans">v1.2</span>
              </div>
              <div className="my-6 text-left">
                <h3 className="text-2xl font-black leading-tight tracking-tight text-foreground font-sans">
                  13 Adımda<br />
                  <span className="text-primary">Milyon Dolarlık</span><br />
                  Startup
                </h3>
                <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                  plansız kervan kurmaya son veren büyüme yol haritası.
                </p>
              </div>
              <div className="flex justify-between items-center border-t border-border/40 pt-3 text-left">
                <div className="flex items-center gap-1.5">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[8px]">
                    SD
                  </div>
                  <span className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wider">Eser Memişoğlu</span>
                </div>
              </div>
            </div>

            <h2 className="text-xl font-bold text-foreground">13 Adımda Milyon Dolarlık Startup</h2>
            <p className="text-xs text-muted-foreground mt-2 max-w-sm">
              Sürüm: 1.2 (Güncel) | Boyut: 4.8 MB | Format: Yüksek Çözünürlüklü PDF
            </p>

            <div className="w-full pt-6">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className={`w-full flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                  downloadSuccess 
                    ? "bg-emerald-500 text-white" 
                    : "bg-primary text-background hover:bg-primary/95 shadow-lg shadow-primary/15"
                }`}
              >
                {downloading ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-background border-t-transparent rounded-full" />
                    Hazırlanıyor...
                  </>
                ) : downloadSuccess ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Dosya İndirildi!
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    PDF Olarak İndir (Yüksek Çözünürlük)
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Stats Card */}
          <div className="glass-panel p-6 rounded-2xl border border-border/40 space-y-4">
            <h3 className="text-sm font-bold text-foreground border-b border-border/20 pb-2">Kitap Hakkında Bilgiler</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-secondary/15 rounded-xl border border-border/10">
                <span className="text-[10px] text-muted-foreground block uppercase font-bold tracking-wider">Toplam Sayfa</span>
                <span className="text-base font-extrabold text-foreground font-mono">148 Sayfa</span>
              </div>
              <div className="p-3 bg-secondary/15 rounded-xl border border-border/10">
                <span className="text-[10px] text-muted-foreground block uppercase font-bold tracking-wider">Bölüm Sayısı</span>
                <span className="text-base font-extrabold text-foreground font-mono">13 Bölüm</span>
              </div>
              <div className="p-3 bg-secondary/15 rounded-xl border border-border/10">
                <span className="text-[10px] text-muted-foreground block uppercase font-bold tracking-wider">Okuma Süresi</span>
                <span className="text-base font-extrabold text-foreground font-mono">~3.5 Saat</span>
              </div>
              <div className="p-3 bg-secondary/15 rounded-xl border border-border/10">
                <span className="text-[10px] text-muted-foreground block uppercase font-bold tracking-wider">Dil</span>
                <span className="text-base font-extrabold text-foreground font-mono">Türkçe</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Chapters & Outline */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-border/40">
            <h3 className="text-lg font-bold mb-4 text-foreground flex items-center gap-2 border-b border-border/20 pb-3">
              <BookOpen className="h-5 w-5 text-primary" /> İnteraktif Kitap Yapısı & Özetleri
            </h3>

            <p className="text-xs text-muted-foreground mb-6">
              Kitap içindeki bölümlere tıklayarak detaylı açıklamaları ve o bölümdeki ana kazanımları görebilirsiniz:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Chapters List */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {CHAPTERS.map((ch) => {
                  const isSelected = selectedChapter.num === ch.num;
                  return (
                    <button
                      key={ch.num}
                      onClick={() => setSelectedChapter(ch)}
                      className={`w-full flex items-center gap-3 text-left p-3 rounded-xl border transition-all text-xs ${
                        isSelected
                          ? "bg-primary/10 border-primary text-foreground font-bold"
                          : "bg-black/20 border-border/40 hover:bg-secondary/30 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span className={`h-6 w-6 rounded-lg font-mono font-bold flex items-center justify-center text-[10px] ${
                        isSelected ? "bg-primary text-background" : "bg-muted text-muted-foreground"
                      }`}>
                        {ch.num}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="truncate font-semibold">{ch.title}</div>
                        <div className="text-[10px] font-mono text-muted-foreground mt-0.5">Sayfa {ch.pages}</div>
                      </div>
                      <ChevronRight className="h-3 w-3 shrink-0 opacity-60" />
                    </button>
                  );
                })}
              </div>

              {/* Selected Chapter Detail Card */}
              <div className="p-5 rounded-2xl bg-secondary/10 border border-border/30 flex flex-col justify-between min-h-[300px]">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-mono font-bold text-primary tracking-widest bg-primary/5 border border-primary/20 px-2 py-0.5 rounded">
                      Bölüm {selectedChapter.num}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">Sayfa {selectedChapter.pages}</span>
                  </div>
                  
                  <h4 className="text-base font-bold text-foreground mb-3">{selectedChapter.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{selectedChapter.description}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-border/20 space-y-2">
                  <div className="flex items-center gap-2 text-[10px] text-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Pratik egzersiz ve şablon içerir.</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Yatırımcı onaylı kontrol listeleri.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
