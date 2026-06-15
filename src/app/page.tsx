"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  BookOpen, 
  HelpCircle, 
  MessageSquare, 
  Play, 
  Sparkles, 
  ShieldCheck, 
  TrendingUp, 
  Users, 
  ChevronDown, 
  DollarSign, 
  FileText,
  AlertTriangle,
  Award
} from "lucide-react";
import { AIDrawer } from "../components/AIDrawer";

export default function Home() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isAiOpen, setIsAiOpen] = useState(false);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "Startup Doktoru tam olarak nedir?",
      a: "Startup Doktoru, girişimcilerin fikir aşamasından yatırım aşamasına kadar olan yolculuğunu sistematik hale getiren bir eğitim, mentörlük ve büyüme platformudur. Amacımız sadece teorik bilgi değil, uygulanabilir iş modelleri ve büyüme hunileri kurmanızı sağlamaktır."
    },
    {
      q: "E-Kitabı satın aldıktan sonra nasıl erişeceğim?",
      a: "E-Kitap satın alma işlemi tamamlandığında, anında dijital PDF indirme bağlantınız ekranda belirecektir. Ayrıca kayıt olduğunuz e-posta adresinize de otomatik olarak öğrenci portalı erişim linkiniz iletilecektir."
    },
    {
      q: "Yatırımcı Sunumu Eğitimi bana ne kazandırır?",
      a: "Bu eğitim, yatırımcıların bir sunumda (pitch deck) aradığı 5 temel odağı (Metrikler, Ekip, Problem-Çözüm, Pazar Büyüklüğü ve Finansal Yol Haritası) detaylandırır. Eğitimi tamamladığınızda yatırımcıları ikna edebilecek seviyede profesyonel bir sunum hazırlamış olursunuz."
    },
    {
      q: "Birebir danışmanlık hizmetini nasıl alabilirim?",
      a: "Danışmanlık modelimiz 'Değer Merdiveni' prensibine dayanır. Ücretsiz eğitim veya e-kitabımızı edindikten sonra panelimizden veya iletişim formundan doğrudan Startup Check-Up ve Growth Danışmanlığı talebi gönderebilirsiniz."
    }
  ];

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30 selection:text-primary">
      
      {/* ─── SLEEK HEADER ─── */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-background font-bold text-xl shadow-lg shadow-primary/20">
              SD
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              STARTUP<span className="text-primary">DOKTORU</span>
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#problem" className="hover:text-primary transition-colors">Problem</a>
            <a href="#value-ladder" className="hover:text-primary transition-colors">Çözümümüz</a>
            <a href="#ebook" className="hover:text-primary transition-colors">E-Kitap</a>
            <a href="#training" className="hover:text-primary transition-colors">Eğitimler</a>
            <a href="#about" className="hover:text-primary transition-colors">Hakkında</a>
          </nav>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsAiOpen(true)}
              className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border border-primary/20 bg-primary/10 text-primary hover:bg-primary hover:text-background transition-all duration-300"
            >
              <Sparkles className="h-3 w-3 animate-pulse" />
              <span>AI Mentor</span>
            </button>
            <Link 
              href="/ebook" 
              className="hidden sm:inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-background hover:bg-primary/90 transition-all shadow-md shadow-primary/20 hover:scale-[1.02] duration-300"
            >
              E-Kitap Al ($6)
            </Link>
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION ─── */}
      <section className="relative pt-24 pb-20 md:pt-36 md:pb-32 px-6 sm:px-8 max-w-7xl mx-auto">
        <div className="absolute top-0 left-1/4 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute top-20 right-1/4 -z-10 h-72 w-72 rounded-full bg-accent/5 blur-[120px]" />
        
        <div className="text-center max-w-4xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs text-primary font-semibold uppercase tracking-wider mb-6">
            <Award className="h-3.5 w-3.5" />
            10 Yıllık Startup ve Yatırım Tecrübesi
          </div>
          
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-8 font-sans">
            Kervan yolda değil,<br />
            <span className="bg-gradient-to-r from-primary via-[#38BDF8] to-accent bg-clip-text text-transparent">
              stratejiyle düzülür.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed mb-12">
            Girişimcilerin büyük kısmı plansızlık yüzünden batıyor. Startup Doktoru, teoriyi bir kenara bırakıp işinizi yatırımcıya ve müşteriye hazırlayacak uygulanabilir yol haritaları sunar.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link 
              href="/free-training" 
              className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-primary px-8 text-base font-bold text-background hover:bg-primary/95 transition-all shadow-lg shadow-primary/25 hover:scale-[1.03] duration-300"
            >
              <Play className="h-4 w-4 fill-current" />
              Ücretsiz Eğitime Katıl
            </Link>
            <Link 
              href="/ebook" 
              className="inline-flex h-14 items-center justify-center gap-2 rounded-xl border border-border/80 bg-secondary/30 px-8 text-base font-bold text-foreground hover:bg-secondary/60 transition-all hover:scale-[1.03] duration-300"
            >
              <BookOpen className="h-4 w-4 text-primary" />
              E-Kitabı İncele ($6)
            </Link>
          </div>
        </div>
      </section>

      {/* ─── PROBLEM SECTION ─── */}
      <section id="problem" className="py-20 md:py-28 bg-black/30 border-y border-border/10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-accent text-sm font-bold tracking-widest uppercase mb-2 block">Temel Sorunlar</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Girişimciler Neden Başarısız Oluyor?</h2>
            <p className="text-muted-foreground mt-4">Aylarca süren emeklerin heba olmasının ardındaki 4 ölümcül operasyonel gerçek:</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: AlertTriangle,
                title: "Yanlış Metrik Odaklılık",
                desc: "Gerçek ciro ve kullanıcı yerine sadece 'beğeni' ve sahte büyüme rakamlarını takip etmek."
              },
              {
                icon: AlertTriangle,
                title: "Yetersiz Yatırımcı Sunumu",
                desc: "Yatırımcının zihnindeki kritik 5 soruyu es geçerek 50 slaytlık sıkıcı sunumlar hazırlamak."
              },
              {
                icon: AlertTriangle,
                title: "Over-Engineering",
                desc: "Pazarın doğrulamadığı özellikler için aylarca kod yazıp pazara çıkışı ertelemek."
              },
              {
                icon: AlertTriangle,
                title: "Sistemsiz Büyüme",
                desc: "KPI, görev yönetimi ve doğru delegasyon kurmadan işin kendisini kaosa sürüklemek."
              }
            ].map((p, i) => (
              <div key={i} className="glass-panel p-8 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-red-500/5 blur-xl group-hover:bg-red-500/10 transition-all duration-300" />
                <div className="h-12 w-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-6">
                  <p.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VALUE LADDER (SOLUTION) ─── */}
      <section id="value-ladder" className="py-20 md:py-32 max-w-7xl mx-auto px-6 sm:px-8">
        <div className="max-w-3xl mx-auto text-center mb-20">
          <span className="text-primary text-sm font-bold tracking-widest uppercase mb-2 block">Güven Temelli Yolculuk</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Startup Değer Merdiveni</h2>
          <p className="text-muted-foreground mt-4">Platformumuzda doğrudan yüksek bütçeli satışlar yapmayız. Sizinle güven bağımızı adım adım büyütürüz:</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[
            {
              step: "Adım 01",
              title: "Ücretsiz Eğitim",
              desc: "Yatırımcıların karşısında yapılan en kritik hataları gösterip anında değer üretir.",
              price: "Ücretsiz",
              btnText: "Kayıt Ol",
              link: "/free-training"
            },
            {
              step: "Adım 02",
              title: "E-Kitap",
              desc: "13 kritik adımda milyon dolarlık bir startup kurmanın pratik el kitabını edinirsiniz.",
              price: "$6 USD",
              btnText: "Satın Al",
              link: "/ebook",
              highlight: true
            },
            {
              step: "Adım 03",
              title: "Online Eğitim",
              desc: "Adım adım yatırımcı sunumu ve pitch deck hazırlama müfredatına erişirsiniz.",
              price: "$49 USD",
              btnText: "Satın Al",
              link: "/investor-training"
            }
          ].map((item, idx) => (
            <div 
              key={idx} 
              className={`glass-panel p-8 rounded-2xl flex flex-col justify-between relative overflow-hidden ${
                item.highlight ? "border-primary/40 ring-1 ring-primary/20 scale-[1.02]" : "border-border/40"
              }`}
            >
              {item.highlight && (
                <div className="absolute top-0 right-0 bg-primary text-background font-bold text-[10px] px-3 py-1 rounded-bl-lg tracking-wider uppercase">
                  En Popüler
                </div>
              )}
              <div>
                <span className="text-primary/70 text-xs font-mono font-bold tracking-widest">{item.step}</span>
                <h3 className="text-2xl font-bold mt-2 mb-4">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">{item.desc}</p>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-foreground mb-6 font-mono">{item.price}</div>
                <Link 
                  href={item.link} 
                  className={`flex h-11 items-center justify-center rounded-xl text-sm font-bold w-full transition-all duration-300 ${
                    item.highlight 
                      ? "bg-primary text-background hover:bg-primary/90" 
                      : "border border-border/80 text-foreground hover:bg-secondary/40"
                  }`}
                >
                  {item.btnText}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── E-BOOK CONTEXT SECTION ─── */}
      <section id="ebook" className="py-20 md:py-32 bg-black/40 border-y border-border/10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 flex flex-col items-start">
            <span className="text-accent text-sm font-bold tracking-widest uppercase mb-2">Dijital Dönüşüm El Kitabı</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-6">
              13 Adımda Milyon Dolarlık Startup
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8 text-base">
              Bu kitap, son 10 yılda edindiğimiz inovasyon, yatırımcılık ve büyüme tecrübelerinin damıtılmış bir özetidir. Adım adım şirketinizin omurgasını nasıl kuracağınızı örneklerle öğretir.
            </p>

            <div className="grid grid-cols-2 gap-4 w-full mb-8">
              {[
                "01. Startup Zihniyeti",
                "02. Problem Doğrulama",
                "03. MVP Geliştirme",
                "04. İlk Müşteri Bulma",
                "05. Ürün-Pazar Uyumu",
                "06. Büyüme (Growth) Sistemleri",
                "07. Funnel Kurulumu",
                "08. KPI / Görev Yönetimi",
                "09. Operasyon Sistemleri",
                "10. Delegasyon & AI Dönüşümü"
              ].map((ch, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                  <span>{ch}</span>
                </div>
              ))}
            </div>

            <Link 
              href="/ebook" 
              className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-primary px-8 text-base font-bold text-background hover:bg-primary/95 transition-all shadow-lg shadow-primary/20"
            >
              E-Kitabı İndir ($6 USD)
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="lg:col-span-6 flex justify-center">
            {/* STUNNING 3D E-BOOK CARD MOCK */}
            <div className="relative h-96 w-72 rounded-2xl bg-gradient-to-br from-[#0F213A] to-background border border-primary/20 shadow-2xl p-8 flex flex-col justify-between overflow-hidden group">
              <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-primary/10 blur-2xl" />
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-primary font-mono tracking-widest uppercase">E-Book</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent">Sistem Kitabı</span>
              </div>
              <div className="my-8">
                <h3 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground font-sans">
                  13 Adımda<br />
                  <span className="text-primary font-bold">Milyon Dolarlık</span><br />
                  Startup
                </h3>
                <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                  plansız kervan kurmaya son veren büyüme yol haritası.
                </p>
              </div>
              <div className="flex justify-between items-center border-t border-border/40 pt-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">
                    SD
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Eser Memişoğlu</span>
                </div>
                <div className="text-lg font-bold font-mono text-accent">$6.00</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── INVESTOR TRAINING SECTION ─── */}
      <section id="training" className="py-20 md:py-32 max-w-7xl mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 order-2 lg:order-1 flex justify-center">
            {/* Visual dynamic mock of the course video player */}
            <div className="w-full max-w-lg aspect-video rounded-2xl border border-border bg-[#0E1726]/40 p-4 relative overflow-hidden group shadow-2xl">
              <div className="w-full h-full rounded-lg bg-black/60 border border-border/40 relative flex items-center justify-center">
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Modül 01: Yatırımcı Beklentileri</span>
                </div>
                <Play className="h-16 w-16 text-primary border border-primary/20 rounded-full p-4 hover:scale-110 transition-transform duration-300 shadow-lg shadow-primary/25 cursor-pointer" />
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 order-1 lg:order-2 flex flex-col items-start">
            <span className="text-primary text-sm font-bold tracking-widest uppercase mb-2">Video Eğitim Modülü</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-6">
              Yatırımcı Sunumu Hazırlama Eğitimi
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8 text-base">
              Yatırımcılardan fon toplamanın sırrı slaytların süslü olmasında değil, rakamların arkasındaki stratejidedir. Bu video eğitim paketiyle pitch deck sunumlarınızı kusursuzlaştırın.
            </p>

            <div className="space-y-4 mb-8 w-full">
              {[
                { m: "Modül 1", t: "Yatırımcı Beklentileri & Doğru Metrikler" },
                { m: "Modül 2", t: "Problem Anlatımı & Çözüm Sunumu" },
                { m: "Modül 3", t: "Rakip Analizi & Konumlandırma Stratejisi" },
                { m: "Modül 4", t: "Ekip Hikayesini Anlatma & Güven" },
                { m: "Modül 5", t: "Analiz, Kritik Hatalar & Optimizasyon" }
              ].map((mod, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-secondary/15 hover:border-primary/25 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold font-mono text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/25">{mod.m}</span>
                    <span className="text-sm font-bold text-foreground">{mod.t}</span>
                  </div>
                  <Play className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              ))}
            </div>

            <Link 
              href="/investor-training" 
              className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-primary px-8 text-base font-bold text-background hover:bg-primary/95 transition-all shadow-lg shadow-primary/20"
            >
              Eğitime Başla ($49 USD)
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── ABOUT FOUNDER SECTION ─── */}
      <section id="about" className="py-20 md:py-32 bg-black/40 border-y border-border/10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 flex flex-col items-start">
            <span className="text-accent text-sm font-bold tracking-widest uppercase mb-2">Startup Doktoru Hakkında</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-6">Eser Memişoğlu</h2>
            <p className="text-muted-foreground leading-relaxed mb-6 text-base">
              Son 10 yıldır startup, teknoloji, inovasyon ve yatırım ilişkileri alanlarında aktif rol oynamaktayım. Bugüne kadar 3 farklı teknoloji şirketinin kuruculuğunu üstlendim, onlarca girişimciye ve scale-up markaya sistem kurulumu konusunda yol arkadaşlığı yaptım.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8 text-base">
              İşlerin plansız ve 'kervan yolda düzülür' diyerek yürütülmesine karşıyım. Startup Doktoru platformu ile edindiğim en kritik dersleri ürünleştirerek, iş modelinizi yatırım alabilecek ve kârlı bir şekilde ölçeklenebilecek otonom bir sisteme dönüştürmeyi hedefliyorum.
            </p>
            
            <div className="flex items-center gap-6">
              <div>
                <p className="text-3xl font-extrabold font-mono text-primary">10+</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">Yıl Tecrübe</p>
              </div>
              <div className="h-10 w-px bg-border/40" />
              <div>
                <p className="text-3xl font-extrabold font-mono text-primary">3</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">Girişim Kurulumu</p>
              </div>
              <div className="h-10 w-px bg-border/40" />
              <div>
                <p className="text-3xl font-extrabold font-mono text-primary">100+</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">Girişimci Mentorluk</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 flex justify-center">
            {/* Elegant placeholder mock for founder portrait */}
            <div className="h-96 w-80 rounded-3xl bg-gradient-to-br from-[#0F213A] to-background border border-border shadow-2xl relative overflow-hidden flex flex-col justify-end p-8 group">
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
              
              {/* Turquoise accent elements representing tech background */}
              <div className="absolute top-8 left-8 h-12 w-12 rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center text-primary">
                <Sparkles className="h-5 w-5 animate-pulse" />
              </div>
              
              <div className="relative z-20">
                <span className="text-xs font-extrabold text-primary font-mono tracking-widest uppercase block mb-1">Kurucu & Girişim Danışmanı</span>
                <h4 className="text-2xl font-bold text-foreground">Eser Memişoğlu</h4>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  İnovasyon, Finansman, Yatırımcı İlişkileri ve Growth Sistemleri üzerine çalışmalarına devam ediyor.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ SECTION ─── */}
      <section className="py-20 md:py-32 max-w-4xl mx-auto px-6 sm:px-8">
        <div className="text-center mb-16">
          <span className="text-primary text-sm font-bold tracking-widest uppercase mb-2 block">Merak Edilenler</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Sıkça Sorulan Sorular</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="glass-panel rounded-2xl border border-border/60 overflow-hidden transition-all duration-300">
              <button 
                onClick={() => toggleFaq(i)}
                className="flex items-center justify-between w-full p-6 text-left font-bold text-lg text-foreground hover:text-primary transition-colors focus:outline-none"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${activeFaq === i ? "rotate-180 text-primary" : ""}`} />
              </button>
              
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${activeFaq === i ? "max-h-48 border-t border-border/40" : "max-h-0"}`}>
                <p className="p-6 text-sm leading-relaxed text-muted-foreground bg-[#0E1726]/10">
                  {faq.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FINAL CTA SECTION ─── */}
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-6 sm:px-8 mb-20">
        <div className="relative rounded-3xl bg-gradient-to-r from-[#0F213A] to-[#0A192F] border border-primary/20 shadow-2xl p-12 md:p-20 text-center overflow-hidden flex flex-col items-center">
          <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl -z-10" />
          <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-accent/5 blur-3xl -z-10" />
          
          <span className="text-accent text-xs font-extrabold tracking-widest uppercase mb-3 px-3 py-1 rounded-full border border-accent/20 bg-accent/5">
            Otomatik Büyüme Makinesi
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight max-w-3xl mb-8">
            Girişiminizi yatırım alınabilir, kârlı bir sisteme dönüştürmeye hazır mısınız?
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl leading-relaxed mb-12">
            Teoride kalmayın. Startup Doktoru'nun pratik el kitapları, video eğitim modülleri ve otomatik büyüme stratejileri ile bugün işinizi bir üst kademeye taşıyın.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link 
              href="/free-training" 
              className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-primary px-8 text-base font-bold text-background hover:bg-primary/95 transition-all shadow-lg shadow-primary/20 hover:scale-[1.02] duration-300"
            >
              Ücretsiz Eğitime Başla
            </Link>
            <Link 
              href="/ebook" 
              className="inline-flex h-14 items-center justify-center gap-2 rounded-xl border border-border bg-secondary/40 px-8 text-base font-bold text-foreground hover:bg-secondary/70 transition-all hover:scale-[1.02] duration-300"
            >
              E-Kitabı Edin ($6)
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border/40 py-12 bg-black/20">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-background font-bold text-sm">
              SD
            </div>
            <span className="text-base font-bold tracking-tight text-foreground">
              STARTUP<span className="text-primary">DOKTORU</span>
            </span>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            © 2026 Startup Doktoru. Tüm Hakları Saklıdır. "Kervan yolda değil, stratejiyle düzülür."
          </p>

          <div className="flex gap-6 text-xs text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Gizlilik Politikası</a>
            <a href="#" className="hover:text-primary transition-colors">Mesafeli Satış Sözleşmesi</a>
            <a href="#" className="hover:text-primary transition-colors">Kullanım Şartları</a>
          </div>
        </div>
      </footer>

      {/* ─── AI FLOATING MENTOR DRAWER ─── */}
      <AIDrawer isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />

    </div>
  );
}
