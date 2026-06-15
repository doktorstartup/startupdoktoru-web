"use client";

import React, { useState } from "react";
import { 
  BookOpen, 
  FileText, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  ChevronRight,
  Globe,
  Settings,
  Eye,
  Calendar,
  Layers,
  ArrowRight
} from "lucide-react";

// Mock Initial Lessons
const INITIAL_LESSONS = [
  { id: "1", title: "Yatırım Dünyasının Gizli Kuralları", module: "Modül 01: Zihniyet", duration: "12:45", url: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  { id: "2", title: "Yatırımcı Girişimcide Ne Arar?", module: "Modül 01: Zihniyet", duration: "15:20", url: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  { id: "3", title: "Kusursuz Problem Tanımı", module: "Modül 02: Problem & Çözüm", duration: "14:30", url: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  { id: "4", title: "TAM, SAM, SOM Hesaplama", module: "Modül 03: Pazar & Rakip", duration: "18:40", url: "https://www.youtube.com/embed/dQw4w9WgXcQ" }
];

// Mock Initial Modules
const INITIAL_MODULES = [
  { id: "m1", name: "Modül 01: Zihniyet" },
  { id: "m2", name: "Modül 02: Problem & Çözüm" },
  { id: "m3", name: "Modül 03: Pazar & Rakip" },
  { id: "m4", name: "Modül 04: Ekip & Ekosistem" },
  { id: "m5", name: "Modül 05: Sunum Optimizasyonu" }
];

// Mock Initial Blog Posts
const INITIAL_POSTS = [
  { id: "p1", title: "Plansız Kurulan Girişimlerin Başarısızlık Nedenleri", slug: "plansiz-girisimlerin-basarisizlik-nedenleri", date: "02.06.2026", seoTitle: "Plansız Girişimler Neden Başarısız Olur?", seoDesc: "Girişimlerin %90'ının batma sebebi plansızlık. Büyüme stratejisini doğru kurgulamak için ipuçları." },
  { id: "p2", title: "Yatırımcıların Sunumlarda Aradığı 3 Temel Metrik", slug: "yatirimcilarin-aradigi-3-temel-metrik", date: "28.05.2026", seoTitle: "Yatırımcıların Aradığı 3 Temel Metrik - Startup Doktoru", seoDesc: "Yatırımcı pitch deck sunumlarında mutlaka bulunması gereken TAM, CAC ve LTV metriklerinin hesaplanışı." }
];

export default function ContentEditor() {
  const [activeMode, setActiveMode] = useState<"lms" | "blog">("lms");
  const [lessons, setLessons] = useState(INITIAL_LESSONS);
  const [posts, setPosts] = useState(INITIAL_POSTS);

  // Modules state
  const [courseModules, setCourseModules] = useState(INITIAL_MODULES);

  // Collapsible accordion state for modules
  const [expandedModules, setExpandedModules] = useState<string[]>(["m1"]);

  // Form states for adding/editing modules
  const [showAddModuleModal, setShowAddModuleModal] = useState(false);
  const [showEditModuleModal, setShowEditModuleModal] = useState<{ id: string, name: string } | null>(null);
  const [newModuleName, setNewModuleName] = useState("");

  // Form states for adding lesson
  const [showAddLessonModal, setShowAddLessonModal] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonModule, setNewLessonModule] = useState("");
  const [newLessonDuration, setNewLessonDuration] = useState("10:00");
  const [newLessonUrl, setNewLessonUrl] = useState("https://www.youtube.com/embed/dQw4w9WgXcQ");

  // Form states for editing lesson
  const [editingLesson, setEditingLesson] = useState<{ id: string, title: string, module: string, duration: string, url: string } | null>(null);

  // Form states for adding blog
  const [showAddBlogModal, setShowAddBlogModal] = useState(false);
  const [newBlogTitle, setNewBlogTitle] = useState("");
  const [newBlogSlug, setNewBlogSlug] = useState("");
  const [newBlogSeoTitle, setNewBlogSeoTitle] = useState("");
  const [newBlogSeoDesc, setNewBlogSeoDesc] = useState("");
  const [newBlogContent, setNewBlogContent] = useState("");

  // Form states for editing blog
  const [editingPost, setEditingPost] = useState<{ id: string, title: string, slug: string, seoTitle: string, seoDesc: string } | null>(null);

  // Handle Add Module
  const handleAddModuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleName.trim()) return;
    const newModule = {
      id: "m" + Date.now().toString(),
      name: newModuleName.trim()
    };
    setCourseModules([...courseModules, newModule]);
    setNewModuleName("");
    setShowAddModuleModal(false);
  };

  // Handle Edit Module
  const handleEditModuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModuleModal || !showEditModuleModal.name.trim()) return;
    setCourseModules(courseModules.map(m =>
      m.id === showEditModuleModal.id ? { ...m, name: showEditModuleModal.name.trim() } : m
    ));
    // Also update lessons that reference the old module name
    const oldModule = courseModules.find(m => m.id === showEditModuleModal.id);
    if (oldModule) {
      setLessons(lessons.map(l =>
        l.module === oldModule.name ? { ...l, module: showEditModuleModal.name.trim() } : l
      ));
    }
    setShowEditModuleModal(null);
  };

  // Handle Add Lesson
  const handleAddLessonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLessonTitle.trim()) return;

    const newLesson = {
      id: Date.now().toString(),
      title: newLessonTitle,
      module: newLessonModule.trim(),
      duration: newLessonDuration,
      url: newLessonUrl
    };

    setLessons([...lessons, newLesson]);
    setNewLessonTitle("");
    setShowAddLessonModal(false);
  };

  // Handle Edit Lesson
  const handleEditLessonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson || !editingLesson.title.trim()) return;

    setLessons(lessons.map(l => l.id === editingLesson.id ? { ...editingLesson, module: editingLesson.module.trim() } : l));
    setEditingLesson(null);
  };

  // Handle Add Blog Post
  const handleAddBlogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlogTitle.trim()) return;

    const newPost = {
      id: Date.now().toString(),
      title: newBlogTitle,
      slug: newBlogSlug || newBlogTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      date: new Date().toLocaleDateString("tr-TR"),
      seoTitle: newBlogSeoTitle || newBlogTitle,
      seoDesc: newBlogSeoDesc
    };

    setPosts([newPost, ...posts]);
    setNewBlogTitle("");
    setNewBlogSlug("");
    setNewBlogSeoTitle("");
    setNewBlogSeoDesc("");
    setNewBlogContent("");
    setShowAddBlogModal(false);
  };

  // Handle Edit Blog Post
  const handleEditBlogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost || !editingPost.title.trim()) return;

    setPosts(posts.map(p => p.id === editingPost.id ? {
      ...p,
      title: editingPost.title,
      slug: editingPost.slug || editingPost.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      seoTitle: editingPost.seoTitle,
      seoDesc: editingPost.seoDesc
    } : p));
    setEditingPost(null);
  };

  const handleDeleteLesson = (id: string) => {
    setLessons(lessons.filter(l => l.id !== id));
  };

  const handleDeletePost = (id: string) => {
    setPosts(posts.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-primary text-xs font-bold font-mono tracking-widest uppercase">Müfredat & Blog Yönetimi</span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1 text-foreground">İçerik & LMS Editörü</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ders videoları, eğitim modülleri ve SEO uyumlu blog yazılarının oluşturulup güncelleneceği stüdyo alanı.
          </p>
        </div>

        {/* View Selection Toggle */}
        <div className="flex gap-2 bg-secondary/30 p-1.5 rounded-xl border border-border/60">
          <button
            onClick={() => setActiveMode("lms")}
            className={`flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-bold transition-all ${
              activeMode === "lms"
                ? "bg-primary text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="h-4 w-4" /> LMS Müfredatı
          </button>
          <button
            onClick={() => setActiveMode("blog")}
            className={`flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-bold transition-all ${
              activeMode === "blog"
                ? "bg-primary text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="h-4 w-4" /> SEO Blog Yazıları
          </button>
        </div>
      </div>

      {/* MODAL: ADD LESSON */}
      {showAddLessonModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-border/40 p-6 space-y-4">
            <h3 className="text-lg font-bold text-foreground border-b border-border/20 pb-3">Yeni Ders Videosu Ekle</h3>
            
            <form onSubmit={handleAddLessonSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-muted-foreground mb-1 font-bold">Ders Başlığı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Modül 1.4: Yatırımcı Sunumu Neden Önemli?"
                  value={newLessonTitle}
                  onChange={(e) => setNewLessonTitle(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-black/40 border border-border/60 text-foreground focus:outline-none focus:border-primary text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-muted-foreground mb-1 font-bold">Eğitim Modülü</label>
                  <select
                    value={newLessonModule}
                    onChange={(e) => setNewLessonModule(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-black/40 border border-border/60 text-foreground focus:outline-none focus:border-primary text-xs"
                  >
                    <option value="">Modülsüz (Genel Ders)</option>
                    {courseModules.map((m) => (
                      <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1 font-bold">Ders Süresi</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: 14:15"
                    value={newLessonDuration}
                    onChange={(e) => setNewLessonDuration(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-black/40 border border-border/60 text-foreground focus:outline-none focus:border-primary text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1 font-bold">Video Embed URL (YouTube/Vimeo)</label>
                <input
                  type="text"
                  required
                  placeholder="https://www.youtube.com/embed/..."
                  value={newLessonUrl}
                  onChange={(e) => setNewLessonUrl(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-black/40 border border-border/60 text-foreground focus:outline-none focus:border-primary text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddLessonModal(false)}
                  className="h-10 px-4 rounded-xl border border-border hover:bg-secondary text-foreground font-bold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="h-10 px-4 rounded-xl bg-primary text-background font-bold"
                >
                  Dersi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD BLOG */}
      {showAddBlogModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl rounded-2xl border border-border/40 p-6 space-y-4">
            <h3 className="text-lg font-bold text-foreground border-b border-border/20 pb-3">Yeni Blog Yazısı Ekle</h3>
            
            <form onSubmit={handleAddBlogSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-muted-foreground mb-1 font-bold">Yazı Başlığı</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Girişimciler İçin Finansal Planlama Kılavuzu"
                    value={newBlogTitle}
                    onChange={(e) => setNewBlogTitle(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-black/40 border border-border/60 text-foreground focus:outline-none focus:border-primary text-xs"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1 font-bold">Slug (URL)</label>
                  <input
                    type="text"
                    placeholder="örn: finansal-planlama-kilavuzu"
                    value={newBlogSlug}
                    onChange={(e) => setNewBlogSlug(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-black/40 border border-border/60 text-foreground focus:outline-none focus:border-primary text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-muted-foreground mb-1 font-bold">SEO Title</label>
                  <input
                    type="text"
                    placeholder="Meta Başlığı (Arama sonuçları için)"
                    value={newBlogSeoTitle}
                    onChange={(e) => setNewBlogSeoTitle(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-black/40 border border-border/60 text-foreground focus:outline-none focus:border-primary text-xs"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1 font-bold">SEO Description</label>
                  <input
                    type="text"
                    placeholder="Meta Açıklaması (Max 160 karakter)"
                    value={newBlogSeoDesc}
                    onChange={(e) => setNewBlogSeoDesc(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-black/40 border border-border/60 text-foreground focus:outline-none focus:border-primary text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1 font-bold">Yazı İçeriği (Markdown / HTML)</label>
                <textarea
                  placeholder="Makale metnini buraya yazın..."
                  value={newBlogContent}
                  onChange={(e) => setNewBlogContent(e.target.value)}
                  className="w-full h-32 p-3 rounded-lg bg-black/40 border border-border/60 text-foreground focus:outline-none focus:border-primary text-xs resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBlogModal(false)}
                  className="h-10 px-4 rounded-xl border border-border hover:bg-secondary text-foreground font-bold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="h-10 px-4 rounded-xl bg-primary text-background font-bold"
                >
                  Makaleyi Yayınla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT LESSON */}
      {editingLesson && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-border/40 p-6 space-y-4">
            <h3 className="text-lg font-bold text-foreground border-b border-border/20 pb-3">Ders Videosunu Düzenle</h3>
            
            <form onSubmit={handleEditLessonSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-muted-foreground mb-1 font-bold">Ders Başlığı</label>
                <input
                  type="text"
                  required
                  value={editingLesson.title}
                  onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg bg-black/40 border border-border/60 text-foreground focus:outline-none focus:border-primary text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-muted-foreground mb-1 font-bold">Eğitim Modülü</label>
                  <select
                    value={editingLesson.module}
                    onChange={(e) => setEditingLesson({ ...editingLesson, module: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-black/40 border border-border/60 text-foreground focus:outline-none focus:border-primary text-xs"
                  >
                    <option value="">Modülsüz (Genel Ders)</option>
                    {courseModules.map((m) => (
                      <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1 font-bold">Ders Süresi</label>
                  <input
                    type="text"
                    required
                    value={editingLesson.duration}
                    onChange={(e) => setEditingLesson({ ...editingLesson, duration: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-black/40 border border-border/60 text-foreground focus:outline-none focus:border-primary text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1 font-bold">Video Embed URL (YouTube/Vimeo)</label>
                <input
                  type="text"
                  required
                  value={editingLesson.url}
                  onChange={(e) => setEditingLesson({ ...editingLesson, url: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg bg-black/40 border border-border/60 text-foreground focus:outline-none focus:border-primary text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingLesson(null)}
                  className="h-10 px-4 rounded-xl border border-border hover:bg-secondary text-foreground font-bold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="h-10 px-4 rounded-xl bg-primary text-background font-bold"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT BLOG */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl rounded-2xl border border-border/40 p-6 space-y-4">
            <h3 className="text-lg font-bold text-foreground border-b border-border/20 pb-3">Blog Yazısını Düzenle</h3>
            
            <form onSubmit={handleEditBlogSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-muted-foreground mb-1 font-bold">Yazı Başlığı</label>
                  <input
                    type="text"
                    required
                    value={editingPost.title}
                    onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-black/40 border border-border/60 text-foreground focus:outline-none focus:border-primary text-xs"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1 font-bold">Slug (URL)</label>
                  <input
                    type="text"
                    value={editingPost.slug}
                    onChange={(e) => setEditingPost({ ...editingPost, slug: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-black/40 border border-border/60 text-foreground focus:outline-none focus:border-primary text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-muted-foreground mb-1 font-bold">SEO Title</label>
                  <input
                    type="text"
                    value={editingPost.seoTitle}
                    onChange={(e) => setEditingPost({ ...editingPost, seoTitle: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-black/40 border border-border/60 text-foreground focus:outline-none focus:border-primary text-xs"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1 font-bold">SEO Description</label>
                  <input
                    type="text"
                    value={editingPost.seoDesc}
                    onChange={(e) => setEditingPost({ ...editingPost, seoDesc: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-black/40 border border-border/60 text-foreground focus:outline-none focus:border-primary text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
                  className="h-10 px-4 rounded-xl border border-border hover:bg-secondary text-foreground font-bold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="h-10 px-4 rounded-xl bg-primary text-background font-bold"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD MODULE */}
      {showAddModuleModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-border/40 p-6 space-y-4">
            <h3 className="text-lg font-bold text-foreground border-b border-border/20 pb-3">Yeni Eğitim Modülü Ekle</h3>
            
            <form onSubmit={handleAddModuleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-muted-foreground mb-1 font-bold">Modül Başlığı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Modül 06: Büyüme (Growth) Stratejileri"
                  value={newModuleName}
                  onChange={(e) => setNewModuleName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-black/40 border border-border/60 text-foreground focus:outline-none focus:border-primary text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModuleModal(false)}
                  className="h-10 px-4 rounded-xl border border-border hover:bg-secondary text-foreground font-bold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="h-10 px-4 rounded-xl bg-primary text-background font-bold"
                >
                  Modülü Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT MODULE */}
      {showEditModuleModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-border/40 p-6 space-y-4">
            <h3 className="text-lg font-bold text-foreground border-b border-border/20 pb-3">Modülü Düzenle</h3>
            
            <form onSubmit={handleEditModuleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-muted-foreground mb-1 font-bold">Modül Başlığı</label>
                <input
                  type="text"
                  required
                  value={showEditModuleModal.name}
                  onChange={(e) => setShowEditModuleModal({ ...showEditModuleModal, name: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg bg-black/40 border border-border/60 text-foreground focus:outline-none focus:border-primary text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModuleModal(null)}
                  className="h-10 px-4 rounded-xl border border-border hover:bg-secondary text-foreground font-bold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="h-10 px-4 rounded-xl bg-primary text-background font-bold"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {activeMode === "lms" ? (
        <div className="space-y-6">
          {/* Course Selector & Top Actions Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-secondary/15 p-4 rounded-xl border border-border/40">
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground text-xs font-bold">Yönetilen Eğitim:</span>
              <select className="bg-black/40 border border-border/60 rounded-lg text-xs font-bold text-foreground px-3 py-1.5 focus:outline-none focus:border-primary">
                <option value="course_1">Yatırımcı Sunumu & Pitch Deck Eğitimi</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setNewModuleName("");
                  setShowAddModuleModal(true);
                }}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-border hover:bg-secondary/40 px-4 text-xs font-bold text-foreground transition-all"
              >
                <Plus className="h-4 w-4 text-primary" /> Yeni Modül Ekle
              </button>
              <button
                onClick={() => {
                  setNewLessonTitle("");
                  setNewLessonModule("");
                  setShowAddLessonModal(true);
                }}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-bold text-background hover:bg-primary/95 transition-all shadow-lg shadow-primary/10"
              >
                <Plus className="h-4 w-4" /> Yeni Ders Ekle
              </button>
            </div>
          </div>

          {/* Accordion Modules List */}
          <div className="space-y-4">
            {/* virtual accordion for Modülsüz / Bağımsız Dersler */}
            {(() => {
              const unassignedLessons = lessons.filter(l => !l.module || l.module === "");
              if (unassignedLessons.length === 0) return null;
              
              const isUnassignedExpanded = expandedModules.includes("unassigned");
              
              return (
                <div className="glass-panel rounded-2xl border border-dashed border-border/40 overflow-hidden transition-all duration-300">
                  {/* Module Header */}
                  <div 
                    onClick={() => {
                      if (isUnassignedExpanded) {
                        setExpandedModules(expandedModules.filter(id => id !== "unassigned"));
                      } else {
                        setExpandedModules([...expandedModules, "unassigned"]);
                      }
                    }}
                    className="flex justify-between items-center p-5 cursor-pointer hover:bg-secondary/10 transition-colors select-none"
                  >
                    <div className="flex items-center gap-3">
                      {/* Chevron Indicator */}
                      <span className="text-primary text-xs shrink-0 select-none">
                        {isUnassignedExpanded ? "▼" : "▶"}
                      </span>
                      <div>
                        <h4 className="font-extrabold text-foreground text-sm tracking-tight italic text-primary/90">Modülsüz / Bağımsız Dersler</h4>
                        <span className="text-[10px] text-muted-foreground mt-0.5 block">{unassignedLessons.length} Ders Tanımlı</span>
                      </div>
                    </div>

                    {/* Header Actions */}
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setNewLessonTitle("");
                          setNewLessonModule("");
                          setShowAddLessonModal(true);
                        }}
                        className="h-8 px-2.5 rounded-lg bg-secondary hover:bg-primary/10 border border-border hover:border-primary/30 text-muted-foreground hover:text-primary text-[10px] font-bold inline-flex items-center gap-1 transition-all"
                      >
                        <Plus className="h-3 w-3" /> Ders Ekle
                      </button>
                    </div>
                  </div>

                  {/* Module Lessons (Expanded Content) */}
                  {isUnassignedExpanded && (
                    <div className="border-t border-border/20 bg-black/10 p-4 space-y-2">
                      <div className="divide-y divide-border/10">
                        {unassignedLessons.map((lesson, idx) => (
                          <div 
                            key={lesson.id}
                            className="flex justify-between items-center py-3 first:pt-1 last:pb-1 text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-primary/70 font-semibold">{String(idx + 1).padStart(2, '0')}.</span>
                              <div>
                                <div className="font-bold text-foreground">{lesson.title}</div>
                                <div className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate max-w-[280px]" title={lesson.url}>
                                  {lesson.url}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <span className="font-mono text-muted-foreground text-[10px] bg-secondary/40 px-2 py-0.5 rounded border border-border/30">
                                {lesson.duration}
                              </span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setEditingLesson(lesson)}
                                  className="h-8 w-8 rounded-lg bg-secondary hover:bg-primary/10 border border-border/80 hover:border-primary/30 text-muted-foreground hover:text-primary inline-flex items-center justify-center transition-all"
                                  title="Dersi Düzenle"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteLesson(lesson.id)}
                                  className="h-8 w-8 rounded-lg bg-red-950/20 hover:bg-red-500/10 border border-red-950/30 hover:border-red-500/30 text-red-400 inline-flex items-center justify-center transition-all"
                                  title="Dersi Sil"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {courseModules.map((mod) => {
              const isExpanded = expandedModules.includes(mod.id);
              const moduleLessons = lessons.filter(l => l.module === mod.name);

              return (
                <div key={mod.id} className="glass-panel rounded-2xl border border-border/40 overflow-hidden transition-all duration-300">
                  {/* Module Header */}
                  <div 
                    onClick={() => {
                      if (isExpanded) {
                        setExpandedModules(expandedModules.filter(id => id !== mod.id));
                      } else {
                        setExpandedModules([...expandedModules, mod.id]);
                      }
                    }}
                    className="flex justify-between items-center p-5 cursor-pointer hover:bg-secondary/10 transition-colors select-none"
                  >
                    <div className="flex items-center gap-3">
                      {/* Chevron Indicator */}
                      <span className="text-primary text-xs shrink-0 select-none">
                        {isExpanded ? "▼" : "▶"}
                      </span>
                      <div>
                        <h4 className="font-extrabold text-foreground text-sm tracking-tight">{mod.name}</h4>
                        <span className="text-[10px] text-muted-foreground mt-0.5 block">{moduleLessons.length} Ders Tanımlı</span>
                      </div>
                    </div>

                    {/* Header Actions */}
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setNewLessonTitle("");
                          setNewLessonModule(mod.name);
                          setShowAddLessonModal(true);
                        }}
                        className="h-8 px-2.5 rounded-lg bg-secondary hover:bg-primary/10 border border-border hover:border-primary/30 text-muted-foreground hover:text-primary text-[10px] font-bold inline-flex items-center gap-1 transition-all"
                      >
                        <Plus className="h-3 w-3" /> Ders Ekle
                      </button>
                      <button
                        onClick={() => setShowEditModuleModal({ id: mod.id, name: mod.name })}
                        className="h-8 w-8 rounded-lg bg-secondary hover:bg-primary/10 border border-border hover:border-primary/30 text-muted-foreground hover:text-primary inline-flex items-center justify-center transition-all"
                        title="Modülü Düzenle"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`"${mod.name}" modülünü ve içindeki tüm dersleri silmek istediğinize emin misiniz?`)) {
                            setCourseModules(courseModules.filter(m => m.id !== mod.id));
                            setLessons(lessons.filter(l => l.module !== mod.name));
                          }
                        }}
                        className="h-8 w-8 rounded-lg bg-red-950/20 hover:bg-red-500/10 border border-red-950/30 hover:border-red-500/30 text-red-400 inline-flex items-center justify-center transition-all"
                        title="Modülü Sil"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Module Lessons (Expanded Content) */}
                  {isExpanded && (
                    <div className="border-t border-border/20 bg-black/10 p-4 space-y-2">
                      {moduleLessons.length > 0 ? (
                        <div className="divide-y divide-border/10">
                          {moduleLessons.map((lesson, idx) => (
                            <div 
                              key={lesson.id}
                              className="flex justify-between items-center py-3 first:pt-1 last:pb-1 text-xs"
                            >
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-primary/70 font-semibold">{String(idx + 1).padStart(2, '0')}.</span>
                                <div>
                                  <div className="font-bold text-foreground">{lesson.title}</div>
                                  <div className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate max-w-[280px]" title={lesson.url}>
                                    {lesson.url}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <span className="font-mono text-muted-foreground text-[10px] bg-secondary/40 px-2 py-0.5 rounded border border-border/30">
                                  {lesson.duration}
                                </span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setEditingLesson(lesson)}
                                    className="h-8 w-8 rounded-lg bg-secondary hover:bg-primary/10 border border-border/80 hover:border-primary/30 text-muted-foreground hover:text-primary inline-flex items-center justify-center transition-all"
                                    title="Dersi Düzenle"
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteLesson(lesson.id)}
                                    className="h-8 w-8 rounded-lg bg-red-950/20 hover:bg-red-500/10 border border-red-950/30 hover:border-red-500/30 text-red-400 inline-flex items-center justify-center transition-all"
                                    title="Dersi Sil"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground text-xs italic">
                          Bu modülde henüz tanımlanmış bir ders bulunmamaktadır.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-secondary/10 p-4 rounded-xl border border-border/40">
            <div>
              <h3 className="font-bold text-foreground text-sm">SEO Blog Postları</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Toplam {posts.length} blog yazısı sisteme tanımlı.</p>
            </div>
            <button
              onClick={() => setShowAddBlogModal(true)}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-bold text-background hover:bg-primary/95 transition-all shadow-lg shadow-primary/10"
            >
              <Plus className="h-4 w-4" /> Yeni Makale Ekle
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post) => (
              <div key={post.id} className="glass-panel p-5 rounded-2xl border border-border/40 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> {post.date}
                    </span>
                    <span className="font-mono">{post.slug}</span>
                  </div>
                  
                  <h4 className="text-base font-bold text-foreground leading-snug">{post.title}</h4>
                  
                  {/* SEO Details Widget */}
                  <div className="p-3 bg-secondary/25 border border-border/30 rounded-xl space-y-1.5">
                    <div className="text-[10px] text-primary flex items-center gap-1">
                      <Globe className="h-3 w-3" /> SEO Meta Önizleme
                    </div>
                    <div className="text-foreground text-[10px] font-bold truncate">{post.seoTitle}</div>
                    <div className="text-muted-foreground text-[9px] line-clamp-2 leading-relaxed">{post.seoDesc}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-border/20 pt-4">
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                    YAYINDA
                  </span>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingPost({
                        id: post.id,
                        title: post.title,
                        slug: post.slug,
                        seoTitle: post.seoTitle || "",
                        seoDesc: post.seoDesc || ""
                      })}
                      className="h-8 w-8 rounded-lg bg-secondary hover:bg-primary/10 border border-border/80 hover:border-primary/30 text-muted-foreground hover:text-primary inline-flex items-center justify-center transition-all"
                      title="Düzenle"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="h-8 w-8 rounded-lg bg-red-950/20 hover:bg-red-500/10 border border-red-950/30 hover:border-red-500/30 text-red-400 inline-flex items-center justify-center transition-all"
                      title="Sil"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
