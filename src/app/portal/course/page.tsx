"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, CheckCircle2, Circle, Play, Loader2, ShoppingCart, GraduationCap, ChevronLeft, ChevronDown, BookOpen, ArrowRight } from "lucide-react";
import { BunnyEmbed } from "../../../components/BunnyEmbed";
import { YouTubeEmbed } from "../../../components/YouTubeEmbed";
import { MemberLogin } from "../../../components/MemberLogin";
import { TRAININGS, DISCOUNTED_TRAINING_PRICE, trainingPoster, type Training } from "../../../lib/trainings";
import { VIDEOS } from "../../../lib/videos";
import { useMember, getProgress, saveProgress, tagInterest } from "../../../lib/member";

export default function CoursePortal() {
  const { member, loading, hasAccess } = useMember();
  const email = member?.email || "";

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    if (!email) return;
    setCompleted(getProgress(email).completed);
  }, [email]);

  const progressFor = (t: Training) => {
    const ids = t.lessons.map((l) => l.id);
    const done = completed.filter((c) => ids.includes(c)).length;
    return { done, total: ids.length, pct: ids.length ? Math.round((done / ids.length) * 100) : 0 };
  };

  if (loading) {
    return <div className="flex items-center justify-center py-32 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }
  if (!member) {
    return <MemberLogin />;
  }

  const owned = TRAININGS.filter((t) => hasAccess(t.id));
  const notOwned = TRAININGS.filter((t) => !hasAccess(t.id));
  const ownsEbook = hasAccess("ebook_13_steps");

  const openTraining = (id: string, lessonId?: string) => {
    setActiveId(id);
    const t = TRAININGS.find((x) => x.id === id);
    if (t && hasAccess(id)) {
      if (lessonId) {
        setActiveLessonId(lessonId);
        saveProgress(email, { completed, last: lessonId });
      } else {
        const p = getProgress(email);
        const last = t.lessons.find((l) => l.id === p.last) || t.lessons[0];
        setActiveLessonId(last?.id || null);
      }
    } else {
      setActiveLessonId(null); // tanıtım modu
    }
  };

  const selectLesson = (lessonId: string) => {
    setActiveLessonId(lessonId);
    saveProgress(email, { completed, last: lessonId });
  };

  const toggleComplete = (lessonId: string) => {
    const next = completed.includes(lessonId) ? completed.filter((id) => id !== lessonId) : [...completed, lessonId];
    setCompleted(next);
    saveProgress(email, { completed: next, last: lessonId });
  };

  // ─── ÜCRETSİZ EĞİTİM GÖRÜNÜMÜ ───
  if (activeId === "free") {
    return (
      <div className="space-y-6">
        <button onClick={() => setActiveId(null)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ChevronLeft className="h-4 w-4" /> Eğitimlerim
        </button>
        <div>
          <span className="text-emerald-400 text-xs font-bold font-mono tracking-widest uppercase">Ücretsiz Eğitim</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">Yatırımcı Karşısında Yapılan 7 Ölümcül Hata</h1>
        </div>
        <div className="aspect-video rounded-2xl border border-border/60 bg-black/40 overflow-hidden shadow-2xl max-w-4xl">
          <YouTubeEmbed
            videoId={VIDEOS.freeTraining12min}
            title="12 Dakikalık Ücretsiz Eğitim"
            label="Eğitimi Başlat (12 Dakika)"
            poster={{ badge: "Ücretsiz · 12 Dakika", title: "Yatırımcı Karşısında Yapılan 7 Ölümcül Hata", accent: "emerald" }}
          />
        </div>
      </div>
    );
  }

  // ─── EĞİTİM GÖRÜNÜMÜ (bir kart açıldığında) ───
  if (activeId) {
    const t = TRAININGS.find((x) => x.id === activeId)!;
    const ownsT = hasAccess(t.id);
    const lesson = ownsT ? t.lessons.find((l) => l.id === activeLessonId) : null;

    return (
      <div className="space-y-6">
        <button onClick={() => setActiveId(null)} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ChevronLeft className="h-4 w-4" /> Eğitimlerim
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Player */}
          <div className="lg:col-span-8 order-1">
            <div className="aspect-video rounded-2xl border border-border/60 bg-black/40 overflow-hidden shadow-2xl">
              {lesson ? (
                <BunnyEmbed videoId={lesson.bunnyId} title={lesson.title} />
              ) : t.previewYouTube ? (
                <YouTubeEmbed videoId={t.previewYouTube} title={`${t.title} — Tanıtım`} label="Tanıtımı İzle" onPlay={() => tagInterest(email, t.id)} poster={trainingPoster(t.id)} />
              ) : (
                <BunnyEmbed videoId={t.previewVideo} title={`${t.title} — Tanıtım`} label="Tanıtımı İzle" onPlay={() => tagInterest(email, t.id)} poster={trainingPoster(t.id)} />
              )}
            </div>

            {lesson ? (
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">{t.title}</p>
                  <h2 className="text-lg font-bold">{lesson.title}</h2>
                </div>
                <button onClick={() => toggleComplete(lesson.id)} className={`btn ${completed.includes(lesson.id) ? "btn-secondary" : "btn-primary"} shrink-0`}>
                  {completed.includes(lesson.id) ? (<><CheckCircle2 className="h-4 w-4" /> Tamamlandı</>) : (<><Circle className="h-4 w-4" /> Tamamlandı işaretle</>)}
                </button>
              </div>
            ) : (
              <div className="mt-4 glass-panel rounded-2xl border border-primary/20 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold">{t.title}</h2>
                  <p className="text-sm text-muted-foreground">{t.tagline}</p>
                </div>
                <Link href="/egitimler" className="btn btn-primary shrink-0">
                  <ShoppingCart className="h-4 w-4" /> {t.price} $ <span className="text-xs opacity-80">/ e-kitapla {DISCOUNTED_TRAINING_PRICE} $</span>
                </Link>
              </div>
            )}
          </div>

          {/* Ders listesi (sahipse) */}
          {ownsT && (
            <div className="lg:col-span-4 order-2">
              <div className="glass-panel rounded-2xl border border-border/40 overflow-hidden">
                <div className="px-4 py-3 border-b border-border/30 text-sm font-bold flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" /> Bölümler
                </div>
                <div className="p-2">
                  {t.lessons.map((l) => {
                    const active = activeLessonId === l.id;
                    const done = completed.includes(l.id);
                    return (
                      <button key={l.id} onClick={() => selectLesson(l.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-xs transition-all ${active ? "bg-primary/15 text-foreground" : "hover:bg-secondary/40 text-muted-foreground"}`}>
                        {done ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> : <Play className="h-3.5 w-3.5 text-primary shrink-0" />}
                        <span className="flex-1">{l.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── PANO (kart görünümü) ───
  return (
    <div className="space-y-10">
      <div>
        <span className="text-primary text-xs font-bold font-mono tracking-widest uppercase">Eğitim Panelim</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">Hoş geldin 👋</h1>
      </div>

      {/* Eğitimlerim */}
      <div>
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Eğitimlerim</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Ücretsiz eğitim — her üyeye açık */}
            <button onClick={() => setActiveId("free")} className="glass-panel rounded-2xl border border-border/40 hover:border-emerald-500/40 transition-all p-5 text-left flex flex-col group">
              <div className="flex items-center justify-between mb-3">
                <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400"><Play className="h-5 w-5 fill-current" /></div>
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Ücretsiz</span>
              </div>
              <h3 className="font-bold text-foreground mb-1 group-hover:text-emerald-400 transition-colors">12 Dakikalık Ücretsiz Eğitim</h3>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 flex-1">Yatırımcı karşısında yapılan 7 ölümcül hata.</p>
              <span className="mt-4 text-sm font-bold text-emerald-400 inline-flex items-center gap-1">İzle <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" /></span>
            </button>

            {owned.map((t) => {
              const pr = progressFor(t);
              const isOpen = expanded === t.id;
              return (
                <div key={t.id} className="glass-panel rounded-2xl border border-border/40 hover:border-primary/40 transition-all p-5 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary"><GraduationCap className="h-5 w-5" /></div>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Sahip</span>
                  </div>
                  <h3 className="font-bold text-foreground mb-1">{t.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 flex-1">{t.tagline}</p>
                  <div className="mt-4">
                    <div className="flex justify-between text-[11px] mb-1.5">
                      <span className="text-muted-foreground">İlerleme</span>
                      <span className="font-bold text-primary">%{pr.pct} · {pr.done}/{pr.total}</span>
                    </div>
                    <div className="w-full bg-secondary/40 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${pr.pct}%` }} />
                    </div>
                  </div>

                  {/* Açılır bölüm menüsü */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : t.id)}
                    className="mt-4 flex items-center justify-between w-full text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-1"
                  >
                    <span>Bölümler ({t.lessons.length})</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="mt-1 space-y-0.5 border-t border-border/20 pt-2">
                      {t.lessons.map((l) => {
                        const done = completed.includes(l.id);
                        return (
                          <button key={l.id} onClick={() => openTraining(t.id, l.id)}
                            className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left text-xs text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-all">
                            {done ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> : <Play className="h-3 w-3 text-primary shrink-0" />}
                            <span className="flex-1">{l.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <button onClick={() => openTraining(t.id)} className="mt-4 btn btn-primary btn-sm w-full">
                    {pr.done > 0 ? "Devam Et" : "İzlemeye Başla"} <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              );
            })}

            {ownsEbook && (
              <Link href="/portal/ebook" className="glass-panel rounded-2xl border border-border/40 hover:border-accent/40 transition-all p-5 flex flex-col group">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-11 w-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent"><BookOpen className="h-5 w-5" /></div>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Sahip</span>
                </div>
                <h3 className="font-bold text-foreground mb-1 group-hover:text-accent transition-colors">13 Adımda Milyon Dolarlık Startup</h3>
                <p className="text-xs text-muted-foreground leading-relaxed flex-1">E-kitabını site içinde oku.</p>
                <span className="mt-4 text-sm font-bold text-accent inline-flex items-center gap-1">Oku <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" /></span>
              </Link>
            )}
          </div>
        </div>

      {/* Diğer eğitimler (sahip olunmayan) */}
      {notOwned.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
            {owned.length > 0 ? "Diğer Eğitimler" : "Eğitimler"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {notOwned.map((t) => (
              <div key={t.id} className="glass-panel rounded-2xl border border-border/40 p-5 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-11 w-11 rounded-xl bg-secondary/40 border border-border/40 flex items-center justify-center text-muted-foreground"><Lock className="h-5 w-5" /></div>
                  <span className="text-sm font-extrabold font-mono text-primary">{t.price} $</span>
                </div>
                <h3 className="font-bold text-foreground mb-1">{t.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 flex-1">{t.tagline}</p>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => openTraining(t.id)} className="btn btn-secondary btn-sm flex-1">
                    <Play className="h-3.5 w-3.5" /> Tanıtım
                  </button>
                  <Link href="/egitimler" className="btn btn-primary btn-sm flex-1">
                    <ShoppingCart className="h-3.5 w-3.5" /> Satın Al
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">E-kitap sahibi olanlar tüm eğitimlerde %50 indirimli ({DISCOUNTED_TRAINING_PRICE} $).</p>
        </div>
      )}
    </div>
  );
}
