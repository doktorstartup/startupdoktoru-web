"use client";

import React, { useState } from "react";
import { 
  Play, 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  FileText, 
  ExternalLink,
  ChevronRight,
  BookOpen,
  HelpCircle,
  Award,
  Video
} from "lucide-react";

// Curriculum Data
const MODULES = [
  {
    id: "m1",
    title: "Modül 01: Yatırımcı Beklentileri & Zihniyeti",
    lessons: [
      { id: "l1_1", title: "1.1 Yatırım Dünyasının Gizli Kuralları", duration: "12:45", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
      { id: "l1_2", title: "1.2 Yatırımcı Girişimcide Ne Arar?", duration: "15:20", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
      { id: "l1_3", title: "1.3 Bootstrapping vs Yatırım Alma", duration: "10:10", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
    ],
    resources: [
      { name: "Yatırımcı Beklenti Matrisi PDF", type: "document" },
      { name: "Bootstrapping Kontrol Listesi", type: "link" }
    ]
  },
  {
    id: "m2",
    title: "Modül 02: Kusursuz Problem & Çözüm Sunumu",
    lessons: [
      { id: "l2_1", title: "2.1 Yatırımcının İlgisini Çeken Problem Tanımı", duration: "14:30", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
      { id: "l2_2", title: "2.2 Çözümü Çarpıcı Şekilde Anlatmak", duration: "11:55", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
      { id: "l2_3", title: "2.3 Değer Önerisi (Value Proposition) Kurgusu", duration: "16:05", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
    ],
    resources: [
      { name: "Problem Doğrulama Anketi Şablonu", type: "document" }
    ]
  },
  {
    id: "m3",
    title: "Modül 03: Pazar Büyüklüğü & Rakip Analizi",
    lessons: [
      { id: "l3_1", title: "3.1 TAM, SAM, SOM Hesaplama Yöntemi", duration: "18:40", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
      { id: "l3_2", title: "3.2 Rakip Matrisi Oluşturma Kriterleri", duration: "13:12", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
    ],
    resources: [
      { name: "TAM SAM SOM Excel Şablonu", type: "spreadsheet" },
      { name: "Rakip Analiz Tablosu PPTX", type: "document" }
    ]
  },
  {
    id: "m4",
    title: "Modül 04: Gelir Modeli & Finansal Projeksiyonlar",
    lessons: [
      { id: "l4_1", title: "4.1 Startup Gelir Modelleri Hangileridir?", duration: "15:50", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
      { id: "l4_2", title: "4.2 5 Yıllık Finansal Öngörü Tablosu Hazırlama", duration: "22:15", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
    ],
    resources: [
      { name: "5 Yıllık Finansal Projeksiyon Modeli", type: "spreadsheet" }
    ]
  },
  {
    id: "m5",
    title: "Modül 05: Pitch Deck Tasarımı & Sunum Teknikleri",
    lessons: [
      { id: "l5_1", title: "5.1 Slayt Slayt Pitch Deck Anatomisi (13 Slayt)", duration: "25:30", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
      { id: "l5_2", title: "5.2 Sahne Duruşu ve Yatırımcı Sorularını Cevaplama", duration: "19:40", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
      { id: "l5_3", title: "5.3 Yatırım Sonrası Raporlama ve İletişim", duration: "12:10", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
    ],
    resources: [
      { name: "Premium Pitch Deck Sunum Şablonu (.fig / .pptx)", type: "document" },
      { name: "Yatırımcı Soru Bankası (Q&A)", type: "document" }
    ]
  }
];

export default function CoursePage() {
  const [selectedLesson, setSelectedLesson] = useState(MODULES[0].lessons[0]);
  const [selectedModule, setSelectedModule] = useState(MODULES[0]);
  const [completedLessons, setCompletedLessons] = useState<string[]>(["l1_1"]);
  const [activeTab, setActiveTab] = useState<"about" | "resources" | "homework">("about");

  const totalLessons = MODULES.reduce((acc, m) => acc + m.lessons.length, 0);
  const totalCompleted = completedLessons.length;
  const progressPercent = Math.round((totalCompleted / totalLessons) * 100);

  const toggleLessonComplete = (lessonId: string) => {
    if (completedLessons.includes(lessonId)) {
      setCompletedLessons(completedLessons.filter(id => id !== lessonId));
    } else {
      setCompletedLessons([...completedLessons, lessonId]);
    }
  };

  const handleLessonClick = (module: typeof MODULES[0], lesson: typeof MODULES[0]["lessons"][0]) => {
    setSelectedModule(module);
    setSelectedLesson(lesson);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <span className="text-primary text-xs font-bold font-mono tracking-widest uppercase">Müfredat Portalı</span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1 text-foreground">
            Yatırımcı Sunumu & Pitch Deck Eğitimi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Yatırımcıların karşısında duracak, 10 yıllık birikimle hazırlanan 5 modüllü pratik rehber.
          </p>
        </div>

        {/* Dynamic Progress Card */}
        <div className="glass-panel p-4 rounded-2xl flex items-center gap-4 border border-border/40 w-full md:w-auto min-w-[240px]">
          <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Award className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center text-xs font-bold mb-1">
              <span className="text-muted-foreground">Genel İlerleme</span>
              <span className="text-primary">{progressPercent}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div className="bg-primary h-1.5 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
            </div>
            <div className="text-[10px] text-muted-foreground mt-1 font-mono">
              {totalCompleted} / {totalLessons} Ders Tamamlandı
            </div>
          </div>
        </div>
      </div>

      {/* Course Interface Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Player & Lesson Info */}
        <div className="lg:col-span-8 space-y-6">
          {/* Elegant Dark Video Player Container */}
          <div className="relative aspect-video w-full rounded-2xl border border-border bg-black/60 shadow-2xl overflow-hidden group">
            {/* Real Youtube Video Iframe with privacy-enhanced mode */}
            <iframe 
              src={`${selectedLesson.videoUrl}?autoplay=0&rel=0&modestbranding=1`}
              title={selectedLesson.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            />
          </div>

          {/* Lesson Details Card */}
          <div className="glass-panel p-6 rounded-2xl border border-border/40">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/20 pb-4 mb-6">
              <div>
                <span className="text-primary text-[10px] font-mono font-bold tracking-widest uppercase bg-primary/5 border border-primary/20 px-2 py-0.5 rounded">
                  {selectedModule.title.split(":")[0]}
                </span>
                <h2 className="text-xl font-bold mt-2 text-foreground">{selectedLesson.title}</h2>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                  <Video className="h-3 w-3" /> {selectedLesson.duration} video süresi
                </div>
              </div>

              <button
                onClick={() => toggleLessonComplete(selectedLesson.id)}
                className={`flex items-center gap-2 h-10 px-4 rounded-xl text-xs font-bold transition-all duration-300 ${
                  completedLessons.includes(selectedLesson.id)
                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                    : "bg-primary text-background hover:bg-primary/95"
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                {completedLessons.includes(selectedLesson.id) ? "Tamamlandı olarak İşaretlendi" : "Dersi Tamamlandı İşaretle"}
              </button>
            </div>

            {/* Tab Controls */}
            <div className="flex border-b border-border/20 gap-6 mb-6">
              {[
                { id: "about", name: "Ders Detayı" },
                { id: "resources", name: "İndirilebilir Kaynaklar" },
                { id: "homework", name: "Eylem Adımı (Ödev)" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as "about" | "resources" | "homework")}
                  className={`pb-3 text-sm font-bold border-b-2 transition-all relative -mb-[2px] ${
                    activeTab === tab.id 
                      ? "border-primary text-primary" 
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div>
              {activeTab === "about" && (
                <div className="text-sm text-muted-foreground leading-relaxed space-y-4">
                  <p>
                    Bu derste, yatırımcılar ile yapılan ilk toplantılarda nasıl bir duruş sergilemeniz gerektiğini ve onların filtrelerinden nasıl başarıyla geçeceğinizi öğreniyorsunuz. Yatırımcıların zihnindeki "Bu ekip bu problemi gerçekten çözebilir mi?" ve "Bu pazar yeterince büyük mü?" sorularını cevaplamak bu dersin ana odak noktasıdır.
                  </p>
                  <p className="border-l-2 border-primary/30 pl-4 py-1 text-foreground italic bg-secondary/10 rounded-r-lg">
                    "Yatırımcılar sadece fikrinize değil, bu fikri hayata geçirebilecek operasyonel zekanıza ve pazar bilginize yatırım yapar."
                  </p>
                </div>
              )}

              {activeTab === "resources" && (
                <div className="space-y-3">
                  {selectedModule.resources && selectedModule.resources.length > 0 ? (
                    selectedModule.resources.map((res, i) => (
                      <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-secondary/20 border border-border/20 hover:border-primary/20 transition-all">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="text-sm font-bold text-foreground">{res.name}</span>
                        </div>
                        <a 
                          href="#" 
                          onClick={(e) => { e.preventDefault(); alert("Doküman indiriliyor (Mock file)."); }}
                          className="flex items-center gap-1.5 text-xs text-primary font-bold hover:underline"
                        >
                          İndir <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground py-4">Bu ders için indirilebilir kaynak bulunmamaktadır.</div>
                  )}
                </div>
              )}

              {activeTab === "homework" && (
                <div className="text-sm text-muted-foreground space-y-3">
                  <p className="font-bold text-foreground">📌 Bu Modülü Geçmek İçin Yapmanız Gerekenler:</p>
                  <ul className="list-disc list-inside space-y-2 text-xs">
                    <li>Dersle ilgili indirdiğiniz şablonu kendi startupınız için doldurun.</li>
                    <li>Slayt yapısını oluşturun ve 3 dakikalık bir demo sunum provası yapın.</li>
                    <li>Oluşturduğunuz taslağı PDF formatında kaydederek bir sonraki aşamaya hazır olun.</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Module & Lessons Sidebar List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-border/40">
            <h3 className="text-lg font-bold mb-4 text-foreground flex items-center gap-2 border-b border-border/20 pb-3">
              <BookOpen className="h-5 w-5 text-primary" /> Müfredat Akışı
            </h3>

            <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
              {MODULES.map((mod) => (
                <div key={mod.id} className="space-y-1.5">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider py-1">
                    {mod.title}
                  </div>
                  
                  <div className="space-y-1">
                    {mod.lessons.map((lesson) => {
                      const isSelected = selectedLesson.id === lesson.id;
                      const isCompleted = completedLessons.includes(lesson.id);

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => handleLessonClick(mod, lesson)}
                          className={`w-full flex items-center justify-between text-left p-3 rounded-xl border transition-all text-xs ${
                            isSelected
                              ? "bg-primary/10 border-primary text-foreground font-bold shadow-sm"
                              : "bg-black/20 border-border/40 hover:bg-secondary/30 hover:border-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span onClick={(e) => { e.stopPropagation(); toggleLessonComplete(lesson.id); }} className="shrink-0 cursor-pointer">
                              {isCompleted ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                              ) : (
                                <Circle className="h-4 w-4 text-muted-foreground/60 hover:text-primary" />
                              )}
                            </span>
                            <span className="truncate">{lesson.title}</span>
                          </div>
                          
                          <span className="text-[10px] font-mono shrink-0 ml-2 bg-secondary/50 px-1.5 py-0.5 rounded text-muted-foreground">
                            {lesson.duration}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
